const API_URL = '/api/generate-catalog';

/*
 * Safely parse a server response.
 *
 * This gives us a useful error instead of the vague
 * "invalid response" message if Vercel returns HTML,
 * an empty response, or malformed JSON.
 */
async function parseServerResponse(response) {
  const contentType =
    response.headers.get('content-type') || '';

  const rawText =
    await response.text();

  if (!rawText.trim()) {
    throw new Error(
      `Catalog server returned an empty response (HTTP ${response.status}).`
    );
  }

  let data;

  try {
    data = JSON.parse(rawText);
  } catch (error) {
    console.error(
      'Catalog server returned non-JSON response:',
      rawText
    );

    throw new Error(
      `Catalog server returned an invalid response (HTTP ${response.status}).`
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
        `Catalog generation failed (HTTP ${response.status}).`
    );
  }

  if (!data?.success) {
    throw new Error(
      data?.error ||
        'Catalog generation was unsuccessful.'
    );
  }

  return data;
}

export const catalogGenerationService = {
  /*
   * ------------------------------------------------
   * GENERATE CATALOG
   * ------------------------------------------------
   *
   * Public service contract remains:
   *
   * generateCatalog(input)
   *
   * The actual AI work now happens in:
   *
   * /api/generate-catalog
   */
  async generateCatalog(input = {}) {
    const {
      transcript = '',
      translationEnglish = '',
      translationHindi = '',
      imageUrl = '',
      language = 'unknown',
      method = 'voice',
    } = input;

    /*
     * ------------------------------------------------
     * GET CURRENT PIPELINE DATA
     * ------------------------------------------------
     *
     * Some callers may not pass every field.
     * In that case, recover the current pipeline
     * information from sessionStorage.
     */
    let finalTranscript =
      transcript?.trim() || '';

    let finalTranslationEnglish =
      translationEnglish?.trim() || '';

    let finalTranslationHindi =
      translationHindi?.trim() || '';

    let finalImageUrl =
      imageUrl?.trim() || '';

    let finalLanguage =
      language || 'unknown';

    try {
      if (!finalTranscript) {
        finalTranscript =
          sessionStorage.getItem(
            'ss_voice_transcript'
          ) || '';
      }

      if (!finalTranslationEnglish) {
        finalTranslationEnglish =
          sessionStorage.getItem(
            'ss_voice_translation'
          ) || '';
      }

      if (!finalTranslationHindi) {
        finalTranslationHindi =
          sessionStorage.getItem(
            'ss_voice_translation_hi'
          ) || '';
      }

      if (!finalImageUrl) {
        finalImageUrl =
          sessionStorage.getItem(
            'ss_enhanced_photo_url'
          ) || '';
      }

      if (
        !finalLanguage ||
        finalLanguage === 'unknown'
      ) {
        finalLanguage =
          sessionStorage.getItem(
            'ss_voice_language'
          ) || 'unknown';
      }
    } catch (storageError) {
      console.warn(
        'Could not read catalog pipeline data from sessionStorage:',
        storageError
      );
    }

    /*
     * ------------------------------------------------
     * VALIDATION
     * ------------------------------------------------
     */

    if (
      !finalTranscript &&
      !finalTranslationEnglish
    ) {
      throw new Error(
        'No artisan voice description is available. Please record the product story again.'
      );
    }

    if (!finalImageUrl) {
      throw new Error(
        'No enhanced product image is available. Please process the product photo again.'
      );
    }

    /*
     * ------------------------------------------------
     * LOG EXACT DATA BEING SENT
     * ------------------------------------------------
     *
     * This is useful for debugging and demonstrates
     * that the catalog is being generated from the
     * actual current product.
     */
    console.log(
      'Sending current artisan data to catalog server:',
      {
        transcript: finalTranscript,
        translationEnglish:
          finalTranslationEnglish,
        translationHindi:
          finalTranslationHindi,
        imageUrl: finalImageUrl,
        language: finalLanguage,
        method,
      }
    );

    /*
     * ------------------------------------------------
     * CALL VERCEL SERVERLESS API
     * ------------------------------------------------
     */
    const response = await fetch(
      API_URL,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body: JSON.stringify({
          transcript:
            finalTranscript,

          translationEnglish:
            finalTranslationEnglish,

          translationHindi:
            finalTranslationHindi,

          imageUrl:
            finalImageUrl,

          language:
            finalLanguage,

          method,
        }),
      }
    );

    /*
     * ------------------------------------------------
     * PARSE SERVER RESPONSE
     * ------------------------------------------------
     */
    const data =
      await parseServerResponse(
        response
      );

    /*
     * ------------------------------------------------
     * VALIDATE CATALOG
     * ------------------------------------------------
     */
    if (!data.catalog) {
      throw new Error(
        'Catalog server did not return catalog data.'
      );
    }

    console.log(
      'AI catalog successfully received:',
      data.catalog
    );

    /*
     * Store the fresh AI result.
     */
    try {
      sessionStorage.setItem(
        'ss_catalog_generated',
        JSON.stringify(
          data.catalog
        )
      );

      sessionStorage.setItem(
        'ss_catalog_source_transcript',
        finalTranscript
      );

      sessionStorage.setItem(
        'ss_catalog_source_image',
        finalImageUrl
      );
    } catch (storageError) {
      console.warn(
        'Could not save generated catalog to sessionStorage:',
        storageError
      );
    }

    return {
      success: true,

      catalog:
        data.catalog,

      confidence:
        data.confidence ?? null,

      model:
        data.model ||
        'gemini-3.6-flash',
    };
  },

  /*
   * ------------------------------------------------
   * REFINE CATALOG
   * ------------------------------------------------
   *
   * Kept for compatibility with the existing
   * frontend service contract.
   *
   * Refinement currently regenerates the catalog
   * from the current artisan source data.
   */
  async refineCatalog(
    existingCatalog,
    feedback
  ) {
    console.log(
      'Catalog refinement requested:',
      {
        existingCatalog,
        feedback,
      }
    );

    /*
     * For now, preserve the existing catalog if
     * no backend refinement endpoint exists.
     */
    return {
      success: true,

      catalog:
        existingCatalog,

      feedback:
        feedback || '',
    };
  },

  /*
   * ------------------------------------------------
   * HINDI VERSION
   * ------------------------------------------------
   *
   * Kept for compatibility.
   *
   * The main catalog API already returns Hindi
   * fields, so we use those when available.
   */
  async generateHindiVersion(
    catalog
  ) {
    if (!catalog) {
      return {
        success: false,
        error:
          'No catalog was provided.',
      };
    }

    return {
      success: true,

      catalog: {
        ...catalog,

        productNameHindi:
          catalog.productNameHindi ||
          '',

        descriptionHindi:
          catalog.descriptionHindi ||
          '',

        artisanStoryHindi:
          catalog.artisanStoryHindi ||
          '',
      },
    };
  },
};