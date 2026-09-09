const PRICING_API_URL =
  '/api/suggest-price';

const PRICE_STORAGE_KEY =
  'ss_price';

const IMAGE_ANALYSIS_KEY =
  'ss_image_analysis';

function safeJsonParse(
  value,
  fallback = null
) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normaliseNumber(
  value,
  fallback = 0
) {
  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function getImageAnalysis() {
  return safeJsonParse(
    sessionStorage.getItem(
      IMAGE_ANALYSIS_KEY
    ),
    {}
  );
}

function getVoiceContext() {
  return {
    transcript:
      sessionStorage.getItem(
        'ss_voice_transcript'
      ) || '',

    translationEnglish:
      sessionStorage.getItem(
        'ss_voice_translation'
      ) || '',

    translationHindi:
      sessionStorage.getItem(
        'ss_voice_translation_hi'
      ) || '',

    language:
      sessionStorage.getItem(
        'ss_voice_language'
      ) || '',
  };
}

function normaliseProductData(
  productData = {}
) {
  const voice =
    getVoiceContext();

  const imageAnalysis =
    productData.imageAnalysis ||
    getImageAnalysis();

  return {
    productName:
      productData.productName ||
      productData.title ||
      '',

    description:
      productData.description ||
      '',

    craft:
      productData.craft ||
      productData.craftType ||
      '',

    category:
      productData.category ||
      '',

    materials:
      Array.isArray(
        productData.materials
      )
        ? productData.materials
        : productData.materials
          ? [productData.materials]
          : [],

    dimensions:
      productData.dimensions ||
      '',

    weight:
      productData.weight ||
      '',

    colors:
      Array.isArray(
        productData.colors
      )
        ? productData.colors
        : productData.colors
          ? [productData.colors]
          : [],

    technique:
      productData.technique ||
      '',

    artisanStory:
      productData.artisanStory ||
      productData.story ||
      voice.translationEnglish ||
      voice.transcript ||
      '',

    transcript:
      productData.transcript ||
      voice.transcript ||
      '',

    translationEnglish:
      productData.translationEnglish ||
      voice.translationEnglish ||
      '',

    translationHindi:
      productData.translationHindi ||
      voice.translationHindi ||
      '',

    language:
      productData.language ||
      voice.language ||
      '',

    imageAnalysis,
  };
}

export const pricingSuggestionService = {
  /**
   * AI-assisted product pricing.
   *
   * Contract preserved:
   * suggestPrice(productData)
   */
  async suggestPrice(productData = {}) {
    const product =
      normaliseProductData(
        productData
      );

    if (
      !product.productName &&
      !product.description &&
      !product.craft &&
      !product.category
    ) {
      throw new Error(
        'Product information is required to generate a smart price.'
      );
    }

    try {
      console.log(
        'Requesting AI-assisted market price estimate...'
      );

      const response =
        await fetch(
          PRICING_API_URL,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify(
              product
            ),
          }
        );

      const responseText =
        await response.text();

      let data;

      try {
        data =
          JSON.parse(responseText);
      } catch {
        console.error(
          'Invalid pricing server response:',
          responseText
        );

        throw new Error(
          'The pricing server returned an invalid response.'
        );
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            `Smart pricing failed (${response.status}).`
        );
      }

      if (!data.pricing) {
        throw new Error(
          'AI pricing response was empty.'
        );
      }

      const pricing =
        data.pricing;

      const suggestedPrice =
        Math.round(
          normaliseNumber(
            pricing.suggestedPrice
          )
        );

      const minimumPrice =
        Math.round(
          normaliseNumber(
            pricing.minimumPrice,
            suggestedPrice
          )
        );

      const maximumPrice =
        Math.round(
          normaliseNumber(
            pricing.maximumPrice,
            suggestedPrice
          )
        );

      /*
       * Convert the AI response into a stable
       * frontend-friendly structure.
       */
      const result = {
        success: true,

        suggestedPrice,

        minimumPrice,

        maximumPrice,

        /*
         * Aliases make this compatible with
         * existing PricingAssistant usage.
         */
        minPrice:
          minimumPrice,

        maxPrice:
          maximumPrice,

        price:
          suggestedPrice,

        currency:
          pricing.currency ||
          'INR',

        confidence:
          normaliseNumber(
            pricing.confidence,
            0.7
          ),

        pricingTier:
          pricing.pricingTier ||
          'fair',

        rationale:
          pricing.rationale ||
          'AI-assisted estimate based on the available product information.',

        factors:
          Array.isArray(
            pricing.factors
          )
            ? pricing.factors
            : [],

        missingInformation:
          Array.isArray(
            pricing.missingInformation
          )
            ? pricing.missingInformation
            : [],

        disclaimer:
          pricing.disclaimer ||
          'AI-assisted market estimate. Final price should be reviewed by the artisan.',

        source:
          data.source ||
          'gemini-ai-estimate',
      };

      /*
       * Save only the useful price value,
       * because PricingAssistant already uses
       * ss_price in the existing wizard.
       */
      sessionStorage.setItem(
        PRICE_STORAGE_KEY,
        String(
          result.suggestedPrice
        )
      );

      /*
       * Also preserve complete AI pricing
       * information for the final catalog.
       */
      sessionStorage.setItem(
        'ss_smart_price',
        JSON.stringify(
          result
        )
      );

      console.log(
        'AI pricing completed:',
        result
      );

      return result;
    } catch (error) {
      console.error(
        'Smart pricing failed:',
        error
      );

      throw new Error(
        error?.message ||
          'Unable to generate smart pricing.'
      );
    }
  },

  /**
   * Compatibility method for the existing
   * PricingAssistant / service contract.
   *
   * Instead of returning fake craft multipliers,
   * return general guidance based on the supplied
   * craft name.
   */
  async getCraftMarketInsights(
    craft = ''
  ) {
    const cleanCraft =
      typeof craft === 'string'
        ? craft.trim()
        : '';

    return {
      craft:
        cleanCraft,

      source:
        'ai-pricing-service',

      message:
        cleanCraft
          ? `Pricing is estimated using the product's complete AI-analyzed information, including craft, category, materials and product details.`
          : 'Pricing is estimated from the available product information.',

      isLiveMarketData:
        false,

      disclaimer:
        'This is an AI-assisted market estimate, not a verified live marketplace price.',
    };
  },
};