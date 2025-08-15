import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { franc } from 'franc';

// Define the expected body shape
interface SummarizeRequestBody {
  notes?: string;
}

// POST handler
export async function POST(req: NextRequest) {
  let notes: string | undefined;

  try {
    const body: SummarizeRequestBody = await req.json();
    notes = body?.notes;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!notes) return NextResponse.json({ error: 'Notes required' }, { status: 400 });

  // Detect language using franc, fallback to French ('fra') by default
  const langCode = franc(notes, { minLength: 3 }) || 'fra';

  // Define prompts per language
  const prompts: Record<string, string> = {
    fra: `Vous êtes un assistant IA pour résumer des notes de réunion.
Répondez en français en markdown.
- Décisions clés
- Principaux éléments d'action
- Résumé concis (max 5 phrases)

Notes : """${notes}"""`,

    eng: `You are an AI assistant to summarize meeting notes.
Respond in English in markdown.
- Key decisions
- Main action items
- Concise summary (max 5 sentences)

Notes: """${notes}"""`,

    spa: `Eres un asistente de IA para resumir notas de reunión.
Responde en español en markdown.
- Decisiones clave
- Principales tareas
- Resumen conciso (máximo 5 frases)

Notas: """${notes}"""`,

    deu: `Sie sind ein KI-Assistent zur Zusammenfassung von Besprechungsnotizen.
Antworten Sie auf Deutsch in Markdown.
- Wichtige Entscheidungen
- Hauptaktionspunkte
- Knackige Zusammenfassung (maximal 5 Sätze)

Notizen: """${notes}"""`,
  };

  // Use prompt for detected language, fallback to French
  const prompt = prompts[langCode] ?? prompts['fra'];

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);

    // Safely access the summary text
    const summary: string | undefined = result?.response?.text?.();

    if (!summary) {
      return NextResponse.json({ error: 'AI summarization failed' }, { status: 500 });
    }
    return NextResponse.json({ summary });
  } catch (e) {
    // Use unknown type and type guard for error
    const err = e as Error;
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 });
  }
}
