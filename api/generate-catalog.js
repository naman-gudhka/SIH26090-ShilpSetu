const GEMINI_MODEL = 'gemini-3.6-flash';

function sendJson(res, status, data) {
  res.status(status).json(data);
}

function cleanString(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function cleanArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => cleanString(item))
    .filter(Boolean);
}

function extractJson(text) {
  if (!text) {
    return null;
  }

  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Try extracting the first JSON object.
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');

    if (
      start !== -1 &&
      end !== -1 &&
      end > start
    ) {
      try {
        return JSON.parse(
          cleaned.slice(
            start,
            end + 1
          )
        );
      } catch {
        return null;
      }
    }

    return null;
  }
}

async function fetchImageAsBase64(imageUrl) {
  if (!imageUrl) {
    throw new Error(
      'No processed product image URL was provided.'
    );
  }

  const response = await fetch(
    imageUrl
  );

  if (!response.ok) {
    throw new Error(
      `Unable to download the processed product image (${response.status}).`
    );
  }

  const contentType =
    response.headers.get(
      'content-type'
    ) || 'image/jpeg';

  const arrayBuffer =
    await response.arrayBuffer();

  const buffer =
    Buffer.from(arrayBuffer);

  if (!buffer.length) {
    throw new Error(
      'The processed product image is empty.'
    );
  }

  /*
   * Protect the Vercel function from
   * unexpectedly large image payloads.
   */
  if (
    buffer.length >
    8 * 1024 * 1024
  ) {
    throw new Error(
      'The processed product image is too large for catalog generation.'
    );
  }

  return {
    mimeType: contentType.split(';')[0],
    base64: buffer.toString('base64'),
  };
}

function normaliseCatalog(
  catalog
) {
  if (
    !catalog ||
    typeof catalog !== 'object'
  ) {
    return null;
  }

  return {
    productName:
      cleanString(
        catalog.productName
      ),

    productNameHindi:
      cleanString(
        catalog.productNameHindi
      ),

    description:
      cleanString(
        catalog.description
      ),

    descriptionHindi:
      cleanString(
        catalog.descriptionHindi
      ),

    craft:
      cleanString(
        catalog.craft
      ),

    category:
      cleanString(
        catalog.category
      ),

    materials:
      cleanArray(
        catalog.materials
      ),

    dimensions:
      cleanString(
        catalog.dimensions
      ),

    weight:
      cleanString(
        catalog.weight
      ),

    colors:
      cleanArray(
        catalog.colors
      ),

    artisanStory:
      cleanString(
        catalog.artisanStory
      ),

    artisanStoryHindi:
      cleanString(
        catalog.artisanStoryHindi
      ),
  };
}

export default async function handler(
  req,
  res
) {
  /*
   * Only POST is supported.
   */
  if (
    req.method !== 'POST'
  ) {
    return sendJson(
      res,
      405,
      {
        success: false,
        error:
          'Method not allowed. Use POST.',
      }
    );
  }

  try {
    const apiKey =
      process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return sendJson(
        res,
        500,
        {
          success: false,
          error:
            'GEMINI_API_KEY is not configured on Vercel.',
        }
      );
    }

    const body =
      req.body || {};

    const transcript =
      cleanString(
        body.transcript
      );

    const translationEnglish =
      cleanString(
        body.translationEnglish
      );

    const translationHindi =
      cleanString(
        body.translationHindi
      );

    const language =
      cleanString(
        body.language
      );

    const imageUrl =
      cleanString(
        body.imageUrl
      );

    /*
     * We need at least the artisan's
     * description or the product image.
     */
    if (
      !transcript &&
      !translationEnglish &&
      !imageUrl
    ) {
      return sendJson(
        res,
        400,
        {
          success: false,
          error:
            'Product image or artisan description is required.',
        }
      );
    }

    console.log(
      'Starting Gemini catalog generation...',
      {
        hasTranscript:
          Boolean(transcript),

        hasEnglishTranslation:
          Boolean(
            translationEnglish
          ),

        hasHindiTranslation:
          Boolean(
            translationHindi
          ),

        hasImage:
          Boolean(imageUrl),

        language,
      }
    );

    /*
     * Download the enhanced Cloudinary
     * image so Gemini receives the actual
     * product photo.
     */
    let imagePart =
      null;

    if (imageUrl) {
      const image =
        await fetchImageAsBase64(
          imageUrl
        );

      imagePart = {
        inline_data: {
          mime_type:
            image.mimeType,
          data:
            image.base64,
        },
      };
    }

    /*
     * Build a strict grounding prompt.
     *
     * IMPORTANT:
     * Gemini must NOT invent dimensions,
     * weight, materials, craft, etc.
     */
    const prompt = `
You are the product catalog assistant for ShilpSetu, an Indian artisan marketplace.

Your task is to understand ONE real artisan product using:
1. The supplied product photograph.
2. The artisan's actual spoken story/transcript.
3. The available translations.

Create a structured product catalog.

GROUNDING RULES:
- Use ONLY information visible in the product photograph or explicitly stated by the artisan.
- Do NOT invent facts.
- Do NOT assume a craft tradition merely from appearance.
- Do NOT assume materials unless they are clearly visible or stated.
- Do NOT invent dimensions or weight.
- If dimensions are not provided, return an empty string.
- If weight is not provided, return an empty string.
- If the exact craft cannot be established, return an empty string.
- If the exact category cannot be established, choose a broad category only when the product type is clearly identifiable from the photograph/story. Otherwise return an empty string.
- Colors may be identified from the photograph when clearly visible.
- The product name should accurately describe the actual item.
- The English description must be concise and factual.
- The Hindi description must faithfully represent the English description.
- Do not mention that you are an AI.
- Do not mention missing information inside the product description.
- Return ONLY valid JSON.

ARTISAN TRANSCRIPT:
${transcript || '(not provided)'}

ENGLISH TRANSLATION:
${translationEnglish || '(not provided)'}

HINDI TRANSLATION:
${translationHindi || '(not provided)'}

DETECTED LANGUAGE:
${language || '(not provided)'}

Return exactly this JSON structure:

{
  "productName": "",
  "productNameHindi": "",
  "description": "",
  "descriptionHindi": "",
  "craft": "",
  "category": "",
  "materials": [],
  "dimensions": "",
  "weight": "",
  "colors": [],
  "artisanStory": "",
  "artisanStoryHindi": ""
}
`;

    const parts = [];

    if (imagePart) {
      parts.push(
        imagePart
      );
    }

    parts.push({
      text: prompt,
    });

    /*
     * Call Gemini directly through the
     * REST generateContent endpoint.
     */
    const geminiResponse =
      await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts,
              },
            ],

            generationConfig: {
              temperature: 0.2,

              responseMimeType:
                'application/json',

              responseSchema: {
                type: 'OBJECT',

                properties: {
                  productName: {
                    type: 'STRING',
                  },

                  productNameHindi: {
                    type: 'STRING',
                  },

                  description: {
                    type: 'STRING',
                  },

                  descriptionHindi: {
                    type: 'STRING',
                  },

                  craft: {
                    type: 'STRING',
                  },

                  category: {
                    type: 'STRING',
                  },

                  materials: {
                    type: 'ARRAY',
                    items: {
                      type: 'STRING',
                    },
                  },

                  dimensions: {
                    type: 'STRING',
                  },

                  weight: {
                    type: 'STRING',
                  },

                  colors: {
                    type: 'ARRAY',
                    items: {
                      type: 'STRING',
                    },
                  },

                  artisanStory: {
                    type: 'STRING',
                  },

                  artisanStoryHindi: {
                    type: 'STRING',
                  },
                },

                required: [
                  'productName',
                  'productNameHindi',
                  'description',
                  'descriptionHindi',
                  'craft',
                  'category',
                  'materials',
                  'dimensions',
                  'weight',
                  'colors',
                  'artisanStory',
                  'artisanStoryHindi',
                ],
              },
            },
          }),
        }
      );

    const responseText =
      await geminiResponse.text();

    let geminiData;

    try {
      geminiData =
        JSON.parse(
          responseText
        );
    } catch {
      console.error(
        'Gemini returned invalid JSON:',
        responseText
      );

      return sendJson(
        res,
        502,
        {
          success: false,
          error:
            'Gemini returned an invalid response.',
        }
      );
    }

    if (
      !geminiResponse.ok
    ) {
      console.error(
        'Gemini catalog API error:',
        geminiData
      );

      const message =
        geminiData?.error
          ?.message ||
        'Gemini catalog generation failed.';

      return sendJson(
        res,
        geminiResponse.status,
        {
          success: false,
          error: message,
        }
      );
    }

    /*
     * Gemini structured output should
     * appear here.
     */
    const generatedText =
      geminiData
        ?.candidates?.[0]
        ?.content?.parts
        ?.map(
          (part) =>
            part.text || ''
        )
        .join('')
        .trim();

    if (!generatedText) {
      console.error(
        'Gemini returned no catalog text:',
        geminiData
      );

      return sendJson(
        res,
        502,
        {
          success: false,
          error:
            'Gemini did not return product catalog data.',
        }
      );
    }

    const parsedCatalog =
      extractJson(
        generatedText
      );

    if (!parsedCatalog) {
      console.error(
        'Unable to parse Gemini catalog:',
        generatedText
      );

      return sendJson(
        res,
        502,
        {
          success: false,
          error:
            'Gemini catalog response could not be parsed.',
        }
      );
    }

    const catalog =
      normaliseCatalog(
        parsedCatalog
      );

    if (
      !catalog ||
      !catalog.productName
    ) {
      console.error(
        'Gemini catalog missing product name:',
        parsedCatalog
      );

      return sendJson(
        res,
        502,
        {
          success: false,
          error:
            'Gemini generated an incomplete product catalog.',
        }
      );
    }

    console.log(
      'Gemini catalog generated successfully:',
      catalog
    );

    return sendJson(
      res,
      200,
      {
        success: true,

        catalog,

        source:
          'gemini-multimodal',

        model:
          GEMINI_MODEL,
      }
    );
  } catch (error) {
    console.error(
      'Catalog generation server error:',
      error
    );

    return sendJson(
      res,
      500,
      {
        success: false,

        error:
          error?.message ||
          'Unable to generate the product catalog.',
      }
    );
  }
}