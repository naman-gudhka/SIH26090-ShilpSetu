import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from '@google/genai';

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
    });
  }

  let tempFile = null;

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error:
          'GEMINI_API_KEY is not configured on Vercel.',
      });
    }

    const {
      audioBase64,
      mimeType = 'audio/webm',
    } = req.body || {};

    if (!audioBase64) {
      return res.status(400).json({
        success: false,
        error: 'No audio data was provided.',
      });
    }

    const audioBuffer = Buffer.from(
      audioBase64,
      'base64'
    );

    if (!audioBuffer.length) {
      return res.status(400).json({
        success: false,
        error: 'The recorded audio file is empty.',
      });
    }

    /*
     * Keep this endpoint focused on short artisan voice notes.
     *
     * This protects the Vercel function from
     * unexpectedly large uploads.
     */
    if (
      audioBuffer.length >
      4 * 1024 * 1024
    ) {
      return res.status(413).json({
        success: false,
        error:
          'Voice recording is too large. Please keep the recording under about 45 seconds.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
    });

    const extension =
      mimeType.includes('mp4') ||
      mimeType.includes('m4a')
        ? 'm4a'
        : mimeType.includes('ogg')
          ? 'ogg'
          : mimeType.includes('wav')
            ? 'wav'
            : mimeType.includes('mp3')
              ? 'mp3'
              : 'webm';

    tempFile = path.join(
      os.tmpdir(),
      `shilpsetu-voice-${Date.now()}.${extension}`
    );

    await fs.writeFile(
      tempFile,
      audioBuffer
    );

    console.log(
      'Uploading artisan audio to Gemini Files API:',
      {
        bytes: audioBuffer.length,
        mimeType,
        tempFile,
      }
    );

    const audioFile =
      await ai.files.upload({
        file: tempFile,
        config: {
          mimeType,
        },
      });

    if (!audioFile?.uri) {
      throw new Error(
        'Gemini did not return an uploaded audio URI.'
      );
    }

    console.log(
      'Gemini audio uploaded:',
      {
        uri: audioFile.uri,
        mimeType: audioFile.mimeType,
      }
    );

    /*
     * Gemini audio understanding.
     *
     * The model receives the actual recorded
     * artisan audio and generates the transcript.
     */
    const transcription =
      await ai.models.generateContent({
        model: 'gemini-3.8-flash',

        contents: createUserContent([
          createPartFromUri(
            audioFile.uri,
            audioFile.mimeType ||
              mimeType
          ),

          'Generate a complete and accurate transcript of the speech in this audio. Preserve the artisan\'s actual words and meaning. Return only the transcript text. Do not summarize, rewrite, or invent anything.',
        ]),
      });

    const transcript =
      transcription.text?.trim() || '';

    console.log(
      'Gemini transcript:',
      transcript
    );

    if (!transcript) {
      throw new Error(
        'Gemini did not return a transcript. Please check the microphone recording and try again.'
      );
    }

    /*
     * Translate and clean the transcript.
     *
     * IMPORTANT:
     * Gemini is explicitly told not to invent
     * product information.
     */
    const translationResponse =
      await ai.models.generateContent({
        model: 'gemini-3.6-flash',

        contents: `
You are helping an Indian artisan create a product catalog.

The following is the actual transcript of the artisan speaking.

First identify the language of the transcript.

Then return:
1. A faithful English translation.
2. A faithful Hindi translation.
3. A polished English catalog story.

STRICT RULES:
- Preserve every factual detail from the transcript.
- Do NOT invent product information.
- Do NOT assume Kutch, Gujarat, embroidery, bags, cotton,
  mirror work, wood, pottery, or any other product detail.
- Do not change quantities, materials, colors, locations,
  techniques, or time requirements.
- Keep Indian craft names and place names accurate.
- The polished English story must remain factual.

Return ONLY valid JSON in this exact structure:
{
  "detectedLanguage": "...",
  "translationEnglish": "...",
  "translationHindi": "...",
  "cleanedStory": "..."
}

ARTISAN TRANSCRIPT:
${transcript}
        `,

        config: {
          responseMimeType:
            'application/json',

          responseSchema: {
            type: 'object',

            properties: {
              detectedLanguage: {
                type: 'string',
              },

              translationEnglish: {
                type: 'string',
              },

              translationHindi: {
                type: 'string',
              },

              cleanedStory: {
                type: 'string',
              },
            },

            required: [
              'detectedLanguage',
              'translationEnglish',
              'translationHindi',
              'cleanedStory',
            ],
          },
        },
      });

    const raw =
      translationResponse.text?.trim() ||
      '';

    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error(
        'Invalid Gemini translation JSON:',
        raw
      );

      throw new Error(
        'Gemini returned invalid translation data.'
      );
    }

    return res.status(200).json({
      success: true,

      transcript,

      translation:
        parsed.translationEnglish ||
        transcript,

      translationEnglish:
        parsed.translationEnglish ||
        transcript,

      translationHindi:
        parsed.translationHindi ||
        '',

      cleanedStory:
        parsed.cleanedStory ||
        parsed.translationEnglish ||
        transcript,

      language:
        parsed.detectedLanguage ||
        'unknown',

      confidence: null,
    });
  } catch (error) {
    console.error(
      'Voice processing error:',
      error
    );

    return res.status(500).json({
      success: false,

      error:
        error?.message ||
        'Unable to process the artisan voice recording.',
    });
  } finally {
    if (tempFile) {
      await fs
        .unlink(tempFile)
        .catch(() => {});
    }
  }
}