export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: 'GEMINI_API_KEY is not configured on the server.',
    });
  }

  try {
    const body = req.body || {};

    const product = body.product || body.productData || {};
    const imageAnalysis = body.imageAnalysis || {};
    const voiceContext = body.voiceContext || {};

    const productName =
      product.productName ||
      product.title ||
      product.name ||
      '';

    const description =
      product.description ||
      '';

    const craft =
      product.craft ||
      'Not specified';

    const category =
      product.category ||
      'Not specified';

    const materials = Array.isArray(product.materials)
      ? product.materials.join(', ')
      : product.materials || '';

    const dimensions =
      product.dimensions ||
      '';

    const weight =
      product.weight ||
      '';

    const colors = Array.isArray(product.colors)
      ? product.colors.join(', ')
      : product.colors || '';

    const artisanStory =
      voiceContext.cleanedStory ||
      voiceContext.translationEnglish ||
      voiceContext.transcript ||
      '';

    const imageDescription =
      imageAnalysis.description ||
      imageAnalysis.object ||
      imageAnalysis.productType ||
      '';

    if (!productName && !description && !imageDescription) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient product information for pricing analysis.',
      });
    }

    /*
     * IMPORTANT:
     * We are NOT using a fixed ₹1500 base price.
     *
     * Gemini is instructed to:
     * 1. Search current Indian market listings.
     * 2. Find genuinely comparable products.
     * 3. Ignore obviously unrelated premium/luxury products.
     * 4. Estimate a current market range.
     * 5. Recommend a fair price for THIS specific product.
     */

    const prompt = `
You are the Dynamic Pricing Assistant for ShilpSetu, an Indian marketplace
designed for artisans and micro-entrepreneurs.

Your job is to recommend a realistic CURRENT MARKET SELLING PRICE for the
specific product below.

THIS MUST BE BASED ON CURRENT WEB MARKET ANALYSIS.

Do NOT use a generic ₹1500 base price.
Do NOT assume that every product is a handicraft.
Do NOT inflate the price simply because the product is being sold by an artisan.

PRODUCT INFORMATION
-------------------
Product name: ${productName || 'Unknown'}

Description:
${description || 'Not available'}

Craft type:
${craft}

Category:
${category}

Materials:
${materials || 'Not specified'}

Dimensions:
${dimensions || 'Not specified'}

Weight:
${weight || 'Not specified'}

Colors:
${colors || 'Not specified'}

Image/product analysis:
${imageDescription || 'Not available'}

Artisan story:
${artisanStory || 'Not available'}

CURRENT MARKET RESEARCH REQUIREMENTS
------------------------------------
Use Google Search to find CURRENT Indian market prices for products that are
genuinely comparable to this product.

Prioritize:
- Indian sellers
- Current product listings
- Similar product type
- Similar size
- Similar material
- Similar quality
- Similar quantity
- Similar intended use

For example, if the product is a small live plant in an ordinary plastic pot,
compare it with small potted plants and nursery products.

DO NOT compare it with:
- luxury products
- large premium planters
- gift hampers
- unrelated handicrafts
- expensive designer products
- bulk commercial orders
- products that are substantially larger or higher quality

PRICE REASONING
---------------
After researching the current market:

1. Identify several comparable products.
2. Extract their listed prices where possible.
3. Ignore obvious outliers.
4. Estimate a realistic current market range.
5. Recommend ONE selling price appropriate for this product.
6. The recommended price should be commercially realistic for an Indian buyer.
7. If the product is a low-cost ordinary item, the recommendation MUST remain low.
8. If the product is genuinely handmade, detailed, labor-intensive, premium,
   or uses expensive materials, the price may be higher.
9. Never increase price merely because the seller is an artisan.

IMPORTANT:
The final recommendation must reflect the CURRENT MARKET, not historical
knowledge or an arbitrary handicraft multiplier.

Return ONLY valid JSON matching the requested schema.
`;

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],

          tools: [
            {
              google_search: {},
            },
          ],

          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',

            responseSchema: {
              type: 'OBJECT',
              properties: {
                suggestedPrice: {
                  type: 'NUMBER',
                  description:
                    'Recommended current selling price in Indian rupees.',
                },

                minPrice: {
                  type: 'NUMBER',
                  description:
                    'Lower end of the current realistic market range in INR.',
                },

                maxPrice: {
                  type: 'NUMBER',
                  description:
                    'Upper end of the current realistic market range in INR.',
                },

                marketMedian: {
                  type: 'NUMBER',
                  description:
                    'Estimated median of comparable current market prices in INR.',
                },

                confidence: {
                  type: 'NUMBER',
                  description:
                    'Confidence from 0 to 1 based on quality and number of comparable market listings.',
                },

                marketPosition: {
                  type: 'STRING',
                  description:
                    'One of: budget, fair, premium.',
                },

                rationale: {
                  type: 'STRING',
                  description:
                    'Short explanation of why the recommended price is appropriate.',
                },

                marketAnalysis: {
                  type: 'STRING',
                  description:
                    'Summary of what current comparable products were found in the Indian market.',
                },

                comparableProducts: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      product: {
                        type: 'STRING',
                      },
                      price: {
                        type: 'NUMBER',
                      },
                      sellerOrPlatform: {
                        type: 'STRING',
                      },
                    },
                    required: [
                      'product',
                      'price',
                      'sellerOrPlatform',
                    ],
                  },
                },

                pricingFactors: {
                  type: 'ARRAY',
                  items: {
                    type: 'STRING',
                  },
                },

                caveat: {
                  type: 'STRING',
                  description:
                    'Short statement that this is an AI-assisted market estimate, not a guaranteed selling price.',
                },
              },

              required: [
                'suggestedPrice',
                'minPrice',
                'maxPrice',
                'marketMedian',
                'confidence',
                'marketPosition',
                'rationale',
                'marketAnalysis',
                'comparableProducts',
                'pricingFactors',
                'caveat',
              ],
            },
          },
        }),
      }
    );

    const rawText =
      response &&
      (await response.text());

    let data;

    try {
      data = JSON.parse(rawText);
    } catch {
      return res.status(response.status || 500).json({
        success: false,
        error: 'Gemini returned a non-JSON response.',
        details: rawText?.slice(0, 1000),
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error:
          data?.error?.message ||
          'Gemini pricing request failed.',
      });
    }

    const candidate =
      data?.candidates?.[0];

    const text =
      candidate?.content?.parts
        ?.map((part) => part.text || '')
        .join('')
        .trim();

    if (!text) {
      return res.status(502).json({
        success: false,
        error: 'Gemini did not return pricing data.',
      });
    }

    let pricing;

    try {
      pricing = JSON.parse(text);
    } catch {
      return res.status(502).json({
        success: false,
        error: 'Gemini returned invalid pricing JSON.',
        details: text.slice(0, 1000),
      });
    }

    /*
     * Extract Google Search grounding sources.
     * These are returned by Gemini separately from the structured JSON.
     */
    const groundingMetadata =
      candidate?.groundingMetadata || {};

    const groundingChunks =
      groundingMetadata.groundingChunks || [];

    const marketSources = groundingChunks
      .map((chunk) => chunk?.web)
      .filter(Boolean)
      .map((source) => ({
        title: source.title || '',
        url: source.uri || '',
      }))
      .filter((source) => source.url);

    const webSearchQueries =
      groundingMetadata.webSearchQueries || [];

    /*
     * Safety validation.
     *
     * Prevent obviously broken values from reaching the UI.
     */
    const suggestedPrice = Math.round(
      Number(pricing.suggestedPrice)
    );

    const minPrice = Math.round(
      Number(pricing.minPrice)
    );

    const maxPrice = Math.round(
      Number(pricing.maxPrice)
    );

    const marketMedian = Math.round(
      Number(pricing.marketMedian)
    );

    if (
      !Number.isFinite(suggestedPrice) ||
      !Number.isFinite(minPrice) ||
      !Number.isFinite(maxPrice) ||
      suggestedPrice <= 0 ||
      minPrice <= 0 ||
      maxPrice <= 0
    ) {
      return res.status(502).json({
        success: false,
        error: 'Gemini returned an invalid price range.',
      });
    }

    const finalMin = Math.min(
      minPrice,
      suggestedPrice,
      maxPrice
    );

    const finalMax = Math.max(
      minPrice,
      suggestedPrice,
      maxPrice
    );

    const finalSuggested = Math.min(
      Math.max(suggestedPrice, finalMin),
      finalMax
    );

    return res.status(200).json({
      success: true,

      suggestedPrice: finalSuggested,
      minPrice: finalMin,
      maxPrice: finalMax,
      marketMedian,

      confidence: Math.max(
        0,
        Math.min(
          1,
          Number(pricing.confidence) || 0
        )
      ),

      marketPosition:
        pricing.marketPosition || 'fair',

      rationale:
        pricing.rationale ||
        'Price estimated from current comparable market listings.',

      marketAnalysis:
        pricing.marketAnalysis ||
        '',

      comparableProducts:
        Array.isArray(pricing.comparableProducts)
          ? pricing.comparableProducts
          : [],

      pricingFactors:
        Array.isArray(pricing.pricingFactors)
          ? pricing.pricingFactors
          : [],

      caveat:
        pricing.caveat ||
        'AI-assisted current market estimate; actual selling price may vary.',

      marketSources,

      webSearchQueries,

      source: 'gemini-google-search-grounded',

      model: 'gemini-3.8-flash',

      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Pricing API error:', error);

    return res.status(500).json({
      success: false,
      error:
        error?.message ||
        'Unexpected pricing service error.',
    });
  }
}