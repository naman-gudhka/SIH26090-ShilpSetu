/**
 * voiceTranscriptionService.js
 * Speech-to-text abstraction boundary.
 * Replace mock with: Bhashini API / Google Speech-to-Text / Azure Cognitive Services
 */

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const mockTranscripts = {
  hi: 'यह एक हाथ से बुना हुआ कपड़ा बैग है जो गुजरात के कच्छ जिले में बनाया गया है। इसमें पारंपरिक दर्पण का काम और रंगीन धागे की कढ़ाई है। एक बैग बनाने में लगभग चालीस घंटे का समय लगता है।',
  en: 'This is a handwoven cotton bag made by hand in Kutch, Gujarat. It has traditional mirror work and colorful thread embroidery. It takes about forty hours to make one bag. The cotton used is locally sourced and the thread colors are natural dyes.',
};

export const voiceTranscriptionService = {
  /**
   * Transcribe audio to text.
   * Replace with: Bhashini API (https://bhashini.gov.in/) or equivalent
   * @param {Blob} audioBlob - The recorded audio
   * @param {string} language - Language code ('hi', 'en', 'gu', etc.)
   * @returns {Promise<Object>} Transcription result
   */
  async transcribe(audioBlob, language = 'hi') {
    await delay(2500);
    // Mock: In production, send audioBlob to Bhashini or other STT API
    return {
      success: true,
      transcript: mockTranscripts[language] || mockTranscripts.en,
      confidence: 0.91,
      language,
      duration: 8.4,
    };
  },

  /**
   * Translate text between languages.
   * Replace with: Bhashini translation API or Google Translate
   */
  async translate(text, fromLang, toLang) {
    await delay(1000);
    if (fromLang === toLang) return { success: true, translation: text };
    return {
      success: true,
      translation: toLang === 'hi' ? mockTranscripts.hi : mockTranscripts.en,
      fromLang,
      toLang,
    };
  },

  /**
   * Check if the browser supports MediaRecorder / audio capture.
   */
  isSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  },

  /**
   * Request microphone permission.
   */
  async requestPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      return { granted: true };
    } catch {
      return { granted: false, error: 'Microphone permission denied.' };
    }
  },
};
