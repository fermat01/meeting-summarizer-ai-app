
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {franc} from 'franc';

export async function POST(req: NextRequest) {
  let notes: string | undefined;
  try {
    const body = await req.json();
    notes = body?.notes;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!notes) return NextResponse.json({ error: 'Notes required' }, { status: 400 });

  const langCode = franc(notes, { minLength: 3 }) || 'eng';

  // Define prompts per language
  const prompts: { [key: string]: string } = {
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
  };

  const prompt = prompts[langCode] || prompts['eng'];

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const summary = result?.response?.text?.();
    if (!summary) {
      return NextResponse.json({ error: 'AI summarization failed' }, { status: 500 });
    }
    return NextResponse.json({ summary });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
