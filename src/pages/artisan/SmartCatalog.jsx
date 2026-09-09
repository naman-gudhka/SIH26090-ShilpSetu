import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  RefreshCw,
  Loader2,
} from 'lucide-react';

import {
  CRAFTS,
  CATEGORIES,
} from '../../data/mockData.js';

import {
  catalogGenerationService,
} from '../../services/catalogGenerationService.js';

import {
  useLanguage,
} from '../../context/LanguageContext.jsx';

const inp = {
  width: '100%',
  padding:
    '0.75rem 1rem',
  borderRadius:
    'var(--radius-md)',
  border:
    '1.5px solid var(--color-border)',
  background:
    'var(--color-bg)',
  fontSize:
    'var(--text-base)',
  color:
    'var(--color-text)',
  boxSizing:
    'border-box',
};

const lab = {
  fontSize:
    'var(--text-sm)',
  fontWeight:
    'var(--weight-semibold)',
  color:
    'var(--color-text)',
  marginBottom:
    6,
  display:
    'block',
};

function emptyCatalog() {
  return {
    title: '',
    titleHindi: '',
    description: '',
    descriptionHindi: '',
    craft: '',
    category: '',
    materials: '',
    dimensions: '',
    weight: '',
    colors: '',
  };
}

/*
 * Converts the AI response into the exact
 * shape required by this page.
 *
 * Supports BOTH:
 *
 * {
 *   productName: "...",
 *   ...
 * }
 *
 * and:
 *
 * {
 *   success: true,
 *   catalog: {
 *     productName: "...",
 *     ...
 *   }
 * }
 */
function normaliseCatalogResponse(
  response
) {
  if (
    !response ||
    typeof response !==
      'object'
  ) {
    return null;
  }

  const cat =
    response.catalog &&
    typeof response.catalog ===
      'object'
      ? response.catalog
      : response;

  return {
    title:
      cat.productName ||
      cat.title ||
      '',

    titleHindi:
      cat.productNameHindi ||
      cat.titleHindi ||
      '',

    description:
      cat.description ||
      '',

    descriptionHindi:
      cat.descriptionHindi ||
      '',

    craft:
      cat.craft ||
      '',

    category:
      cat.category ||
      '',

    materials:
      Array.isArray(
        cat.materials
      )
        ? cat.materials.join(
            ', '
          )
        : cat.materials ||
          '',

    dimensions:
      cat.dimensions ||
      '',

    weight:
      cat.weight ||
      '',

    colors:
      Array.isArray(
        cat.colors
      )
        ? cat.colors.join(
            ', '
          )
        : cat.colors ||
          '',
  };
}

/*
 * Read the AI-generated catalog
 * from sessionStorage.
 */
function getInitialCatalog() {
  try {
    const raw =
      sessionStorage.getItem(
        'ss_catalog_generated'
      );

    if (!raw) {
      return emptyCatalog();
    }

    const parsed =
      JSON.parse(raw);

    const catalog =
      normaliseCatalogResponse(
        parsed
      );

    if (!catalog) {
      return emptyCatalog();
    }

    return catalog;
  } catch (error) {
    console.warn(
      'Unable to read generated catalog:',
      error
    );

    return emptyCatalog();
  }
}

export function SmartCatalog() {
  const navigate =
    useNavigate();

  const {
    t,
    isHindi,
  } = useLanguage();

  const [
    form,
    setForm,
  ] = useState(
    getInitialCatalog
  );

  const [
    error,
    setError,
  ] = useState('');

  const [
    regenerating,
    setRegenerating,
  ] = useState(false);

  /*
   * If the component opens before
   * sessionStorage has been populated,
   * check again after mount.
   */
  useEffect(() => {
    const generated =
      getInitialCatalog();

    if (
      generated.title ||
      generated.description ||
      generated.craft ||
      generated.category
    ) {
      setForm(
        generated
      );
    }
  }, []);

  const set =
    (field) =>
    (event) => {
      if (error) {
        setError('');
      }

      setForm(
        (previous) => ({
          ...previous,
          [field]:
            event.target.value,
        })
      );
    };

  const handleRegenerate =
    async () => {
      setRegenerating(
        true
      );

      setError('');

      try {
        const transcript =
          sessionStorage.getItem(
            'ss_voice_transcript'
          ) || '';

        const translationEnglish =
          sessionStorage.getItem(
            'ss_voice_translation'
          ) || '';

        const translationHindi =
          sessionStorage.getItem(
            'ss_voice_translation_hi'
          ) || '';

        const imageUrl =
          sessionStorage.getItem(
            'ss_enhanced_photo_url'
          ) || '';

        let imageAnalysis =
          {};

        try {
          imageAnalysis =
            JSON.parse(
              sessionStorage.getItem(
                'ss_image_analysis'
              ) || '{}'
            );
        } catch {
          imageAnalysis =
            {};
        }

        if (
          !transcript &&
          !translationEnglish
        ) {
          throw new Error(
            'No artisan description was recorded.'
          );
        }

        if (!imageUrl) {
          throw new Error(
            'No processed product image is available.'
          );
        }

        const response =
          await catalogGenerationService.generateCatalog(
            {
              transcript,

              translationEnglish:
                translationEnglish ||
                transcript,

              translationHindi,

              language:
                isHindi
                  ? 'hi'
                  : 'en',

              imageUrl,

              imageAnalysis,

              method:
                'gemini-multimodal-pipeline',
            }
          );

        console.log(
          'Catalog regeneration response:',
          response
        );

        const catalog =
          normaliseCatalogResponse(
            response
          );

        if (
          !catalog ||
          !catalog.title
        ) {
          throw new Error(
            'Gemini did not return a valid product catalog.'
          );
        }

        setForm(
          catalog
        );

        /*
         * Store the clean catalog object,
         * not the API wrapper.
         */
        sessionStorage.setItem(
          'ss_catalog_generated',
          JSON.stringify(
            {
              productName:
                catalog.title,

              productNameHindi:
                catalog.titleHindi,

              description:
                catalog.description,

              descriptionHindi:
                catalog.descriptionHindi,

              craft:
                catalog.craft,

              category:
                catalog.category,

              materials:
                catalog.materials
                  ? catalog.materials
                      .split(',')
                      .map(
                        (item) =>
                          item.trim()
                      )
                      .filter(
                        Boolean
                      )
                  : [],

              dimensions:
                catalog.dimensions,

              weight:
                catalog.weight,

              colors:
                catalog.colors
                  ? catalog.colors
                      .split(',')
                      .map(
                        (item) =>
                          item.trim()
                      )
                      .filter(
                        Boolean
                      )
                  : [],
            }
          )
        );
      } catch (regenerateError) {
        console.error(
          'Catalog regeneration failed:',
          regenerateError
        );

        setError(
          regenerateError?.message ||
            (isHindi
              ? 'AI सुझाव ताज़ा नहीं हो सके।'
              : 'Could not refresh AI suggestions.')
        );
      } finally {
        setRegenerating(
          false
        );
      }
    };

  const proceed =
    () => {
      /*
       * Product name is required.
       */
      if (
        !form.title.trim()
      ) {
        setError(
          isHindi
            ? 'कृपया उत्पाद का नाम दर्ज करें।'
            : 'Please provide a product title in English.'
        );

        return;
      }

      /*
       * Description is also required
       * for the catalog.
       */
      if (
        !form.description.trim()
      ) {
        setError(
          isHindi
            ? 'कृपया उत्पाद का विवरण दर्ज करें।'
            : 'Please provide a product description in English.'
        );

        return;
      }

      /*
       * Convert the editable form
       * into the existing catalog
       * session format.
       */
      const finalCatalog = {
        productName:
          form.title,

        productNameHindi:
          form.titleHindi,

        title:
          form.title,

        titleHindi:
          form.titleHindi,

        description:
          form.description,

        descriptionHindi:
          form.descriptionHindi,

        craft:
          form.craft,

        category:
          form.category,

        materials:
          form.materials
            ? form.materials
                .split(',')
                .map(
                  (item) =>
                    item.trim()
                )
                .filter(
                  Boolean
                )
            : [],

        dimensions:
          form.dimensions,

        weight:
          form.weight,

        colors:
          form.colors
            ? form.colors
                .split(',')
                .map(
                  (item) =>
                    item.trim()
                )
                .filter(
                  Boolean
                )
            : [],
      };

      /*
       * ss_catalog = artisan-reviewed
       * editable catalog.
       */
      sessionStorage.setItem(
        'ss_catalog',
        JSON.stringify(
          finalCatalog
        )
      );

      /*
       * Keep generated version
       * synchronized as well.
       */
      sessionStorage.setItem(
        'ss_catalog_generated',
        JSON.stringify(
          finalCatalog
        )
      );

      navigate(
        '/artisan/products/pricing'
      );
    };

  return (
    <div
      style={{
        minHeight:
          '100vh',
        background:
          'var(--color-bg)',
        paddingBottom:
          100,
      }}
    >
      {/* AI Banner */}
      <div
        style={{
          background:
            'var(--color-primary-light)',
          borderBottom:
            '1px solid var(--color-border-teal)',
          padding:
            'var(--space-3) var(--space-5)',
          display:
            'flex',
          alignItems:
            'center',
          justifyContent:
            'space-between',
          gap:
            'var(--space-2)',
        }}
      >
        <div
          style={{
            display:
              'flex',
            alignItems:
              'center',
            gap:
              'var(--space-2)',
          }}
        >
          <Sparkles
            size={16}
            color="var(--color-primary)"
          />

          <p
            style={{
              fontSize:
                'var(--text-sm)',
              color:
                'var(--color-primary)',
              fontWeight:
                'var(--weight-medium)',
              margin: 0,
            }}
          >
            {t(
              'artisan.aiBannerDraft'
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={
            handleRegenerate
          }
          disabled={
            regenerating
          }
          style={{
            background:
              'transparent',
            border:
              '1px solid var(--color-primary)',
            borderRadius:
              'var(--radius-md)',
            padding:
              '4px 10px',
            fontSize:
              'var(--text-xs)',
            color:
              'var(--color-primary)',
            cursor:
              regenerating
                ? 'not-allowed'
                : 'pointer',
            display:
              'flex',
            alignItems:
              'center',
            gap: 4,
            fontWeight:
              600,
          }}
        >
          {regenerating ? (
            <Loader2
              size={12}
              style={{
                animation:
                  'spin 0.8s linear infinite',
              }}
            />
          ) : (
            <RefreshCw
              size={12}
            />
          )}

          {t(
            'artisan.regenerate'
          )}
        </button>
      </div>

      {/* Main form */}
      <div
        style={{
          maxWidth:
            600,
          margin:
            '0 auto',
          padding:
            'var(--space-5)',
        }}
      >
        <h1
          style={{
            fontSize:
              'var(--text-2xl)',
            fontWeight:
              'var(--weight-bold)',
            color:
              'var(--color-text)',
            marginBottom:
              'var(--space-1)',
          }}
        >
          {t(
            'artisan.reviewListing'
          )}
        </h1>

        <p
          style={{
            fontSize:
              'var(--text-sm)',
            color:
              'var(--color-text-muted)',
            marginBottom:
              'var(--space-6)',
          }}
        >
          {t(
            'artisan.reviewListingDesc'
          )}
        </p>

        {/* Error */}
        {error && (
          <div
            role="alert"
            style={{
              background:
                '#FEF2F2',
              border:
                '1px solid #FECACA',
              borderRadius:
                10,
              padding:
                '0.75rem 1rem',
              fontSize:
                '0.875rem',
              color:
                '#B91C1C',
              marginBottom:
                'var(--space-4)',
            }}
          >
            {error}
          </div>
        )}

        {/* Product Name English */}
        <div
          style={{
            marginBottom:
              'var(--space-4)',
          }}
        >
          <label
            style={lab}
          >
            {t(
              'artisan.productNameEn'
            )}{' '}
            <span
              style={{
                color:
                  'var(--color-error)',
              }}
            >
              *
            </span>
          </label>

          <input
            value={
              form.title
            }
            onChange={set(
              'title'
            )}
            style={inp}
            placeholder="e.g. Handcrafted Flower Garland"
          />
        </div>

        {/* Product Name Hindi */}
        <div
          style={{
            marginBottom:
              'var(--space-4)',
          }}
        >
          <label
            style={lab}
          >
            {t(
              'artisan.productNameHi'
            )}
          </label>

          <input
            value={
              form.titleHindi
            }
            onChange={set(
              'titleHindi'
            )}
            style={{
              ...inp,
              fontFamily:
                'inherit',
            }}
            dir="auto"
            placeholder="उत्पाद का नाम"
          />
        </div>

        {/* Description English */}
        <div
          style={{
            marginBottom:
              'var(--space-4)',
          }}
        >
          <label
            style={lab}
          >
            {t(
              'artisan.descriptionEn'
            )}{' '}
            <span
              style={{
                color:
                  'var(--color-error)',
              }}
            >
              *
            </span>
          </label>

          <textarea
            value={
              form.description
            }
            onChange={set(
              'description'
            )}
            rows={4}
            style={{
              ...inp,
              resize:
                'vertical',
              fontFamily:
                'inherit',
            }}
          />
        </div>

        {/* Description Hindi */}
        <div
          style={{
            marginBottom:
              'var(--space-4)',
          }}
        >
          <label
            style={lab}
          >
            {t(
              'artisan.descriptionHi'
            )}
          </label>

          <textarea
            value={
              form.descriptionHindi
            }
            onChange={set(
              'descriptionHindi'
            )}
            rows={3}
            dir="auto"
            style={{
              ...inp,
              resize:
                'vertical',
              fontFamily:
                'inherit',
            }}
          />
        </div>

        {/* Craft + Category */}
        <div
          style={{
            display:
              'grid',
            gridTemplateColumns:
              '1fr 1fr',
            gap:
              'var(--space-4)',
            marginBottom:
              'var(--space-4)',
          }}
        >
          <div>
            <label
              style={lab}
            >
              {t(
                'artisan.craftType'
              )}
            </label>

            <select
              value={
                form.craft
              }
              onChange={set(
                'craft'
              )}
              style={{
                ...inp,
                appearance:
                  'none',
              }}
            >
              <option
                value=""
              >
                Not specified
              </option>

              {CRAFTS.map(
                (
                  craft
                ) => (
                  <option
                    key={
                      craft
                    }
                    value={
                      craft
                    }
                  >
                    {craft}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label
              style={lab}
            >
              {t(
                'artisan.category'
              )}
            </label>

            <select
              value={
                form.category
              }
              onChange={set(
                'category'
              )}
              style={{
                ...inp,
                appearance:
                  'none',
              }}
            >
              <option
                value=""
              >
                Not specified
              </option>

              {CATEGORIES.map(
                (
                  category
                ) => (
                  <option
                    key={
                      category
                    }
                    value={
                      category
                    }
                  >
                    {category}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* Dimensions + Weight */}
        <div
          style={{
            display:
              'grid',
            gridTemplateColumns:
              '1fr 1fr',
            gap:
              'var(--space-4)',
            marginBottom:
              'var(--space-4)',
          }}
        >
          <div>
            <label
              style={lab}
            >
              {t(
                'artisan.dimensions'
              )}
            </label>

            <input
              value={
                form.dimensions
              }
              onChange={set(
                'dimensions'
              )}
              placeholder="e.g. 30cm × 35cm"
              style={inp}
            />
          </div>

          <div>
            <label
              style={lab}
            >
              {t(
                'artisan.weight'
              )}
            </label>

            <input
              value={
                form.weight
              }
              onChange={set(
                'weight'
              )}
              placeholder="e.g. 350g"
              style={inp}
            />
          </div>
        </div>

        {/* Materials */}
        <div
          style={{
            marginBottom:
              'var(--space-4)',
          }}
        >
          <label
            style={lab}
          >
            {t(
              'artisan.materials'
            )}
          </label>

          <input
            value={
              form.materials
            }
            onChange={set(
              'materials'
            )}
            placeholder="e.g. Cotton, Silk thread, Mirror pieces"
            style={inp}
          />
        </div>

        {/* Colors */}
        <div
          style={{
            marginBottom:
              'var(--space-6)',
          }}
        >
          <label
            style={lab}
          >
            {t(
              'artisan.colors'
            )}
          </label>

          <input
            value={
              form.colors
            }
            onChange={set(
              'colors'
            )}
            placeholder="e.g. Red, Gold, Multicolor"
            style={inp}
          />
        </div>

        {/* Continue */}
        <button
          onClick={
            proceed
          }
          type="button"
          style={{
            width:
              '100%',
            padding:
              'var(--space-4)',
            background:
              'var(--color-primary)',
            color:
              '#fff',
            border:
              'none',
            borderRadius:
              'var(--radius-lg)',
            fontSize:
              'var(--text-base)',
            fontWeight:
              'var(--weight-semibold)',
            cursor:
              'pointer',
            minHeight:
              52,
            display:
              'flex',
            alignItems:
              'center',
            justifyContent:
              'center',
            gap:
              'var(--space-2)',
          }}
        >
          {t(
            'artisan.continueToPricing'
          )}

          <ArrowRight
            size={18}
          />
        </button>
      </div>
    </div>
  );
}