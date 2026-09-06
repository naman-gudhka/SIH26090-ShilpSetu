import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AIProcessingSteps } from '../../components/shared/AIProcessingSteps.jsx';
import { catalogGenerationService } from '../../services/catalogGenerationService.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Sparkles } from 'lucide-react';

const STEPS_PHOTO_EN = [
  'Analyzing your photos',
  'Identifying craft type and materials',
  'Extracting colors and dimensions',
  'Generating product description',
  'Suggesting Hindi translation',
  'Preparing your catalog entry',
];

const STEPS_PHOTO_HI = [
  'आपकी फ़ोटो का विश्लेषण हो रहा है',
  'शिल्प प्रकार और सामग्री की पहचान',
  'रंग और आकार निकाला जा रहा है',
  'उत्पाद विवरण तैयार किया जा रहा है',
  'हिंदी अनुवाद तैयार किया जा रहा है',
  'कैटलॉग प्रविष्टि तैयार हो रही है',
];

const STEPS_VOICE_EN = [
  'Processing voice recording',
  'Transcribing in Hindi and English',
  'Identifying craft and materials',
  'Generating product description',
  'Preparing your catalog entry',
];

const STEPS_VOICE_HI = [
  'वॉइस रिकॉर्डिंग प्रोसेस की जा रही है',
  'हिंदी और अंग्रेज़ी में प्रतिलेखन',
  'शिल्प और सामग्री की पहचान',
  'उत्पाद विवरण तैयार किया जा रहा है',
  'कैटलॉग प्रविष्टि तैयार हो रही है',
];

export function AIProcessing() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, isHindi } = useLanguage();
  const method = location.state?.method || 'photo';
  const transcript = location.state?.transcript || sessionStorage.getItem('ss_voice_transcript') || '';
  
  const stepLabels = isHindi
    ? (method === 'voice' ? STEPS_VOICE_HI : STEPS_PHOTO_HI)
    : (method === 'voice' ? STEPS_VOICE_EN : STEPS_PHOTO_EN);

  const [stepStatuses, setStepStatuses] = useState(
    stepLabels.map((label, i) => ({ label, status: i===0 ? 'active' : 'pending' }))
  );
  const [done, setDone] = useState(false);

  // Trigger catalog generation through the service boundary
  useEffect(() => {
    let isMounted = true;
    async function triggerService() {
      try {
        const res = await catalogGenerationService.generateCatalog({
          transcript,
          method,
          language: isHindi ? 'hi' : 'en',
        });
        if (isMounted && res.catalog) {
          sessionStorage.setItem('ss_catalog_generated', JSON.stringify(res.catalog));
        }
      } catch {
        // Fallback handled gracefully in SmartCatalog
      }
    }
    triggerService();
    return () => { isMounted = false; };
  }, [method, transcript, isHindi]);

  useEffect(() => {
    let idx = 0;
    const advance = () => {
      if (idx >= stepLabels.length) { setDone(true); return; }
      setStepStatuses(prev => prev.map((s, i) => ({
        ...s,
        status: i < idx ? 'complete' : i === idx ? 'active' : 'pending',
      })));
      idx++;
      setTimeout(advance, 800 + Math.random()*500);
    };
    const tTimer = setTimeout(advance, 300);
    return () => clearTimeout(tTimer);
  }, [stepLabels.length]);

  useEffect(() => {
    if (done) {
      const tNav = setTimeout(() => navigate('/artisan/products/catalog', { replace: true }), 1000);
      return () => clearTimeout(tNav);
    }
  }, [done, navigate]);

  return (
    <div style={{ minHeight:'100vh', background:'var(--color-bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'var(--space-6)' }}>
      <div style={{ maxWidth:440, width:'100%' }}>
        <div style={{ textAlign:'center', marginBottom:'var(--space-8)' }}>
          <div style={{ width:80, height:80, borderRadius:'50%', background:'var(--color-primary-light)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto var(--space-4)' }}>
            <Sparkles size={40} color="var(--color-primary)" />
          </div>
          <h1 style={{ fontSize:'var(--text-2xl)', fontWeight:'var(--weight-bold)', color:'var(--color-text)', marginBottom:'var(--space-2)' }}>
            {t('artisan.aiIsWorking')}
          </h1>
          <p style={{ fontSize:'var(--text-base)', color:'var(--color-text-muted)', lineHeight:1.6 }}>
            {method === 'voice' ? t('artisan.aiVoiceDesc') : t('artisan.aiPhotoDesc')}
          </p>
        </div>

        <div style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:'var(--radius-xl)', padding:'var(--space-6)' }}>
          <AIProcessingSteps steps={stepStatuses} />
        </div>

        {done && (
          <div style={{ textAlign:'center', marginTop:'var(--space-6)' }}>
            <p style={{ fontSize:'var(--text-base)', color:'var(--color-success)', fontWeight:'var(--weight-semibold)' }}>
              {t('artisan.aiReadyReview')}
            </p>
          </div>
        )}

        <p style={{ marginTop:'var(--space-6)', fontSize:'var(--text-xs)', color:'var(--color-text-muted)', textAlign:'center' }}>
          {t('artisan.aiOfflineNotice')}
        </p>
      </div>
    </div>
  );
}
