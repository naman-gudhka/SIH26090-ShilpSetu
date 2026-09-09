import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from '@google/genai';

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const TRANSCRIPTION_MODELS = [
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
];

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRetryableGeminiError(error) {
  const message =
    error?.message ||
    error?.toString?.() ||
    '';

  const status =
    error?.status ||
    error?.code ||
    '';

  return (
    String(status) === '503' ||
    String(status).includes('503') ||
    message.includes('503') ||
    message.includes('UNAVAILABLE') ||
    message.includes('high demand') ||
    message.includes('temporarily unavailable') ||
    message.includes('overloaded')
  );
}

async function transcribeWithFallback(
  ai,
  audioFile,
  mimeType
) {
  let lastError = null;

  for (
    let i = 0;
    i < TRANSCRIPTION_MODELS.length;
    i += 1
  ) {
    const model =
      TRANSCRIPTION_MODELS[i];

    try {
      console.log(
        `Attempting voice transcription with ${model}...`
      );

      const response =
        await ai.models.generateContent({
          model,

          contents: createUserContent([
            createPartFromUri(
              audioFile.uri,
              audioFile.mimeType ||
                mimeType
            ),

            `Generate a complete and accurate transcript of the speech in this audio.

Preserve the artisan's actual words and meaning.

Do not summarize.

Do not rewrite.

Do not invent information.

Return ONLY the transcript text.`,
          ]),
        });

      const transcript =
        response.text?.trim() || '';

      if (transcript) {
        console.log(
          `Voice transcription succeeded with ${model}.`
        );

        return {
          transcript,
          model,
        };
      }

      throw new Error(
        `${model} returned an empty transcript.`
      );
    } catch (error) {
      lastError = error;

      console.error(
        `Voice transcription failed with ${model}:`,
        error
      );

      /*
       * If this is a temporary availability
       * problem, try the next model.
       *
       * For other errors, there is no point
       * blindly trying unrelated models.
       */
      if (!isRetryableGeminiError(error)) {
        throw error;
      }

      /*
       * Small delay before moving to the
       * next model.
       */
      if (
        i <
        TRANSCRIPTION_MODELS.length - 1
      ) {
        await sleep(1200);
      }
    }
  }

  throw (
    lastError ||
    new Error(
      'All Gemini transcription models are temporarily unavailable.'
    )
  );
}

export default async function handler(
  req,
  res
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error:
        'Method not allowed. Use POST.',
    });
  }

  let tempFile = null;

  try {
    const apiKey =
      process.env.GEMINI_API_KEY;

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
        error:
          'No audio data was provided.',
      });
    }

    const audioBuffer =
      Buffer.from(
        audioBase64,
        'base64'
      );

    if (!audioBuffer.length) {
      return res.status(400).json({
        success: false,
        error:
          'The recorded audio file is empty.',
      });
    }

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

    const ai =
      new GoogleGenAI({
        apiKey,
      });

    let extension = 'webm';

    if (
      mimeType.includes('mp4') ||
      mimeType.includes('m4a')
    ) {
      extension = 'm4a';
    } else if (
      mimeType.includes('ogg')
    ) {
      extension = 'ogg';
    } else if (
      mimeType.includes('wav')
    ) {
      extension = 'wav';
    } else if (
      mimeType.includes('mp3')
    ) {
      extension = 'mp3';
    }

    tempFile = path.join(
      os.tmpdir(),
      `shilpsetu-voice-${Date.now()}.${extension}`
    );

    await fs.writeFile(
      tempFile,
      audioBuffer
    );

    console.log(
      'Uploading artisan audio to Gemini:',
      {
        bytes: audioBuffer.length,
        mimeType,
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
      'Gemini audio uploaded successfully:',
      {
        uri: audioFile.uri,
        mimeType:
          audioFile.mimeType,
      }
    );

    /*
     * ------------------------------------------------
     * STEP 1
     * TRANSCRIBE AUDIO WITH MODEL FALLBACK
     * ------------------------------------------------
     */

    const transcription =
      await transcribeWithFallback(
        ai,
        audioFile,
        mimeType
      );

    const transcript =
      transcription.transcript;

    console.log(
      'Final transcript:',
      transcript
    );

    /*
     * ------------------------------------------------
     * STEP 2
     * TRANSLATE + CLEAN STORY
     * ------------------------------------------------
     */

    let parsed = {
      detectedLanguage: 'unknown',
      translationEnglish:
        transcript,
      translationHindi: '',
      cleanedStory: transcript,
    };

    try {
      const translationResponse =
        await ai.models.generateContent({
          model:
            'gemini-3.6-flash',

          contents: `
You are helping an Indian artisan create a product catalog.

The following is the actual transcript of the artisan speaking.

Identify the language and provide faithful translations.

Return:
1. detectedLanguage
2. translationEnglish
3. translationHindi
4. cleanedStory

STRICT RULES:
- Preserve the artisan's actual meaning.
- Do NOT invent product information.
- Do NOT assume Kutch.
- Do NOT assume Gujarat.
- Do NOT assume embroidery.
- Do NOT assume a bag.
- Do NOT assume cotton.
- Do NOT assume mirror work.
- Do NOT assume wood.
- Do NOT assume pottery.
- Do NOT add materials, colors, dimensions, techniques,
  locations, prices, or other facts that the artisan
  did not actually say.

The cleanedStory should be polished but factually faithful.

Return ONLY valid JSON.

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

      if (raw) {
        const result =
          JSON.parse(raw);

        parsed = {
          detectedLanguage:
            result.detectedLanguage ||
            'unknown',

          translationEnglish:
            result.translationEnglish ||
            transcript,

          translationHindi:
            result.translationHindi ||
            '',

          cleanedStory:
            result.cleanedStory ||
            result.translationEnglish ||
            transcript,
        };
      }
    } catch (translationError) {
      /*
       * Translation is helpful but should NOT
       * destroy the voice workflow if the
       * translation model is temporarily busy.
       *
       * We already have the real transcript,
       * so continue with it.
       */
      console.warn(
        'Translation step failed. Continuing with original transcript:',
        translationError
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

      transcriptionModel:
        transcription.model,
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