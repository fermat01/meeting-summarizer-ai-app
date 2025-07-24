'use client';

import React, { useState, useEffect, useRef } from 'react';

type Props = {
    onTranscriptChange: (text: string) => void;
};

const LANGUAGES = [
    { code: 'fr-FR', label: 'Français (French)' },
    { code: 'en-US', label: 'English (US)' },
    { code: 'es-ES', label: 'Español (Spanish)' },
    { code: 'de-DE', label: 'Deutsch (German)' },
    // Add more languages as needed
];

export default function Transcription({ onTranscriptChange }: Props) {
    const [ isListening, setIsListening ] = useState(false);
    const [ language, setLanguage ] = useState<string>('fr-FR'); // Default to French
    const [ transcript, setTranscript ] = useState('');
    const recognition = useRef<any>(null);

    // Create or restart recognition on language change or start/stop listening
    useEffect(() => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            alert('Your browser does not support the Speech Recognition API');
            return;
        }

        // Cleanup existing instance if any
        recognition.current?.stop();
        recognition.current = null;

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognition.current = new SpeechRecognition();
        recognition.current.lang = language;
        recognition.current.continuous = true;
        recognition.current.interimResults = true;

        recognition.current.onresult = (event: any) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcriptSegment = event.results[ i ][ 0 ].transcript;
                if (event.results[ i ].isFinal) {
                    setTranscript((prev) => {
                        const updated = prev + transcriptSegment + ' ';
                        onTranscriptChange(updated);
                        return updated;
                    });
                } else {
                    interimTranscript += transcriptSegment;
                    onTranscriptChange(transcript + interimTranscript);
                }
            }
        };

        recognition.current.onerror = (event: any) => {
            if (event.error === 'no-speech') {
                console.warn('No speech detected, listening paused or timed out.');
                // Optionally, we could restart recognition here for continuous listening:
                // recognition.current.start();
            } else {
                console.error('Speech recognition error:', event.error);
            }
        };

        if (isListening) {
            recognition.current.start();
        }

        // Cleanup on unmount or language change
        return () => {
            recognition.current?.stop();
        };
    }, [ language, isListening, onTranscriptChange, transcript ]);

    const toggleListening = () => {
        if (isListening) {
            recognition.current.stop();
            setIsListening(false);
        } else {
            recognition.current.start();
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

            <div className="border rounded p-2 h-40 overflow-auto bg-gray-50 text-gray-800">
                { transcript || 'Your live transcription will appear here...' }
            </div>
        </div>
    );
}
