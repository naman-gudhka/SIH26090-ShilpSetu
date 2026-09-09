import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, X, ArrowRight, WifiOff } from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { ProductCreationSteps } from '../../components/shared/ProductCreationSteps.jsx';
import { photoFileStore } from '../../services/photoFileStore.js';

export function PhotoStudio() {
  const navigate = useNavigate();
  const { isOnline } = useNetwork();
  const { t, isHindi } = useLanguage();
  const fileRef = useRef(null);
  const [photos, setPhotos] = useState([]);

  const [preview, setPreview] = useState(() => {
    try {
      return sessionStorage.getItem('ss_photo_preview') || null;
    } catch {
      return null;
    }
  });

  const [fileError, setFileError] = useState('');

  const handleFiles = (files) => {
    setFileError('');

    const validFiles = [];

    for (const f of Array.from(files)) {
      if (!f.type.startsWith('image/')) {
        setFileError('Please select image files only (JPEG, PNG, WebP).');
        continue;
      }

      if (f.size > 10 * 1024 * 1024) {
        setFileError('One or more images exceed 10MB limit.');
        continue;
      }

      validFiles.push(f);
    }

    if (validFiles.length === 0) return;

    // Keep the original File available for the later AI/Cloudinary step.
    const primaryFile = validFiles[0];
    photoFileStore.set(primaryFile);

    // Convert primary image to a durable preview for the current session.
    const reader = new FileReader();

    reader.onload = (event) => {
      if (event.target?.result) {
        try {
          sessionStorage.setItem(
            'ss_photo_preview',
            event.target.result
          );
        } catch {
          // Quota fallback
        }
      }
    };

    reader.readAsDataURL(primaryFile);

    const newPhotos = validFiles
      .slice(0, 5 - photos.length)
      .map((f) => ({
        file: f,
        url: URL.createObjectURL(f),
        id: Math.random().toString(36).slice(2),
      }));

    setPhotos((prev) => [...prev, ...newPhotos]);

    if (newPhotos.length > 0) {
      setPreview(newPhotos[0].url);
    }
  };

  const removePhoto = (id) => {
    setPhotos((prev) => {
      const updated = prev.filter((p) => p.id !== id);

      if (updated.length > 0) {
        setPreview(updated[0].url);

        // Keep the primary remaining image available for Cloudinary.
        photoFileStore.set(updated[0].file);
      } else {
        setPreview(null);

        // No photo remains, so clear the stored file as well.
        photoFileStore.clear();

        try {
          sessionStorage.removeItem('ss_photo_preview');
          sessionStorage.removeItem('ss_photo_count');
        } catch {
          // Safe catch
        }
      }

      return updated;
    });
  };

  const proceed = () => {
    if (photos.length === 0 && !preview) return;

    const count =
      photos.length ||
      (sessionStorage.getItem('ss_photo_count')
        ? Number(sessionStorage.getItem('ss_photo_count'))
        : 1);

    sessionStorage.setItem('ss_photo_count', count);

    const currentPhoto =
      preview || sessionStorage.getItem('ss_photo_preview');

    if (
      currentPhoto &&
      !sessionStorage.getItem('ss_photo_preview')
    ) {
      try {
        sessionStorage.setItem(
          'ss_photo_preview',
          currentPhoto
        );
      } catch {
        // Quota fallback
      }
    }

    navigate('/artisan/products/voice', {
      state: {
        photoPreview: currentPhoto,
        photoCount: count,
      },
    });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        paddingBottom: 100,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          padding: 'var(--space-4) var(--space-5)',
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
            color: 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            padding: 4,
          }}
        >
          <X size={20} />
        </button>

        <h1
          style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--color-text)',
            flex: 1,
          }}
        >
          {t('artisan.photoStudio')}
        </h1>

        <span
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-muted)',
          }}
        >
          {photos.length || (preview ? 1 : 0)}/5
        </span>
      </div>

      {/* Visual Step Indicator */}
      <ProductCreationSteps currentStep={1} />

      {!isOnline && (
        <div
          style={{
            background: '#FEF3C7',
            padding:
              'var(--space-3) var(--space-5)',
            display: 'flex',
            gap: 'var(--space-2)',
            alignItems: 'center',
          }}
        >
          <WifiOff size={16} color="#92400E" />

          <span
            style={{
              fontSize: 'var(--text-sm)',
              color: '#92400E',
              fontWeight: 'var(--weight-medium)',
            }}
          >
            {t('artisan.offlinePhotoNotice')}
          </span>
        </div>
      )}

      <div
        style={{
          maxWidth: 600,
          margin: '0 auto',
          padding: 'var(--space-5)',
        }}
      >
        {/* Preview */}
        <div
          style={{
            aspectRatio: '4/3',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            background: 'var(--color-border-light)',
            border: '2px dashed var(--color-border)',
            marginBottom: 'var(--space-4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {preview ? (
            <>
              <img
                src={preview}
                alt="Product preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />

              {photos.length === 0 && (
                <button
                  onClick={() => {
                    setPreview(null);
                    photoFileStore.clear();

                    try {
                      sessionStorage.removeItem(
                        'ss_photo_preview'
                      );
                      sessionStorage.removeItem(
                        'ss_photo_count'
                      );
                    } catch {
                      // Safe catch
                    }
                  }}
                  aria-label="Remove saved photo"
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.6)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </>
          ) : (
            <div
              style={{
                textAlign: 'center',
                color: 'var(--color-text-muted)',
              }}
            >
              <Camera
                size={48}
                strokeWidth={1.5}
                style={{
                  marginBottom: 'var(--space-3)',
                }}
              />

              <p
                style={{
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--weight-medium)',
                }}
              >
                {t('artisan.noPhotosYet')}
              </p>

              <p
                style={{
                  fontSize: 'var(--text-sm)',
                }}
              >
                {t('artisan.addUpToPhotos')}
              </p>
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {photos.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-2)',
              marginBottom: 'var(--space-4)',
              overflowX: 'auto',
              padding: '2px 0',
            }}
          >
            {photos.map((p) => (
              <div
                key={p.id}
                style={{
                  position: 'relative',
                  flexShrink: 0,
                }}
              >
                <img
                  src={p.url}
                  alt="Thumbnail"
                  onClick={() => setPreview(p.url)}
                  style={{
                    width: 72,
                    height: 72,
                    objectFit: 'cover',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${
                      preview === p.url
                        ? 'var(--color-primary)'
                        : 'var(--color-border)'
                    }`,
                    cursor: 'pointer',
                  }}
                />

                <button
                  onClick={() => removePhoto(p.id)}
                  aria-label="Remove photo"
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'var(--color-error)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {fileError && (
          <div
            role="alert"
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 10,
              padding: '0.75rem 1rem',
              fontSize: '0.875rem',
              color: '#B91C1C',
              marginBottom: 'var(--space-4)',
            }}
          >
            {fileError}
          </div>
        )}

        {/* Upload buttons */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-5)',
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) =>
              handleFiles(e.target.files)
            }
            style={{ display: 'none' }}
          />

          <button
            onClick={() => fileRef.current?.click()}
            disabled={photos.length >= 5}
            style={{
              padding: 'var(--space-4)',
              background: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              cursor:
                photos.length >= 5
                  ? 'not-allowed'
                  : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)',
              color: 'var(--color-text)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-medium)',
              opacity:
                photos.length >= 5 ? 0.5 : 1,
            }}
          >
            <Upload size={18} />
            {t('artisan.uploadPhotos')}
          </button>

          <button
            onClick={() => {
              fileRef.current.setAttribute(
                'capture',
                'camera'
              );
              fileRef.current?.click();
            }}
            disabled={photos.length >= 5}
            style={{
              padding: 'var(--space-4)',
              background: 'var(--color-primary)',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              cursor:
                photos.length >= 5
                  ? 'not-allowed'
                  : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)',
              color: '#fff',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-semibold)',
              opacity:
                photos.length >= 5 ? 0.5 : 1,
            }}
          >
            <Camera size={18} />
            {t('artisan.takePhoto')}
          </button>
        </div>

        <div
          style={{
            background: 'var(--color-surface-teal)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
            marginBottom: 'var(--space-5)',
          }}
        >
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-primary)',
              fontWeight: 'var(--weight-medium)',
              marginBottom: 'var(--space-1)',
            }}
          >
            {t('artisan.photoTipsHeading')}
          </p>

          <ul
            style={{
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              margin: 0,
              padding: 0,
            }}
          >
            {[
              t('artisan.photoTip1'),
              t('artisan.photoTip2'),
              t('artisan.photoTip3'),
              t('artisan.photoTip4'),
            ].map((tip) => (
              <li
                key={tip}
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  gap: 6,
                }}
              >
                <span>·</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={proceed}
          disabled={photos.length === 0 && !preview}
          style={{
            width: '100%',
            padding: 'var(--space-4)',
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--weight-semibold)',
            cursor:
              photos.length === 0 && !preview
                ? 'not-allowed'
                : 'pointer',
            minHeight: 52,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-2)',
            opacity:
              photos.length === 0 && !preview
                ? 0.5
                : 1,
          }}
        >
          {isHindi
            ? 'आगे बढ़ें: शिल्प की कहानी बताएं'
            : 'Next: Tell Us About Your Craft'}

          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}