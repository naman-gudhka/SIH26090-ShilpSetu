const MODEL = 'gemini-3.8-flash';

function sendJson(res, status, data) {
  res.status(status).json(data);
}

function extractText(result) {
  return (
    result?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || '')
      .join('')
      .trim() || ''
  );
}

function stripJsonMarkdown(text) {
  if (!text) return '';

  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

async function callGemini(body) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on Vercel.');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  const text = await response.text();

  if (!response.ok) {
    console.error('Gemini API error:', response.status, text);

    let message = `Gemini API returned ${response.status}.`;

    try {
      const errorJson = JSON.parse(text);
      message =
        errorJson?.error?.message ||
        message;
    } catch {
      // Keep generic message.
    }

    throw new Error(message);
  }

  return JSON.parse(text);
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, {
      success: false,
      error: 'Method not allowed. Use POST.',
    });
  }

  try {
    const {
      audioBase64,
      mimeType = 'audio/webm',
      targetLanguage = 'auto',
    } = req.body || {};

    if (!audioBase64) {
      return sendJson(res, 400, {
        success: false,
        error: 'No audio was received.',
      });
    }

    /*
     * Vercel request bodies and browser base64 conversion add overhead.
     * Keep recordings reasonably small for the hackathon demo.
     */
    if (audioBase64.length > 5000000) {
      return sendJson(res, 413, {
        success: false,
        error:
          'Audio recording is too large. Please record a shorter voice note.',
      });
    }

    const cleanMimeType =
      typeof mimeType === 'string' &&
      mimeType.startsWith('audio/')
        ? mimeType.split(';')[0]
        : 'audio/webm';

    const transcriptionPrompt = `
You are the speech-to-text engine for ShilpSetu, an Indian artisan marketplace.

Listen to the attached artisan voice recording.

Your job is to accurately transcribe exactly what the artisan said.

IMPORTANT RULES:

1. Automatically detect the language being spoken.
2. The artisan may speak Hindi, Marathi, Gujarati, Bengali, Tamil, Telugu, Kannada, Malayalam, Punjabi, Odia, Assamese, English, Hinglish, or another Indian language.
3. Do NOT assume the language from the UI language.
4. Preserve the artisan's actual meaning.
5. Do not invent product details.
6. Do not add craft names, materials, dimensions, locations, prices, colors, techniques, or cultural details unless the artisan actually says them.
7. Do not summarize.
8. Do not turn the speech into marketing language.
9. If speech contains code-switching between languages, preserve the meaning accurately.
10. If a word is unclear, use the closest supported interpretation but do not invent a new fact.

Return JSON only.
`;

    const transcriptionResult = await callGemini({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: transcriptionPrompt,
            },
            {
              inlineData: {
                mimeType: cleanMimeType,
                data: audioBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            transcript: {
              type: 'STRING',
            },
            detectedLanguage: {
              type: 'STRING',
            },
            confidence: {
              type: 'NUMBER',
            },
          },
          required: [
            'transcript',
            'detectedLanguage',
            'confidence',
          ],
        },
      },
    });

    const transcriptionText = extractText(transcriptionResult);

    if (!transcriptionText) {
      throw new Error(
        'Gemini did not return a transcription.'
      );
    }

    let transcription;

    try {
      transcription = JSON.parse(
        stripJsonMarkdown(transcriptionText)
      );
    } catch (error) {
      console.error(
        'Could not parse transcription JSON:',
        transcriptionText
      );

      throw new Error(
        'Gemini returned an invalid transcription response.'
      );
    }

    const transcript =
      typeof transcription.transcript === 'string'
        ? transcription.transcript.trim()
        : '';

    if (!transcript) {
      throw new Error(
        'No understandable speech was detected in the recording.'
      );
    }

    const detectedLanguage =
      transcription.detectedLanguage ||
      targetLanguage ||
      'unknown';

    /*
     * Now translate the actual transcript.
     */
    const translationPrompt = `
You are the translation and artisan-story processing engine for ShilpSetu.

Original detected language:
${detectedLanguage}

Original transcript:
${transcript}

Create accurate English and Hindi translations.

Also create a cleaned artisan story.

STRICT RULES:

1. Do not invent information.
2. Do not add materials that were not mentioned.
3. Do not add location information that was not mentioned.
4. Do not add craft techniques that were not mentioned.
5. Do not add dimensions or weight.
6. Do not add prices.
7. Do not add claims such as "traditional", "eco-friendly", "100% authentic", "GI tagged", "sustainable", etc. unless the artisan actually said them.
8. Preserve the artisan's actual meaning.
9. The cleaned story may improve grammar and readability but must not introduce new facts.
10. If something was not mentioned, leave it out.

Return JSON only.
`;

    const translationResult = await callGemini({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: translationPrompt,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            translationEnglish: {
              type: 'STRING',
            },
            translationHindi: {
              type: 'STRING',
            },
            cleanedStory: {
              type: 'STRING',
            },
          },
          required: [
            'translationEnglish',
            'translationHindi',
            'cleanedStory',
          ],
        },
      },
    });

    const translationText = extractText(
      translationResult
    );

    if (!translationText) {
      throw new Error(
        'Gemini did not return translation data.'
      );
    }

    let translation;

    try {
      translation = JSON.parse(
        stripJsonMarkdown(translationText)
      );
    } catch {
      throw new Error(
        'Gemini returned an invalid translation response.'
      );
    }

    return sendJson(res, 200, {
      success: true,

      transcript,

      language: detectedLanguage,

      detectedLanguage,

      confidence:
        Number(transcription.confidence) || 0.9,

      translationEnglish:
        translation.translationEnglish ||
        transcript,

      translationHindi:
        translation.translationHindi ||
        '',

      cleanedStory:
        translation.cleanedStory ||
        translation.translationEnglish ||
        transcript,

      source: 'gemini',
    });
  } catch (error) {
    console.error(
      'Voice processing failed:',
      error
    );

    return sendJson(res, 500, {
      success: false,
      error:
        error?.message ||
        'Unable to process the voice recording.',
    });
  }
}