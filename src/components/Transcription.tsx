'use client';

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

declare var SpeechRecognition: any;
declare var webkitSpeechRecognition: any;

import React, { useState, useEffect, useRef } from 'react';

type Props = {
    onTranscriptChange: (text: string) => void;
};

const LANGUAGES = [
    { code: 'fr-FR', label: 'Français (French)' },
    { code: 'en-US', label: 'English (US)' },
    { code: 'es-ES', label: 'Español (Spanish)' },
    { code: 'de-DE', label: 'Deutsch (German)' },
];

export default function Transcription({ onTranscriptChange }: Props) {
    const [ isListening, setIsListening ] = useState(false);
    const [ language, setLanguage ] = useState<string>('fr-FR'); // Default to French
    const [ transcript, setTranscript ] = useState('');
    const [ message, setMessage ] = useState('Click Start and speak to transcribe.');
    const recognition = useRef<any>(null);

    // A ref to hold the latest transcript to avoid stale closure in onresult
    const transcriptRef = useRef('');
    transcriptRef.current = transcript;

    useEffect(() => {
        if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
            alert('Your browser does not support the Speech Recognition API');
            return;
        }

        // Clean up previous instance
        if (recognition.current) {
            recognition.current.onresult = null;
            recognition.current.onerror = null;
            recognition.current.onend = null;
            recognition.current.stop();
            recognition.current = null;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recog = new SpeechRecognition();
        recognition.current = recog;

        recog.lang = language;
        recog.continuous = true;
        recog.interimResults = true;

        recog.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';
            console.log('Speech recognition result:', event.results);
            
            // Loop through results starting at the resultIndex
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcriptSegment = event.results[ i ][ 0 ].transcript;
                if (event.results[ i ].isFinal) {
                    finalTranscript += transcriptSegment + ' ';
                } else {
                    interimTranscript += transcriptSegment;
                }
            }

            if (finalTranscript) {
                setTranscript((prev) => {
                    const updated = prev + finalTranscript;
                    transcriptRef.current = updated;
                    onTranscriptChange(updated);
                    return updated;
                });
            }

            if (interimTranscript) {
                // concat interim to latest transcript from ref, not stale state
                onTranscriptChange(transcriptRef.current + interimTranscript);
            }
        };

        recog.onerror = (event: any) => {
            if (event.error === 'no-speech') {
                setMessage('No speech detected. Please try speaking again.');
            } else if (event.error === 'aborted') {
                setMessage('Listening stopped.');
            } else {
                setMessage(`Speech recognition error: ${ event.error }`);
                console.error('Speech recognition error:', event.error);
            }
        };

        recog.onend = () => {
            if (isListening) {
                try {
                    recog.start();
                    setMessage('Listening...');
                } catch {
                    // ignore errors when restarting
                }
            } else {
                setMessage('Speech recognition stopped.');
            }
        };

        if (isListening) {
            try {
                recog.start();
                setMessage('Listening...');
            } catch {
                setMessage('Failed to start speech recognition. Try again.');
            }
        }

        return () => {
            if (recognition.current) {
                recognition.current.onresult = null;
                recognition.current.onerror = null;
                recognition.current.onend = null;
                recognition.current.stop();
                recognition.current = null;
            }
        };
    }, [ language, isListening, onTranscriptChange ]);

    const toggleListening = () => {
        setMessage('');
        if (isListening) {
            recognition.current?.stop();
            setIsListening(false);
        } else {
            setTranscript('');
            onTranscriptChange('');
            setIsListening(true);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="language-select" className="block font-medium mb-1">
                    Select Recognition Language:
                </label>
                <select
                    id="language-select"
                    value={ language }
                    onChange={ (e) => setLanguage(e.target.value) }
                    className="border rounded p-2"
                    disabled={ isListening }
                >
                    { LANGUAGES.map(({ code, label }) => (
                        <option key={ code } value={ code }>
                            { label }
                        </option>
                    )) }
                </select>
            </div>

            <button onClick={ toggleListening } className="bg-blue-600 text-white px-4 py-2 rounded">
                { isListening ? 'Stop Listening' : 'Start Listening' }
            </button>

            <div className="border rounded p-2 h-40 overflow-auto bg-gray-50 text-gray-800 whitespace-pre-wrap break-words">
                { transcript || 'Your live transcription will appear here...' }
            </div>

            <div className="text-sm text-gray-600">{ message }</div>
        </div>
    );
}
