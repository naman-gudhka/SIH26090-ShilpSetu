import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY is not configured on Vercel.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: 'Reply with exactly: ShilpSetu Gemini backend is working.',
    });

    return res.status(200).json({
      success: true,
      message: response.text,
    });
  } catch (error) {
    console.error('Gemini test error:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'Gemini request failed.',
    });
  }
}