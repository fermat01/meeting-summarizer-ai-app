'use client';

import React, { useState } from 'react';
import TranscriptionComponent from '../components/Transcription';
import SummarizerForm from '../components/SummarizerForm';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const HomePage = () => {
  const [ transcript, setTranscript ] = useState('');
  const [ summary, setSummary ] = useState('');
  const [ loading, setLoading ] = useState(false);

  return (
    <main className="max-w-2xl mx-auto py-10 space-y-8">
      <h1 className="text-3xl font-bold mb-4">Meeting Minutes Summarizer</h1>

      {/* Pass a callback to update transcript state */ }
      <TranscriptionComponent onTranscriptChange={ setTranscript } />

      {/* Use the updated transcript in the summarizer form */ }
      <SummarizerForm
        onSummary={ setSummary }
        loading={ loading }
        setLoading={ setLoading }
        initialNotes={ transcript }  // Pass transcript as initial value
        onNotesChange={ setTranscript } // To allow edits if needed
      />

      { summary && (
        <article className="prose prose-lg mt-8">
          <ReactMarkdown remarkPlugins={ [ remarkGfm ] }>
            { summary }
          </ReactMarkdown>
        </article>
      ) }
    </main>
  );
};

export default HomePage;
