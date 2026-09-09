const CLOUDINARY_CLOUD_NAME = 'dwiw1zor';
const CLOUDINARY_UPLOAD_PRESET = 'shilpsetu_products';

const CLOUDINARY_UPLOAD_URL =
  `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

const CLOUDINARY_BASE_URL =
  `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;

const ENHANCED_IMAGE_KEY = 'ss_enhanced_photo_url';
const IMAGE_ANALYSIS_KEY = 'ss_image_analysis';

async function waitForImage(
  url,
  maxAttempts = 15,
  delayMs = 1500
) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        cache: 'no-store',
      });

      if (response.ok) {
        return url;
      }
    } catch (error) {
      console.warn(
        `Waiting for Cloudinary image, attempt ${attempt}...`,
        error
      );
    }

    await new Promise((resolve) => {
      setTimeout(resolve, delayMs);
    });
  }

  throw new Error(
    'Cloudinary is still preparing the AI-processed image. Please try again.'
  );
}

async function fileToBase64(file) {
  if (!file) {
    throw new Error('No image file was supplied.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== 'string') {
        reject(
          new Error(
            'Unable to read the selected image.'
          )
        );
        return;
      }

      const commaIndex = result.indexOf(',');

      if (commaIndex === -1) {
        reject(
          new Error(
            'Invalid image data.'
          )
        );
        return;
      }

      resolve({
        base64: result.slice(commaIndex + 1),
        mimeType:
          file.type || 'image/jpeg',
      });
    };

    reader.onerror = () => {
      reject(
        new Error(
          'Unable to read the selected image.'
        )
      );
    };

    reader.readAsDataURL(file);
  });
}

function getStoredVoiceContext() {
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

export const imageEnhancementService = {
  /**
   * Analyze the actual product image using Gemini Vision.
   *
   * Contract preserved:
   * analyzeImage(file)
   */
  async analyzeImage(imageFile) {
    try {
      const voiceContext =
        getStoredVoiceContext();

      const enhancedImageUrl =
        sessionStorage.getItem(
          ENHANCED_IMAGE_KEY
        ) || '';

      const body = {
        imageUrl:
          enhancedImageUrl || undefined,

        artisanStory:
          voiceContext.translationEnglish ||
          voiceContext.transcript ||
          '',

        transcript:
          voiceContext.transcript ||
          '',
      };

      /*
       * If enhancement has not happened yet,
       * send the actual image file as base64.
       */
      if (!enhancedImageUrl) {
        if (!imageFile) {
          throw new Error(
            'No product image is available for AI analysis.'
          );
        }

        const imageData =
          await fileToBase64(imageFile);

        body.imageBase64 =
          imageData.base64;

        body.mimeType =
          imageData.mimeType;
      }

      console.log(
        'Sending actual product image to Gemini Vision...'
      );

      const response = await fetch(
        '/api/analyze-product-image',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify(body),
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
          'Invalid image analysis server response:',
          responseText
        );

        throw new Error(
          'The image analysis server returned an invalid response.'
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            `Image analysis failed (${response.status}).`
        );
      }

      if (!data.analysis) {
        throw new Error(
          'AI image analysis was empty.'
        );
      }

      /*
       * Save analysis so AIProcessing,
       * catalog generation and pricing can reuse it.
       */
      sessionStorage.setItem(
        IMAGE_ANALYSIS_KEY,
        JSON.stringify(
          data.analysis
        )
      );

      console.log(
        'Gemini product image analysis completed:',
        data.analysis
      );

      return {
        success: true,

        ...data.analysis,

        analysis:
          data.analysis,

        source:
          data.source ||
          'gemini-vision',

        imageUrl:
          enhancedImageUrl ||
          data.imageUrl ||
          null,
      };
    } catch (error) {
      console.error(
        'Product image analysis failed:',
        error
      );

      throw new Error(
        error?.message ||
          'Unable to analyze product image.'
      );
    }
  },

  /**
   * Basic local image-quality check.
   *
   * This does NOT invent AI metadata.
   * It only checks the actual File.
   *
   * Contract preserved:
   * checkImageQuality(file)
   */
  async checkImageQuality(file) {
    if (!file) {
      return {
        acceptable: false,
        score: 0,
        feedback:
          'No product image was selected.',
      };
    }

    const maxSize =
      15 * 1024 * 1024;

    if (file.size > maxSize) {
      return {
        acceptable: false,
        score: 20,
        feedback:
          'Image is too large. Please select an image below 15 MB.',
      };
    }

    if (
      !file.type ||
      !file.type.startsWith('image/')
    ) {
      return {
        acceptable: false,
        score: 10,
        feedback:
          'The selected file is not a supported image.',
      };
    }

    /*
     * Try to inspect actual image dimensions.
     */
    try {
      const dimensions =
        await new Promise(
          (resolve, reject) => {
            const image =
              new Image();

            const objectUrl =
              URL.createObjectURL(file);

            image.onload = () => {
              URL.revokeObjectURL(
                objectUrl
              );

              resolve({
                width:
                  image.naturalWidth,
                height:
                  image.naturalHeight,
              });
            };

            image.onerror = () => {
              URL.revokeObjectURL(
                objectUrl
              );

              reject(
                new Error(
                  'Unable to inspect image.'
                )
              );
            };

            image.src =
              objectUrl;
          }
        );

      const width =
        dimensions.width;

      const height =
        dimensions.height;

      if (
        width < 500 ||
        height < 500
      ) {
        return {
          acceptable: false,
          score: 45,
          feedback:
            'Image resolution is low. Please use a clearer product photograph.',
          width,
          height,
        };
      }

      return {
        acceptable: true,
        score: 90,
        feedback:
          'Image quality is suitable for AI processing.',
        width,
        height,
      };
    } catch {
      /*
       * File itself is valid, but dimensions
       * could not be inspected.
       */
      return {
        acceptable: true,
        score: 75,
        feedback:
          'Image is valid and can be processed.',
      };
    }
  },

  /**
   * Upload image to Cloudinary and create:
   *
   * original
   * background removed
   * professional image
   * catalog image
   *
   * Contract preserved:
   * enhanceImage(file)
   */
  async enhanceImage(imageFile) {
    if (!imageFile) {
      throw new Error(
        'Please select an image first.'
      );
    }

    /*
     * Clear old product-processing state.
     * This prevents a previous product from
     * contaminating the new listing.
     */
    sessionStorage.removeItem(
      ENHANCED_IMAGE_KEY
    );

    sessionStorage.removeItem(
      IMAGE_ANALYSIS_KEY
    );

    const formData =
      new FormData();

    formData.append(
      'file',
      imageFile
    );

    formData.append(
      'upload_preset',
      CLOUDINARY_UPLOAD_PRESET
    );

    try {
      console.log(
        'Uploading original product image to Cloudinary...'
      );

      const response =
        await fetch(
          CLOUDINARY_UPLOAD_URL,
          {
            method: 'POST',
            body: formData,
          }
        );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          'Cloudinary upload error:',
          errorText
        );

        throw new Error(
          'Cloudinary image upload failed.'
        );
      }

      const data =
        await response.json();

      if (
        !data.secure_url ||
        !data.public_id
      ) {
        throw new Error(
          'Cloudinary did not return the required image information.'
        );
      }

      const publicId =
        data.public_id;

      /*
       * Cloudinary background removal.
       */
      const backgroundRemovedUrl =
        `${CLOUDINARY_BASE_URL}/e_background_removal/f_png/${publicId}.png`;

      console.log(
        'Starting AI background removal...'
      );

      await waitForImage(
        backgroundRemovedUrl
      );

      console.log(
        'AI background removal completed.'
      );

      /*
       * Professional image:
       * - remove background
       * - auto enhancement
       * - pad/crop
       * - neutral professional background
       */
      const professionalUrl =
        `${CLOUDINARY_BASE_URL}/` +
        [
          'e_background_removal',
          'e_auto_enhance',
          'c_pad',
          'w_1200',
          'h_1200',
          'g_center',
          'b_rgb:f7f4ee',
          'q_auto',
          'f_auto',
        ].join('/') +
        `/${publicId}.jpg`;

      /*
       * Catalog image:
       * clean white background.
       */
      const catalogUrl =
        `${CLOUDINARY_BASE_URL}/` +
        [
          'e_background_removal',
          'e_auto_enhance',
          'c_pad',
          'w_1200',
          'h_1200',
          'g_center',
          'b_rgb:ffffff',
          'q_auto:best',
          'f_auto',
        ].join('/') +
        `/${publicId}.jpg`;

      console.log(
        'Professional product image prepared.'
      );

      /*
       * This is the image that downstream AI
       * services should use.
       */
      sessionStorage.setItem(
        ENHANCED_IMAGE_KEY,
        professionalUrl
      );

      sessionStorage.setItem(
        'ss_catalog_image_url',
        catalogUrl
      );

      return {
        success: true,

        originalUrl:
          data.secure_url,

        backgroundRemovedUrl,

        professionalUrl,

        catalogUrl,

        publicId,

        message:
          'Product photo successfully processed with AI background removal and professional enhancement.',
      };
    } catch (error) {
      console.error(
        'Product image processing failed:',
        error
      );

      throw new Error(
        error?.message ||
          'Unable to process product image. Please try again.'
      );
    }
  },
};