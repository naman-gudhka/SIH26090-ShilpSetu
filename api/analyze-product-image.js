const MODEL = 'gemini-3.6-flash';

function sendJson(res, status, data) {
  res.status(status).json(data);
}

function extractText(result) {
  return (
    result?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || '')
      .join('')
      .trim() || ''
  );
}

function stripJsonMarkdown(text) {
  if (!text) return '';

  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

async function callGemini(body) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured.'
    );
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  const text = await response.text();

  if (!response.ok) {
    console.error(
      'Gemini image analysis error:',
      response.status,
      text
    );

    let message =
      `Gemini image analysis failed (${response.status}).`;

    try {
      const json = JSON.parse(text);
      message =
        json?.error?.message ||
        message;
    } catch {
      // Keep default.
    }

    throw new Error(message);
  }

  return JSON.parse(text);
}

async function imageUrlToBase64(imageUrl) {
  if (!imageUrl) {
    throw new Error('No image URL was supplied.');
  }

  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(
      `Unable to download product image (${response.status}).`
    );
  }

  const contentType =
    response.headers.get('content-type') ||
    'image/jpeg';

  if (!contentType.startsWith('image/')) {
    throw new Error(
      'The supplied URL is not an image.'
    );
  }

  const arrayBuffer =
    await response.arrayBuffer();

  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length === 0) {
    throw new Error(
      'Downloaded product image is empty.'
    );
  }

  /*
   * Keep multimodal request reasonably small.
   */
  if (buffer.length > 10000000) {
    throw new Error(
      'Product image is too large for AI analysis.'
    );
  }

  return {
    base64: buffer.toString('base64'),
    mimeType: contentType.split(';')[0],
  };
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'POST, OPTIONS'
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type'
    );

    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, {
      success: false,
      error: 'Method not allowed. Use POST.',
    });
  }

  try {
    const {
      imageUrl,
      imageBase64,
      mimeType,
      artisanStory = '',
      transcript = '',
    } = req.body || {};

    let imageData;

    if (imageBase64) {
      imageData = {
        base64: imageBase64,
        mimeType:
          mimeType || 'image/jpeg',
      };
    } else if (imageUrl) {
      imageData =
        await imageUrlToBase64(imageUrl);
    } else {
      return sendJson(res, 400, {
        success: false,
        error:
          'Either imageUrl or imageBase64 is required.',
      });
    }

    const storyContext =
      artisanStory ||
      transcript ||
      'No artisan description was provided.';

    const prompt = `
You are the product-vision AI for ShilpSetu, an Indian artisan marketplace.

Analyze the attached product photograph.

The artisan's own description, if available, is:

"${storyContext}"

Your task is to identify ONLY what can reasonably be established from the photograph and the artisan's words.

IMPORTANT:

1. Do not hallucinate.
2. Do not assume a region.
3. Do not assume a craft tradition.
4. Do not assume materials that cannot be reasonably identified.
5. Do not assume dimensions or weight.
6. Do not assume a brand.
7. Do not assume certification.
8. Do not assume GI registration.
9. Do not invent cultural history.
10. If something cannot be determined, return an empty string or empty array.
11. Separate visual observations from information supplied by the artisan.
12. The artisan's description has priority for details such as materials, handmade process, location and story.
13. The photograph has priority for visible appearance, colors, shape, pattern and object type.
14. Product category should be practical and marketplace-friendly.
15. Craft type should only be stated when reasonably supported.
16. Color names should describe visible dominant colors.
17. Write a professional visual description that does not invent facts.

Return JSON only.
`;

    const result = await callGemini({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: prompt,
            },
            {
              inlineData: {
                mimeType:
                  imageData.mimeType,
                data: imageData.base64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            productType: {
              type: 'STRING',
            },

            productNameSuggestion: {
              type: 'STRING',
            },

            productNameSuggestionHindi: {
              type: 'STRING',
            },

            craftType: {
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

            colors: {
              type: 'ARRAY',
              items: {
                type: 'STRING',
              },
            },

            pattern: {
              type: 'STRING',
            },

            technique: {
              type: 'STRING',
            },

            style: {
              type: 'STRING',
            },

            visualDescription: {
              type: 'STRING',
            },

            condition: {
              type: 'STRING',
            },

            confidence: {
              type: 'NUMBER',
            },

            observations: {
              type: 'ARRAY',
              items: {
                type: 'STRING',
              },
            },

            missingDetails: {
              type: 'ARRAY',
              items: {
                type: 'STRING',
              },
            },
          },

          required: [
            'productType',
            'productNameSuggestion',
            'productNameSuggestionHindi',
            'craftType',
            'category',
            'materials',
            'colors',
            'pattern',
            'technique',
            'style',
            'visualDescription',
            'condition',
            'confidence',
            'observations',
            'missingDetails',
          ],
        },
      },
    });

    const text = extractText(result);

    if (!text) {
      throw new Error(
        'Gemini returned no image analysis.'
      );
    }

    let analysis;

    try {
      analysis = JSON.parse(
        stripJsonMarkdown(text)
      );
    } catch (error) {
      console.error(
        'Invalid image analysis JSON:',
        text
      );

      throw new Error(
        'Gemini returned invalid image analysis data.'
      );
    }

    return sendJson(res, 200, {
      success: true,
      analysis,
      imageUrl: imageUrl || null,
      source: 'gemini-vision',
    });
  } catch (error) {
    console.error(
      'Product image analysis failed:',
      error
    );

    return sendJson(res, 500, {
      success: false,
      error:
        error?.message ||
        'Unable to analyze product image.',
    });
  }
}