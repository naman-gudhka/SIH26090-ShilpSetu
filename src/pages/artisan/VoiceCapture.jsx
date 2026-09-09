import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  Square,
  ArrowRight,
  X,
  RefreshCw,
  Sparkles,
  Volume2,
  CheckCircle2,
  ImageIcon,
  Loader2,
} from 'lucide-react';

import { useLanguage } from '../../context/LanguageContext.jsx';
import { LanguageSelector } from '../../components/shared/LanguageSelector.jsx';
import { ProductCreationSteps } from '../../components/shared/ProductCreationSteps.jsx';
import { voiceTranscriptionService } from '../../services/voiceTranscriptionService.js';

export function VoiceCapture() {
  const navigate = useNavigate();
  const { t, isHindi } = useLanguage();

  const photoPreview = (() => {
    try {
      return sessionStorage.getItem('ss_photo_preview') || null;
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    if (!photoPreview) {
      navigate('/artisan/products/photo', { replace: true });
    }
  }, [photoPreview, navigate]);

  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [done, setDone] = useState(false);
  const [processingVoice, setProcessingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState('');

  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioBlobRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const speechTextRef = useRef('');
  const shouldKeepSpeechRecognitionRef = useRef(false);

  const getSpeechRecognition = () => {
    if (typeof window === 'undefined') return null;

    return (
      window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      null
    );
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition = getSpeechRecognition();

    if (!SpeechRecognition) {
      console.warn('Browser speech recognition is unavailable.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();

      speechRecognitionRef.current = recognition;
      shouldKeepSpeechRecognitionRef.current = true;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = isHindi ? 'hi-IN' : 'en-IN';

      recognition.onresult = (event) => {
        let combined = speechTextRef.current;
        let interim = '';

        for (
          let i = event.resultIndex;
          i < event.results.length;
          i += 1
        ) {
          const result = event.results[i];
          const text = result?.[0]?.transcript || '';

          if (result.isFinal) {
            combined = `${combined} ${text}`.trim();
          } else {
            interim += text;
          }
        }

        speechTextRef.current = combined.trim();

        const visibleText =
          `${speechTextRef.current} ${interim}`.trim();

        setTranscript(visibleText);
      };

      recognition.onerror = (event) => {
        console.warn(
          'Browser speech recognition error:',
          event?.error
        );

        if (
          event?.error === 'no-speech' ||
          event?.error === 'aborted'
        ) {
          return;
        }
      };

      recognition.onend = () => {
        if (
          shouldKeepSpeechRecognitionRef.current &&
          mediaRecorderRef.current?.state === 'recording'
        ) {
          try {
            recognition.start();
          } catch {
            // Browser may reject an immediate restart.
            // MediaRecorder continues independently.
          }
        }
      };

      recognition.start();
    } catch (error) {
      console.warn(
        'Could not start browser speech recognition:',
        error
      );

      speechRecognitionRef.current = null;
    }
  };

  const stopSpeechRecognition = () => {
    shouldKeepSpeechRecognitionRef.current = false;

    const recognition = speechRecognitionRef.current;

    speechRecognitionRef.current = null;

    if (recognition) {
      try {
        recognition.stop();
      } catch {
        // Safe cleanup.
      }
    }
  };

  const startRecording = async () => {
    setVoiceError('');
    setTranscript('');
    setDone(false);
    setSeconds(0);

    speechTextRef.current = '';
    audioChunksRef.current = [];
    audioBlobRef.current = null;

    clearInterval(timerRef.current);
    stopSpeechRecognition();

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          'Microphone recording is not supported in this browser.'
        );
      }

      if (typeof MediaRecorder === 'undefined') {
        throw new Error(
          'Audio recording is not supported in this browser.'
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

      mediaStreamRef.current = stream;

      const audioTrack = stream.getAudioTracks()[0];

      console.log('Microphone track:', {
        label: audioTrack?.label,
        enabled: audioTrack?.enabled,
        muted: audioTrack?.muted,
        readyState: audioTrack?.readyState,
        settings: audioTrack?.getSettings?.(),
      });

      let mimeType = '';

      const candidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ];

      for (const candidate of candidates) {
        if (MediaRecorder.isTypeSupported(candidate)) {
          mimeType = candidate;
          break;
        }
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);

          console.log(
            'Audio chunk captured:',
            event.data.size,
            'bytes'
          );
        }
      };

      recorder.onerror = (event) => {
        console.error(
          'MediaRecorder error:',
          event
        );

        clearInterval(timerRef.current);
        stopSpeechRecognition();

        setRecording(false);
        setDone(false);

        setVoiceError(
          'Unable to record audio. Please check your microphone and try again.'
        );
      };

      recorder.onstop = () => {
        clearInterval(timerRef.current);
        stopSpeechRecognition();

        const actualMimeType =
          recorder.mimeType ||
          audioChunksRef.current[0]?.type ||
          mimeType ||
          'audio/webm';

        const blob = new Blob(
          audioChunksRef.current,
          {
            type: actualMimeType,
          }
        );

        audioBlobRef.current = blob;

        console.log('Final recorded audio:', {
          size: blob.size,
          type: blob.type,
          chunks: audioChunksRef.current.length,
          browserTranscript: speechTextRef.current,
        });

        if (blob.size === 0) {
          setDone(false);

          setVoiceError(
            'No audio was captured. Please check your microphone and try again.'
          );
        } else {
          setDone(true);
        }

        if (mediaStreamRef.current) {
          mediaStreamRef.current
            .getTracks()
            .forEach((track) => track.stop());
        }

        mediaRecorderRef.current = null;
        mediaStreamRef.current = null;
      };

      recorder.start(250);

      setRecording(true);

      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);

      console.log('MediaRecorder started:', {
        mimeType:
          recorder.mimeType ||
          mimeType ||
          'browser-default',
        state: recorder.state,
      });

      /*
       * Run browser speech recognition in parallel.
       *
       * This provides:
       * 1. Live transcript feedback
       * 2. Browser fallback if Gemini transcription fails
       *
       * MediaRecorder remains the actual audio recording.
       */
      startSpeechRecognition();
    } catch (error) {
      console.error(
        'Microphone recording error:',
        error
      );

      clearInterval(timerRef.current);
      stopSpeechRecognition();

      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }

      mediaRecorderRef.current = null;
      mediaStreamRef.current = null;

      setRecording(false);
      setDone(false);

      setVoiceError(
        error?.message ||
          'Microphone permission is required to record your story.'
      );
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);

    stopSpeechRecognition();

    setRecording(false);

    const recorder = mediaRecorderRef.current;

    if (!recorder) {
      setDone(Boolean(audioBlobRef.current?.size));
      return;
    }

    try {
      if (recorder.state !== 'inactive') {
        recorder.stop();
      }
    } catch (error) {
      console.error(
        'Error stopping MediaRecorder:',
        error
      );

      setDone(false);

      setVoiceError(
        'Unable to finish the recording. Please try again.'
      );

      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }
    }
  };

  const reset = () => {
    clearInterval(timerRef.current);

    stopSpeechRecognition();

    const recorder = mediaRecorderRef.current;

    if (recorder) {
      try {
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      } catch {
        // Safe cleanup.
      }
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current
        .getTracks()
        .forEach((track) => track.stop());
    }

    mediaRecorderRef.current = null;
    mediaStreamRef.current = null;
    audioChunksRef.current = [];
    audioBlobRef.current = null;
    speechTextRef.current = '';

    setRecording(false);
    setDone(false);
    setTranscript('');
    setSeconds(0);
    setVoiceError('');
  };

  const proceed = async () => {
    if (processingVoice) return;

    setVoiceError('');
    setProcessingVoice(true);

    try {
      const audioBlob = audioBlobRef.current;

      const browserTranscript =
        speechTextRef.current.trim() ||
        transcript.trim();

      if (!audioBlob || audioBlob.size === 0) {
        throw new Error(
          'No voice recording was captured. Please record your story again.'
        );
      }

      console.log(
        'Sending actual artisan audio to Gemini:',
        {
          size: audioBlob.size,
          type: audioBlob.type,
        }
      );

      let result = null;

      try {
        result =
          await voiceTranscriptionService.transcribe(
            audioBlob,
            isHindi ? 'hi' : 'en'
          );
      } catch (geminiError) {
        console.error(
          'Gemini voice processing failed. Browser transcript fallback will be used if available:',
          geminiError
        );

        if (!browserTranscript) {
          throw geminiError;
        }
      }

      const finalTranscript =
        result?.transcript?.trim() ||
        browserTranscript;

      if (!finalTranscript) {
        throw new Error(
          'No speech was detected. Please speak clearly for 10–20 seconds and try again.'
        );
      }

      const englishTranslation =
        result?.translationEnglish ||
        result?.translation ||
        finalTranscript;

      const hindiTranslation =
        result?.translationHindi || '';

      const cleanedStory =
        result?.cleanedStory ||
        englishTranslation ||
        finalTranscript;

      setTranscript(finalTranscript);

      sessionStorage.setItem(
        'ss_voice_transcript',
        finalTranscript
      );

      sessionStorage.setItem(
        'ss_voice_translation',
        englishTranslation
      );

      sessionStorage.setItem(
        'ss_voice_cleaned_story',
        cleanedStory
      );

      sessionStorage.setItem(
        'ss_voice_language',
        result?.language ||
          (isHindi ? 'hi-IN' : 'en-IN')
      );

      if (hindiTranslation) {
        sessionStorage.setItem(
          'ss_voice_translation_hi',
          hindiTranslation
        );
      } else {
        sessionStorage.removeItem(
          'ss_voice_translation_hi'
        );
      }

      sessionStorage.setItem(
        'ss_voice_recording_ready',
        'true'
      );

      sessionStorage.setItem(
        'ss_voice_transcription_source',
        result?.transcript
          ? 'gemini'
          : 'browser'
      );

      console.log(
        'Voice processing completed:',
        {
          source: result?.transcript
            ? 'gemini'
            : 'browser',
          transcript: finalTranscript,
        }
      );

      navigate(
        '/artisan/products/processing',
        {
          state: {
            method: 'voice',
            transcript: finalTranscript,
            translation: englishTranslation,
            cleanedStory,
            language:
              result?.language ||
              (isHindi ? 'hi-IN' : 'en-IN'),
          },
        }
      );
    } catch (error) {
      console.error(
        'Voice processing failed:',
        error
      );

      setVoiceError(
        error?.message ||
          'Unable to process your recording. Please try again.'
      );
    } finally {
      setProcessingVoice(false);
    }
  };

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);

      shouldKeepSpeechRecognitionRef.current = false;

      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {
          // Safe cleanup.
        }
      }

      if (mediaRecorderRef.current) {
        try {
          if (
            mediaRecorderRef.current.state !==
            'inactive'
          ) {
            mediaRecorderRef.current.stop();
          }
        } catch {
          // Safe cleanup.
        }
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  const fmt = (s) =>
    `${String(
      Math.floor(s / 60)
    ).padStart(2, '0')}:${String(
      s % 60
    ).padStart(2, '0')}`;

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--color-bg)',
        paddingBottom: 100,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          background: 'var(--color-surface)',
          borderBottom:
            '1px solid var(--color-border)',
          padding:
            'var(--space-4) var(--space-5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color:
                'var(--color-text-muted)',
              padding: 6,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>

          <h1
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight:
                'var(--weight-bold)',
              color: 'var(--color-text)',
              margin: 0,
            }}
          >
            {isHindi
              ? 'अपने शिल्प की कहानी बताएं'
              : 'Tell us about your craft'}
          </h1>
        </div>

        <LanguageSelector compact />
      </div>

      <ProductCreationSteps currentStep={2} />

      {photoPreview && (
        <div
          style={{
            background:
              'var(--color-surface)',
            borderBottom:
              '1px solid var(--color-border)',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <img
            src={photoPreview}
            alt="Selected product"
            style={{
              width: 44,
              height: 44,
              objectFit: 'cover',
              borderRadius:
                'var(--radius-md)',
              border:
                '1.5px solid var(--color-border-teal)',
              flexShrink: 0,
            }}
          />

          <div>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color:
                  'var(--color-success)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <ImageIcon size={13} />

              {isHindi
                ? 'फोटो जोड़ी गई ✓'
                : 'Photo added ✓'}
            </p>

            <p
              style={{
                fontSize: 11,
                color:
                  'var(--color-text-muted)',
                margin: 0,
              }}
            >
              {isHindi
                ? 'अब अपने उत्पाद के बारे में बताएं'
                : 'Now describe your product below'}
            </p>
          </div>
        </div>
      )}

      <div
        style={{
          maxWidth: 520,
          margin: '0 auto',
          padding:
            'var(--space-6) var(--space-4)',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: 'var(--text-base)',
            color:
              'var(--color-text-muted)',
            marginBottom:
              'var(--space-8)',
            lineHeight: 1.6,
          }}
        >
          {isHindi
            ? 'अपने उत्पाद, सामग्री, कहानी और शिल्पकारी का वर्णन करें।'
            : 'Describe your product, materials, story, and craftsmanship.'}
        </p>

        <div
          style={{
            background:
              'var(--color-surface)',
            border:
              '1px solid var(--color-border)',
            borderRadius:
              'var(--radius-xl)',
            padding: '2.5rem 1.5rem',
            marginBottom:
              'var(--space-6)',
            boxShadow:
              '0 4px 20px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: 140,
              height: 140,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            {recording && (
              <>
                <div
                  style={{
                    position: 'absolute',
                    inset: -12,
                    borderRadius: '50%',
                    background:
                      'rgba(239, 68, 68, 0.15)',
                    animation:
                      'pulse 1.5s ease-in-out infinite',
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    inset: -24,
                    borderRadius: '50%',
                    background:
                      'rgba(239, 68, 68, 0.08)',
                    animation:
                      'pulse 2s ease-in-out infinite',
                  }}
                />
              </>
            )}

            <button
              onClick={
                recording
                  ? stopRecording
                  : startRecording
              }
              disabled={processingVoice}
              aria-label={
                recording
                  ? t('artisan.tapToStop')
                  : t('artisan.tapToSpeak')
              }
              style={{
                width: 110,
                height: 110,
                borderRadius: '50%',
                background: recording
                  ? 'var(--color-error)'
                  : 'linear-gradient(135deg, var(--color-primary), #0D9488)',
                border: 'none',
                cursor:
                  processingVoice
                    ? 'not-allowed'
                    : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                color: '#fff',
                boxShadow: recording
                  ? '0 0 0 8px rgba(239, 68, 68, 0.25)'
                  : '0 6px 24px rgba(15, 118, 110, 0.35)',
                transition:
                  'all 0.3s ease',
                zIndex: 2,
                opacity:
                  processingVoice
                    ? 0.6
                    : 1,
              }}
            >
              {recording ? (
                <Square
                  size={36}
                  fill="#fff"
                />
              ) : (
                <Mic
                  size={40}
                  strokeWidth={2}
                />
              )}
            </button>
          </div>

          {recording ? (
            <div>
              <p
                style={{
                  fontSize:
                    'var(--text-3xl)',
                  fontWeight:
                    'var(--weight-bold)',
                  color:
                    'var(--color-error)',
                  fontVariantNumeric:
                    'tabular-nums',
                  margin:
                    '8px 0 4px',
                }}
              >
                {fmt(seconds)}
              </p>

              <p
                style={{
                  fontSize:
                    'var(--text-xs)',
                  color:
                    'var(--color-text-muted)',
                  fontWeight: 600,
                  textTransform:
                    'uppercase',
                  letterSpacing:
                    '0.05em',
                  margin: 0,
                }}
              >
                {t('artisan.tapToStop')}
              </p>
            </div>
          ) : (
            <div>
              <p
                style={{
                  fontSize:
                    'var(--text-sm)',
                  fontWeight: 600,
                  color:
                    'var(--color-text)',
                  margin:
                    '4px 0 2px',
                }}
              >
                {done ? (
                  <span
                    style={{
                      color:
                        'var(--color-primary)',
                      display:
                        'inline-flex',
                      alignItems:
                        'center',
                      gap: 4,
                    }}
                  >
                    <CheckCircle2
                      size={16}
                    />

                    {t(
                      'artisan.recordingCaptured'
                    )}
                  </span>
                ) : (
                  t('artisan.tapToSpeak')
                )}
              </p>

              <p
                style={{
                  fontSize:
                    'var(--text-xs)',
                  color:
                    'var(--color-text-muted)',
                  margin: 0,
                }}
              >
                {isHindi
                  ? 'अंग्रेज़ी या हिंदी में स्वाभाविक रूप से बोलें'
                  : 'Speak naturally in English or Hindi'}
              </p>
            </div>
          )}
        </div>

        {voiceError && (
          <div
            role="alert"
            style={{
              background: '#FEF2F2',
              border:
                '1px solid #FECACA',
              color: '#B91C1C',
              borderRadius: 10,
              padding:
                '0.75rem 1rem',
              marginBottom:
                'var(--space-5)',
              textAlign: 'left',
              fontSize:
                'var(--text-sm)',
            }}
          >
            {voiceError}
          </div>
        )}

        {(recording || done) && (
          <div
            style={{
              background:
                'var(--color-surface)',
              border:
                '1px solid var(--color-border)',
              borderRadius:
                'var(--radius-lg)',
              padding:
                'var(--space-4) var(--space-5)',
              marginBottom:
                'var(--space-5)',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  'space-between',
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize:
                    'var(--text-xs)',
                  color:
                    'var(--color-text-muted)',
                  fontWeight: 700,
                  textTransform:
                    'uppercase',
                  letterSpacing:
                    '0.05em',
                  display: 'flex',
                  alignItems:
                    'center',
                  gap: 6,
                }}
              >
                <Volume2 size={14} />

                {recording
                  ? isHindi
                    ? 'आपकी आवाज़ रिकॉर्ड हो रही है'
                    : 'Recording your voice…'
                  : t(
                      'artisan.yourRecording'
                    )}
              </span>

              {recording && (
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background:
                      'var(--color-error)',
                    animation:
                      'pulse 1s infinite',
                  }}
                />
              )}
            </div>

            <p
              style={{
                fontSize:
                  'var(--text-base)',
                color:
                  'var(--color-text)',
                lineHeight: 1.7,
                minHeight: 64,
                margin: 0,
              }}
            >
              {transcript || (
                <span
                  style={{
                    color:
                      'var(--color-text-muted)',
                    fontStyle: 'italic',
                  }}
                >
                  {recording
                    ? isHindi
                      ? 'सुन रहा हूँ… बोलते रहें।'
                      : 'Listening… speak naturally about your craft.'
                    : t(
                        'artisan.waitingForSpeech'
                      )}
                </span>
              )}
            </p>
          </div>
        )}

        {done && (
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-3)',
              marginBottom:
                'var(--space-6)',
            }}
          >
            <button
              onClick={reset}
              disabled={processingVoice}
              style={{
                flex: 1,
                padding: '0.875rem',
                background:
                  'var(--color-surface)',
                border:
                  '1.5px solid var(--color-border)',
                borderRadius:
                  'var(--radius-lg)',
                cursor:
                  processingVoice
                    ? 'not-allowed'
                    : 'pointer',
                display: 'flex',
                alignItems:
                  'center',
                justifyContent:
                  'center',
                gap:
                  'var(--space-2)',
                color:
                  'var(--color-text)',
                fontSize:
                  'var(--text-sm)',
                fontWeight: 600,
                minHeight: 50,
              }}
            >
              <RefreshCw size={16} />

              {t('artisan.tryAgain')}
            </button>

            <button
              onClick={proceed}
              disabled={processingVoice}
              style={{
                flex: 2,
                padding: '0.875rem',
                background:
                  'var(--color-primary)',
                border: 'none',
                borderRadius:
                  'var(--radius-lg)',
                cursor:
                  processingVoice
                    ? 'not-allowed'
                    : 'pointer',
                display: 'flex',
                alignItems:
                  'center',
                justifyContent:
                  'center',
                gap:
                  'var(--space-2)',
                color: '#fff',
                fontSize:
                  'var(--text-base)',
                fontWeight: 700,
                minHeight: 50,
                opacity:
                  processingVoice
                    ? 0.7
                    : 1,
              }}
            >
              {processingVoice ? (
                <>
                  <Loader2
                    size={18}
                    style={{
                      animation:
                        'spin 0.8s linear infinite',
                    }}
                  />

                  {isHindi
                    ? 'आवाज़ प्रोसेस हो रही है...'
                    : 'Processing voice...'}
                </>
              ) : (
                <>
                  {t('actions.continue')}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        )}

        <div
          style={{
            background:
              'var(--color-surface-teal)',
            border:
              '1px solid var(--color-border-teal)',
            borderRadius:
              'var(--radius-lg)',
            padding:
              'var(--space-4) var(--space-5)',
            textAlign: 'left',
          }}
        >
          <p
            style={{
              fontSize:
                'var(--text-sm)',
              color:
                'var(--color-primary)',
              fontWeight: 700,
              marginBottom: 8,
              display: 'flex',
              alignItems:
                'center',
              gap: 6,
            }}
          >
            <Sparkles size={16} />

            {t('artisan.whatToSay')}
          </p>

          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection:
                'column',
              gap: 6,
            }}
          >
            {[
              t('artisan.tip1'),
              t('artisan.tip2'),
              t('artisan.tip3'),
              t('artisan.tip4'),
            ].map((tip, idx) => (
              <li
                key={idx}
                style={{
                  fontSize:
                    'var(--text-xs)',
                  color:
                    'var(--color-text-muted)',
                  display: 'flex',
                  gap: 8,
                  lineHeight: 1.4,
                }}
              >
                <span
                  style={{
                    color:
                      'var(--color-primary)',
                    fontWeight: 700,
                  }}
                >
                  •
                </span>

                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}