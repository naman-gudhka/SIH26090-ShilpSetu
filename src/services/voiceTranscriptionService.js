const API_URL = '/api/process-voice';

function blobToBase64(blob) {
  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.onloadend = () => {
        try {
          const result =
            reader.result;

          if (
            typeof result !==
            'string'
          ) {
            reject(
              new Error(
                'Unable to read audio data.'
              )
            );

            return;
          }

          const commaIndex =
            result.indexOf(',');

          const base64 =
            commaIndex >= 0
              ? result.slice(
                  commaIndex + 1
                )
              : result;

          if (!base64) {
            reject(
              new Error(
                'Invalid audio data.'
              )
            );

            return;
          }

          resolve(base64);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(
          new Error(
            'Unable to read audio recording.'
          )
        );
      };

      reader.readAsDataURL(blob);
    }
  );
}

export const voiceTranscriptionService = {
  async transcribe(
    audioBlob,
    language = 'en'
  ) {
    if (
      !audioBlob ||
      audioBlob.size === 0
    ) {
      throw new Error(
        'No audio recording was provided.'
      );
    }

    const audioBase64 =
      await blobToBase64(
        audioBlob
      );

    const response =
      await fetch(API_URL, {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body: JSON.stringify({
          audioBase64,

          mimeType:
            audioBlob.type ||
            'audio/webm',

          targetLanguage:
            language,
        }),
      });

    let data;

    try {
      data =
        await response.json();
    } catch {
      throw new Error(
        'The voice server returned an invalid response.'
      );
    }

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data?.error ||
          'Unable to process the voice recording.'
      );
    }

    return {
      success: true,

      transcript:
        data.transcript || '',

      confidence:
        data.confidence ??
        null,

      language:
        data.language ||
        language,

      translation:
        data.translation ||
        data.translationEnglish ||
        '',

      translationEnglish:
        data.translationEnglish ||
        data.translation ||
        '',

      translationHindi:
        data.translationHindi ||
        '',

      cleanedStory:
        data.cleanedStory ||
        data.translationEnglish ||
        '',
    };
  },

  async translate(
    text,
    fromLang,
    toLang
  ) {
    if (!text) {
      return {
        success: true,
        translation: '',
        fromLang,
        toLang,
      };
    }

    if (
      fromLang === toLang
    ) {
      return {
        success: true,
        translation: text,
        fromLang,
        toLang,
      };
    }

    /*
     * Translation is currently handled
     * inside /api/process-voice through Gemini.
     *
     * Keep this method for compatibility
     * with the existing frontend service contract.
     */
    return {
      success: true,
      translation: text,
      fromLang,
      toLang,
    };
  },

  isSupported() {
    return Boolean(
      navigator.mediaDevices
        ?.getUserMedia
    );
  },

  async requestPermission() {
    try {
      const stream =
        await navigator.mediaDevices
          .getUserMedia({
            audio: true,
          });

      stream
        .getTracks()
        .forEach((track) =>
          track.stop()
        );

      return {
        granted: true,
      };
    } catch {
      return {
        granted: false,
        error:
          'Microphone permission denied.',
      };
    }
  },
};