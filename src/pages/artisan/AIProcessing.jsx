import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

import { imageEnhancementService } from '../../services/imageEnhancementService.js';
import { catalogGenerationService } from '../../services/catalogGenerationService.js';
import { pricingSuggestionService } from '../../services/pricingSuggestionService.js';
import { photoFileStore } from '../../services/photoFileStore.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

const STEPS = [
  {
    id: 'photo',
    title: 'Enhancing product photo',
    titleHi: 'उत्पाद की फोटो बेहतर की जा रही है',
  },
  {
    id: 'background',
    title: 'Removing background',
    titleHi: 'बैकग्राउंड हटाया जा रहा है',
  },
  {
    id: 'professional',
    title: 'Creating professional image',
    titleHi: 'प्रोफेशनल फोटो तैयार की जा रही है',
  },
  {
    id: 'image-analysis',
    title: 'Understanding the product image',
    titleHi: 'उत्पाद की फोटो को समझा जा रहा है',
  },
  {
    id: 'voice',
    title: 'Processing artisan story',
    titleHi: 'कारीगर की कहानी प्रोसेस की जा रही है',
  },
  {
    id: 'translation',
    title: 'Translating artisan story',
    titleHi: 'कारीगर की कहानी का अनुवाद किया जा रहा है',
  },
  {
    id: 'catalog',
    title: 'Preparing smart catalog',
    titleHi: 'स्मार्ट कैटलॉग तैयार किया जा रहा है',
  },
  {
    id: 'pricing',
    title: 'Checking smart price',
    titleHi: 'स्मार्ट कीमत तैयार की जा रही है',
  },
];

function safeGetSession(key) {
  try {
    return sessionStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

function safeSetSession(key, value) {
  try {
    sessionStorage.setItem(key, value);
  } catch (error) {
    console.warn(
      `Unable to save ${key} to sessionStorage.`,
      error
    );
  }
}

function safeRemoveSession(key) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Safe cleanup.
  }
}

function readJson(key, fallback = null) {
  const value = safeGetSession(key);

  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function dataUrlToFile(
  dataUrl,
  fileName = 'product-image.jpg'
) {
  if (
    !dataUrl ||
    !dataUrl.startsWith('data:')
  ) {
    return null;
  }

  try {
    const parts = dataUrl.split(',');

    const metadata = parts[0];
    const base64 = parts[1];

    if (!metadata || !base64) {
      return null;
    }

    const mimeMatch =
      metadata.match(
        /data:(.*?);base64/
      );

    const mimeType =
      mimeMatch?.[1] ||
      'image/jpeg';

    const binaryString =
      window.atob(base64);

    const bytes =
      new Uint8Array(
        binaryString.length
      );

    for (
      let index = 0;
      index < binaryString.length;
      index += 1
    ) {
      bytes[index] =
        binaryString.charCodeAt(index);
    }

    const blob =
      new Blob(
        [bytes],
        {
          type: mimeType,
        }
      );

    return new File(
      [blob],
      fileName,
      {
        type: mimeType,
      }
    );
  } catch (error) {
    console.warn(
      'Unable to convert preview into File.',
      error
    );

    return null;
  }
}

function getVoiceContext() {
  return {
    transcript:
      safeGetSession(
        'ss_voice_transcript'
      ),

    translationEnglish:
      safeGetSession(
        'ss_voice_translation'
      ),

    translationHindi:
      safeGetSession(
        'ss_voice_translation_hi'
      ),

    cleanedStory:
      safeGetSession(
        'ss_voice_cleaned_story'
      ),

    language:
      safeGetSession(
        'ss_voice_language'
      ),
  };
}

export function AIProcessing() {
  const navigate =
    useNavigate();

  const {
    language,
  } = useLanguage();

  const isHindi =
    language === 'hi';

  const [
    currentStep,
    setCurrentStep,
  ] = useState(0);

  const [
    completedSteps,
    setCompletedSteps,
  ] = useState([]);

  const [
    error,
    setError,
  ] = useState('');

  const [
    isComplete,
    setIsComplete,
  ] = useState(false);

  const [
    statusMessage,
    setStatusMessage,
  ] = useState('');

  const [
    started,
    setStarted,
  ] = useState(false);

  const markComplete = (
    stepId
  ) => {
    setCompletedSteps(
      (previous) => {
        if (
          previous.includes(
            stepId
          )
        ) {
          return previous;
        }

        return [
          ...previous,
          stepId,
        ];
      }
    );
  };

  const runStep = async (
    index,
    stepId,
    callback
  ) => {
    setCurrentStep(index);

    setStatusMessage(
      isHindi
        ? STEPS[index].titleHi
        : STEPS[index].title
    );

    await callback();

    markComplete(stepId);

    await new Promise(
      (resolve) => {
        setTimeout(
          resolve,
          350
        );
      }
    );
  };

  const processProduct =
    async () => {
      if (started) {
        return;
      }

      setStarted(true);
      setError('');
      setIsComplete(false);

      /*
       * Clear only results from the
       * previous product-processing run.
       */
      safeRemoveSession(
        'ss_catalog_generated'
      );

      safeRemoveSession(
        'ss_catalog'
      );

      safeRemoveSession(
        'ss_price'
      );

      safeRemoveSession(
        'ss_smart_price'
      );

      safeRemoveSession(
        'ss_image_analysis'
      );

      safeRemoveSession(
        'ss_catalog_image_url'
      );

      try {
        /*
         * ---------------------------------
         * STEP 0 — GET PRODUCT PHOTO
         * ---------------------------------
         */
        let imageFile =
          photoFileStore.get();

        /*
         * If the in-memory File is gone
         * after navigation/refresh, recover
         * it from the photo preview.
         */
        if (!imageFile) {
          const preview =
            safeGetSession(
              'ss_photo_preview'
            );

          imageFile =
            dataUrlToFile(
              preview,
              'product-image.jpg'
            );
        }

        if (!imageFile) {
          throw new Error(
            'Product image is missing. Please go back and select a product photo again.'
          );
        }

        /*
         * ---------------------------------
         * STEP 1 — IMAGE ENHANCEMENT
         * ---------------------------------
         */
        let enhancedImage =
          null;

        await runStep(
          0,
          'photo',
          async () => {
            enhancedImage =
              await imageEnhancementService.enhanceImage(
                imageFile
              );

            if (
              !enhancedImage?.professionalUrl
            ) {
              throw new Error(
                'Professional product image could not be created.'
              );
            }

            safeSetSession(
              'ss_enhanced_photo_url',
              enhancedImage.professionalUrl
            );

            safeSetSession(
              'ss_catalog_image_url',
              enhancedImage.catalogUrl ||
                enhancedImage.professionalUrl
            );
          }
        );

        /*
         * ---------------------------------
         * STEP 2 — BACKGROUND REMOVAL
         * ---------------------------------
         */
        await runStep(
          1,
          'background',
          async () => {
            if (
              !enhancedImage?.backgroundRemovedUrl
            ) {
              throw new Error(
                'Background removal did not complete.'
              );
            }

            safeSetSession(
              'ss_background_removed_url',
              enhancedImage.backgroundRemovedUrl
            );
          }
        );

        /*
         * ---------------------------------
         * STEP 3 — PROFESSIONAL IMAGE
         * ---------------------------------
         */
        await runStep(
          2,
          'professional',
          async () => {
            if (
              !enhancedImage?.professionalUrl
            ) {
              throw new Error(
                'Professional image was not generated.'
              );
            }

            safeSetSession(
              'ss_enhanced_photo_url',
              enhancedImage.professionalUrl
            );

            safeSetSession(
              'ss_professional_image_url',
              enhancedImage.professionalUrl
            );
          }
        );

        /*
         * ---------------------------------
         * STEP 4 — GEMINI IMAGE ANALYSIS
         * ---------------------------------
         */
        let imageAnalysis =
          null;

        await runStep(
          3,
          'image-analysis',
          async () => {
            imageAnalysis =
              await imageEnhancementService.analyzeImage(
                imageFile
              );

            if (
              !imageAnalysis?.analysis
            ) {
              throw new Error(
                'Gemini could not understand the product image.'
              );
            }

            safeSetSession(
              'ss_image_analysis',
              JSON.stringify(
                imageAnalysis.analysis
              )
            );

            console.log(
              'Product image analysis:',
              imageAnalysis.analysis
            );
          }
        );

        /*
         * ---------------------------------
         * GET VOICE CONTEXT
         * ---------------------------------
         */
        let voiceContext =
          getVoiceContext();

        /*
         * ---------------------------------
         * STEP 5 — VOICE
         * ---------------------------------
         *
         * VoiceCapture already sends the
         * actual audio to Gemini and stores
         * the transcript here.
         */
        await runStep(
          4,
          'voice',
          async () => {
            voiceContext =
              getVoiceContext();

            if (
              !voiceContext.transcript &&
              !voiceContext.translationEnglish &&
              !voiceContext.cleanedStory
            ) {
              throw new Error(
                'Artisan voice description is missing. Please record the product story again.'
              );
            }

            if (
              voiceContext.transcript
            ) {
              safeSetSession(
                'ss_voice_transcript',
                voiceContext.transcript
              );
            }
          }
        );

        /*
         * ---------------------------------
         * STEP 6 — TRANSLATION
         * ---------------------------------
         */
        await runStep(
          5,
          'translation',
          async () => {
            voiceContext =
              getVoiceContext();

            const english =
              voiceContext.translationEnglish ||
              voiceContext.cleanedStory ||
              voiceContext.transcript;

            if (!english) {
              throw new Error(
                'The artisan story could not be translated.'
              );
            }

            safeSetSession(
              'ss_voice_translation',
              english
            );

            if (
              voiceContext.translationHindi
            ) {
              safeSetSession(
                'ss_voice_translation_hi',
                voiceContext.translationHindi
              );
            }

            if (
              voiceContext.cleanedStory
            ) {
              safeSetSession(
                'ss_voice_cleaned_story',
                voiceContext.cleanedStory
              );
            }
          }
        );

        /*
         * ---------------------------------
         * STEP 7 — GEMINI CATALOG
         * ---------------------------------
         */
        let catalog =
          null;

        await runStep(
          6,
          'catalog',
          async () => {
            voiceContext =
              getVoiceContext();

            const catalogResponse =
              await catalogGenerationService.generateCatalog(
                {
                  transcript:
                    voiceContext.transcript,

                  translationEnglish:
                    voiceContext.translationEnglish ||
                    voiceContext.cleanedStory ||
                    voiceContext.transcript,

                  translationHindi:
                    voiceContext.translationHindi,

                  language:
                    voiceContext.language,

                  imageUrl:
                    safeGetSession(
                      'ss_enhanced_photo_url'
                    ),

                  imageAnalysis:
                    imageAnalysis?.analysis ||
                    readJson(
                      'ss_image_analysis',
                      {}
                    ),

                  method:
                    'gemini-multimodal-pipeline',
                }
              );

            /*
             * IMPORTANT:
             *
             * The API/service may return:
             *
             * {
             *   success: true,
             *   catalog: {...}
             * }
             *
             * OR directly:
             *
             * {
             *   productName: "...",
             *   description: "..."
             * }
             *
             * Always extract the actual
             * catalog object.
             */
            catalog =
              catalogResponse?.catalog ||
              catalogResponse;

            console.log(
              'Raw catalog response:',
              catalogResponse
            );

            console.log(
              'Extracted catalog:',
              catalog
            );

            if (
              !catalog ||
              typeof catalog !==
                'object'
            ) {
              throw new Error(
                'Gemini generated an empty product catalog.'
              );
            }

            if (
              !catalog.productName &&
              !catalog.title
            ) {
              throw new Error(
                'Gemini generated product data, but no product name was returned.'
              );
            }

            /*
             * Store ONLY the actual catalog
             * object, not the API wrapper.
             */
            safeSetSession(
              'ss_catalog_generated',
              JSON.stringify(
                catalog
              )
            );

            console.log(
              'Final AI catalog stored:',
              catalog
            );
          }
        );

        /*
         * ---------------------------------
         * STEP 8 — SMART PRICING
         * ---------------------------------
         */
        await runStep(
          7,
          'pricing',
          async () => {
            const generatedCatalog =
              catalog ||
              readJson(
                'ss_catalog_generated',
                {}
              );

            const pricing =
              await pricingSuggestionService.suggestPrice(
                {
                  ...generatedCatalog,

                  imageAnalysis:
                    imageAnalysis?.analysis ||
                    readJson(
                      'ss_image_analysis',
                      {}
                    ),

                  transcript:
                    voiceContext.transcript,

                  translationEnglish:
                    voiceContext.translationEnglish ||
                    voiceContext.cleanedStory ||
                    voiceContext.transcript,

                  translationHindi:
                    voiceContext.translationHindi,

                  artisanStory:
                    voiceContext.cleanedStory ||
                    voiceContext.translationEnglish ||
                    voiceContext.transcript,

                  imageUrl:
                    safeGetSession(
                      'ss_enhanced_photo_url'
                    ),
                }
              );

            if (
              !pricing ||
              !pricing.suggestedPrice
            ) {
              throw new Error(
                'Smart pricing did not return a valid suggested price.'
              );
            }

            safeSetSession(
              'ss_price',
              String(
                pricing.suggestedPrice
              )
            );

            safeSetSession(
              'ss_smart_price',
              JSON.stringify(
                pricing
              )
            );
          }
        );

        /*
         * ---------------------------------
         * COMPLETE
         * ---------------------------------
         */
        setCurrentStep(
          STEPS.length - 1
        );

        setStatusMessage(
          isHindi
            ? 'आपका स्मार्ट कैटलॉग तैयार है'
            : 'Your smart catalog is ready'
        );

        setIsComplete(true);

        setTimeout(
          () => {
            navigate(
              '/artisan/products/catalog'
            );
          },
          900
        );
      } catch (
        processingError
      ) {
        console.error(
          'AI processing pipeline failed:',
          processingError
        );

        setError(
          processingError?.message ||
            'Something went wrong while processing your product.'
        );

        setStarted(false);
      }
    };

  useEffect(() => {
    processProduct();

    // Run the pipeline only once
    // when the processing page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        minHeight: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding:
          '32px 20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              margin:
                '0 auto 16px',
              borderRadius: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background:
                'rgba(194, 84, 46, 0.10)',
            }}
          >
            {isComplete ? (
              <CheckCircle2
                size={34}
                strokeWidth={2}
              />
            ) : (
              <Sparkles
                size={34}
                strokeWidth={2}
              />
            )}
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: '28px',
              fontWeight: 700,
            }}
          >
            {isHindi
              ? 'आपका उत्पाद तैयार किया जा रहा है'
              : 'Creating your smart product listing'}
          </h1>

          <p
            style={{
              margin:
                '10px auto 0',
              maxWidth: '560px',
              opacity: 0.7,
              lineHeight: 1.6,
            }}
          >
            {isHindi
              ? 'आपकी फोटो और कारीगर की कहानी का उपयोग करके AI आपके उत्पाद की जानकारी तैयार कर रहा है।'
              : 'AI is using your product photo and artisan story to create the product information automatically.'}
          </p>
        </div>

        {/* Processing steps */}
        <div
          style={{
            border:
              '1px solid rgba(0,0,0,0.08)',
            borderRadius: '20px',
            padding: '24px',
            background:
              'rgba(255,255,255,0.75)',
            boxShadow:
              '0 12px 40px rgba(0,0,0,0.06)',
          }}
        >
          {STEPS.map(
            (
              step,
              index
            ) => {
              const isDone =
                completedSteps.includes(
                  step.id
                );

              const isActive =
                currentStep ===
                  index &&
                !isDone;

              const isPending =
                currentStep <
                index;

              return (
                <div
                  key={
                    step.id
                  }
                  style={{
                    display:
                      'flex',
                    alignItems:
                      'center',
                    gap: '14px',
                    padding:
                      '11px 4px',
                    opacity:
                      isPending
                        ? 0.45
                        : 1,
                  }}
                >
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      minWidth:
                        '34px',
                      borderRadius:
                        '50%',
                      display:
                        'flex',
                      alignItems:
                        'center',
                      justifyContent:
                        'center',
                    }}
                  >
                    {isDone ? (
                      <CheckCircle2
                        size={23}
                        strokeWidth={
                          2
                        }
                      />
                    ) : isActive ? (
                      <Loader2
                        size={23}
                        strokeWidth={
                          2
                        }
                        className="animate-spin"
                      />
                    ) : (
                      <div
                        style={{
                          width:
                            '9px',
                          height:
                            '9px',
                          borderRadius:
                            '50%',
                          border:
                            '2px solid currentColor',
                        }}
                      />
                    )}
                  </div>

                  <div
                    style={{
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        fontSize:
                          '15px',
                        fontWeight:
                          isActive ||
                          isDone
                            ? 600
                            : 500,
                      }}
                    >
                      {isHindi
                        ? step.titleHi
                        : step.title}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize:
                        '12px',
                      opacity:
                        0.6,
                      whiteSpace:
                        'nowrap',
                    }}
                  >
                    {isDone
                      ? isHindi
                        ? 'पूर्ण'
                        : 'Done'
                      : isActive
                        ? isHindi
                          ? 'चल रहा है'
                          : 'Processing'
                        : ''}
                  </div>
                </div>
              );
            }
          )}
        </div>

        {/* Status */}
        {!error && (
          <div
            style={{
              marginTop:
                '20px',
              textAlign:
                'center',
              fontSize:
                '14px',
              opacity: 0.7,
            }}
          >
            {statusMessage}
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              marginTop:
                '20px',
              padding:
                '16px',
              borderRadius:
                '14px',
              display:
                'flex',
              alignItems:
                'flex-start',
              gap: '12px',
              border:
                '1px solid rgba(190,60,60,0.25)',
              background:
                'rgba(190,60,60,0.06)',
            }}
          >
            <AlertCircle
              size={22}
              style={{
                minWidth:
                  '22px',
              }}
            />

            <div
              style={{
                flex: 1,
              }}
            >
              <strong>
                {isHindi
                  ? 'AI processing रुक गया'
                  : 'AI processing stopped'}
              </strong>

              <p
                style={{
                  margin:
                    '6px 0 0',
                  lineHeight:
                    1.5,
                }}
              >
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Retry */}
        {error && (
          <div
            style={{
              marginTop:
                '18px',
              display:
                'flex',
              justifyContent:
                'center',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setError('');
                setCompletedSteps(
                  []
                );
                setCurrentStep(
                  0
                );
                setIsComplete(
                  false
                );
                setStarted(
                  false
                );

                setTimeout(
                  () => {
                    processProduct();
                  },
                  50
                );
              }}
              style={{
                display:
                  'inline-flex',
                alignItems:
                  'center',
                gap: '8px',
                padding:
                  '11px 18px',
                border:
                  '1px solid currentColor',
                borderRadius:
                  '10px',
                background:
                  'transparent',
                cursor:
                  'pointer',
                fontWeight:
                  600,
              }}
            >
              <ArrowRight
                size={17}
              />

              {isHindi
                ? 'फिर से कोशिश करें'
                : 'Try again'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}