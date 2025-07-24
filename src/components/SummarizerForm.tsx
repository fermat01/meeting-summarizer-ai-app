'use client';

import React, { useState, useEffect } from 'react';

type Props = {
    onSummary: (summary: string) => void;
    loading: boolean;
    setLoading: (l: boolean) => void;
    initialNotes?: string;
    onNotesChange?: (notes: string) => void;
};

const SummarizerForm: React.FC<Props> = ({
    onSummary,
    loading,
    setLoading,
    initialNotes = '',
    onNotesChange,
}) => {
    const [ notes, setNotes ] = useState(initialNotes);

    // If initialNotes changes externally, update local notes state
    useEffect(() => {
        setNotes(initialNotes);
    }, [ initialNotes ]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNotes(e.target.value);
        onNotesChange && onNotesChange(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!notes.trim()) {
            onSummary('Notes are empty.');
            return;
        }
        setLoading(true);
        onSummary('');
        try {
            const res = await fetch('/api/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes }),
            });
            const data = await res.json();
            if (data.summary) {
                onSummary(data.summary);
            } else {
                onSummary('Failed to generate summary.');
            }
        } catch {
            onSummary('Server error.');
        }
        setLoading(false);
    };

    return (
        <form onSubmit={ handleSubmit } className="space-y-4">
            <textarea
                className="w-full p-2 border rounded"
                rows={ 10 }
                placeholder="Type or paste your meeting notes here..."
                value={ notes }
                disabled={ loading }
                onChange={ handleChange }
                required
            />
            <button
                type="submit"
                className="bg-blue-600 px-4 py-2 rounded text-white disabled:opacity-50"
                disabled={ loading }
            >
                { loading ? 'Summarizing...' : 'Summarize' }
            </button>
        </form>
    );
};

export default SummarizerForm;
