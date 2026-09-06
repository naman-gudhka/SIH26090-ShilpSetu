import { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Users,
  MessageSquare,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { productService } from '../../services/productService.js';
import { artisanService } from '../../services/artisanService.js';
import { enquiryService } from '../../services/enquiryService.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

function CatalogProgressBar({
  region,
  completion,
  total,
  published,
}) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const color =
    completion >= 80
      ? 'var(--color-success)'
      : completion >= 50
        ? 'var(--color-primary)'
        : 'var(--color-warning)';

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-medium)',
            color: 'var(--color-text)',
          }}
        >
          {region}
        </span>

        <span
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-semibold)',
            color,
          }}
        >
          {completion}%
          <span
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-muted)',
              fontWeight: 400,
            }}
          >
            {' '}
            ({published}/{total})
          </span>
        </span>
      </div>

      <div
        style={{
          height: 10,
          background: 'var(--color-border-light)',
          borderRadius: 999,
          overflow: 'hidden',
        }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={completion}
        aria-label={`${region}: ${completion}%`}
      >
        <div
          style={{
            height: '100%',
            width: animated ? `${completion}%` : '0%',
            background: color,
            borderRadius: 999,
            transition:
              'width 0.9s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>
    </div>
  );
}

function CraftBar({ craft, count, maxCount }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const safeMax = Math.max(maxCount, 1);
  const pct = (count / safeMax) * 100;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
      }}
    >
      <span
        style={{
          width: 'clamp(85px, 25vw, 130px)',
          minWidth: 0,
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text)',
          fontWeight: 'var(--weight-medium)',
          textAlign: 'right',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        title={craft}
      >
        {craft}
      </span>

      <div
        style={{
          flex: 1,
          height: 14,
          background: 'var(--color-border-light)',
          borderRadius: 999,
          overflow: 'hidden',
        }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={count}
        aria-label={`${craft}: ${count}`}
      >
        <div
          style={{
            height: '100%',
            width: animated ? `${pct}%` : '0%',
            background: 'var(--color-secondary)',
            borderRadius: 999,
            transition:
              'width 0.85s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>

      <span
        style={{
          minWidth: 36,
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--weight-semibold)',
          color: 'var(--color-secondary)',
        }}
      >
        {count}
      </span>
    </div>
  );
}

function MetricSummaryCard({
  label,
  value,
  subtitle,
  icon: Icon,
  color,
  bg,
}) {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        padding: '24px 20px',
        textAlign: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 12px',
        }}
        aria-hidden="true"
      >
        <Icon size={22} color={color} />
      </div>

      <p
        style={{
          fontSize: 'var(--text-3xl)',
          fontWeight: 'var(--weight-bold)',
          color: 'var(--color-text)',
          marginBottom: 4,
        }}
      >
        {value}
      </p>

      <p
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-muted)',
          fontWeight: 'var(--weight-medium)',
        }}
      >
        {label}
      </p>

      {subtitle && (
        <p
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-light)',
            marginTop: 4,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function AdminInsights() {
  const { t, isHindi } = useLanguage();
  const [productList, setProductList] = useState([]);
  const [artisanList, setArtisanList] = useState([]);
  const [enquiryList, setEnquiryList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      productService.getProducts(),
      artisanService.getArtisans(),
      enquiryService.getEnquiries(),
    ])
      .then(([products, artisans, enquiries]) => {
        if (isMounted) {
          if (products) setProductList(products);
          if (artisans) setArtisanList(artisans);
          if (enquiries) setEnquiryList(enquiries);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const regionCompletionData = useMemo(() => {
    const states = [
      ...new Set(
        artisanList
          .map((artisan) => artisan.state)
          .filter(Boolean)
      ),
    ];

    if (states.length === 0) return [];

    return states
      .map((region) => {
        const stateArtisanIds = new Set(
          artisanList
            .filter((artisan) => artisan.state === region)
            .map((artisan) => artisan.id)
        );

        const stateProducts = productList.filter(
          (product) =>
            stateArtisanIds.has(product.artisanId) ||
            product.region === region
        );

        const total = stateProducts.length;

        const published = stateProducts.filter(
          (product) => product.status === 'published'
        ).length;

        const completion =
          total > 0
            ? Math.round((published / total) * 100)
            : 0;

        return {
          region,
          total,
          published,
          completion,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [artisanList, productList]);

  const craftPopularityData = useMemo(() => {
    const craftMap = {};

    productList.forEach((product) => {
      const craft =
        product.craft || 'General Handicraft';

      craftMap[craft] = (craftMap[craft] || 0) + 1;
    });

    return Object.entries(craftMap)
      .map(([craft, count]) => ({
        craft,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [productList]);

  const maxCraftCount =
    craftPopularityData.length > 0
      ? Math.max(
          ...craftPopularityData.map(
            (item) => item.count
          )
        )
      : 1;

  const publishedCount = productList.filter(
    (product) => product.status === 'published'
  ).length;

  const publishedRatio =
    productList.length > 0
      ? Math.round(
          (publishedCount / productList.length) * 100
        )
      : 0;

  const verifiedArtisans = artisanList.filter(
    (artisan) => artisan.verified
  ).length;

  const verifiedRatio =
    artisanList.length > 0
      ? Math.round(
          (verifiedArtisans / artisanList.length) * 100
        )
      : 0;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        padding: '24px 16px 48px',
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
        }}
      >
        <header style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--weight-bold)',
              color: 'var(--color-text)',
              marginBottom: 4,
            }}
          >
            {t('admin.insightsTitle')}
          </h1>

          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-muted)',
            }}
          >
            {isHindi ? 'लाइव कैटलॉग पूर्णता, शिल्प वितरण और मंच टेलीमेट्री।' : 'Live catalog completion, craft distribution, and platform telemetry.'}
          </p>
        </header>

        {loading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 48,
              gap: 12,
              color: 'var(--color-text-muted)',
            }}
          >
            <Loader2
              size={24}
              style={{
                animation: 'spin 1s linear infinite',
              }}
            />

            <span>
              {isHindi ? 'लाइव प्लेटफ़ॉर्म टेलीमेट्री की गणना की जा रही है…' : 'Calculating live platform telemetry…'}
            </span>
          </div>
        ) : (
          <>
            <section
              aria-label="Platform Health KPIs"
              style={{ marginBottom: 28 }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 16,
                }}
              >
                <h2
                  style={{
                    fontSize: 'var(--text-lg)',
                    fontWeight: 'var(--weight-semibold)',
                    color: 'var(--color-text)',
                    margin: 0,
                  }}
                >
                  {isHindi ? 'मंच परिचालन स्वास्थ्य' : 'Platform Operational Health'}
                </h2>

                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {isHindi ? 'वास्तविक समय स्थानीय डेटासेट' : 'Real-time local dataset'}
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit,minmax(200px,1fr))',
                  gap: 16,
                }}
              >
                <MetricSummaryCard
                  label={isHindi ? 'मार्केटप्लेस प्रकाशन दर' : 'Marketplace Publish Rate'}
                  value={`${publishedRatio}%`}
                  subtitle={isHindi ? `${productList.length} में से ${publishedCount} लाइव` : `${publishedCount} of ${productList.length} live`}
                  icon={CheckCircle}
                  color="var(--color-success)"
                  bg="var(--color-success-bg)"
                />

                <MetricSummaryCard
                  label={isHindi ? 'सत्यापित कारीगर कवरेज' : 'Verified Artisan Coverage'}
                  value={`${verifiedRatio}%`}
                  subtitle={isHindi ? `${artisanList.length} में से ${verifiedArtisans} सत्यापित` : `${verifiedArtisans} of ${artisanList.length} verified`}
                  icon={Users}
                  color="var(--color-primary)"
                  bg="var(--color-primary-light)"
                />

                <MetricSummaryCard
                  label={isHindi ? 'सक्रिय खरीदार पूछताछ' : 'Active Buyer Inquiries'}
                  value={enquiryList.length.toString()}
                  subtitle={isHindi ? 'कारीगरों को भेजे गए लीड्स' : 'Leads sent to artisans'}
                  icon={MessageSquare}
                  color="var(--color-secondary)"
                  bg="var(--color-secondary-light)"
                />

                <MetricSummaryCard
                  label={isHindi ? 'विशिष्ट शिल्प सूचीबद्ध' : 'Distinct Crafts Listed'}
                  value={craftPopularityData.length.toString()}
                  subtitle={isHindi ? 'स्वदेशी शिल्प रूप' : 'Indigenous craft forms'}
                  icon={Package}
                  color="var(--color-primary)"
                  bg="var(--color-primary-light)"
                />
              </div>
            </section>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit,minmax(300px,1fr))',
                gap: 20,
                marginBottom: 28,
              }}
            >
              <section
                style={{
                  background: 'var(--color-surface)',
                  border:
                    '1px solid var(--color-border)',
                  borderRadius: 12,
                  padding: 24,
                  boxShadow:
                    '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                <h2
                  style={{
                    fontSize: 'var(--text-lg)',
                    fontWeight:
                      'var(--weight-semibold)',
                    color: 'var(--color-text)',
                    marginBottom: 4,
                  }}
                >
                  {t('admin.catalogCompletion')}
                </h2>

                <p
                  style={{
                    fontSize: 'var(--text-xs)',
                    color:
                      'var(--color-text-muted)',
                    marginBottom: 20,
                  }}
                >
                  {isHindi ? 'प्रति राज्य क्लस्टर प्रकाशित कैटलॉग शिल्पों का अनुपात' : 'Ratio of catalogued crafts published per state cluster'}
                </p>

                {regionCompletionData.length === 0 ? (
                  <p
                    style={{
                      fontSize: 'var(--text-sm)',
                      color:
                        'var(--color-text-muted)',
                      textAlign: 'center',
                      padding: '24px 0',
                    }}
                  >
                    {isHindi ? 'कोई क्षेत्रीय उत्पाद डेटा दर्ज नहीं है' : 'No regional product data recorded'}
                  </p>
                ) : (
                  regionCompletionData.map((item) => (
                    <CatalogProgressBar
                      key={item.region}
                      region={item.region}
                      completion={item.completion}
                      total={item.total}
                      published={item.published}
                    />
                  ))
                )}
              </section>

              <section
                style={{
                  background: 'var(--color-surface)',
                  border:
                    '1px solid var(--color-border)',
                  borderRadius: 12,
                  padding: 24,
                  boxShadow:
                    '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                <h2
                  style={{
                    fontSize: 'var(--text-lg)',
                    fontWeight:
                      'var(--weight-semibold)',
                    color: 'var(--color-text)',
                    marginBottom: 4,
                  }}
                >
                  {t('admin.craftDistribution')}
                </h2>

                <p
                  style={{
                    fontSize: 'var(--text-xs)',
                    color:
                      'var(--color-text-muted)',
                    marginBottom: 20,
                  }}
                >
                  {isHindi ? 'प्रति शिल्प विधा में कैटलॉग किए गए उत्पादों की संख्या' : 'Number of catalogued products per craft discipline'}
                </p>

                {craftPopularityData.length === 0 ? (
                  <p
                    style={{
                      fontSize: 'var(--text-sm)',
                      color:
                        'var(--color-text-muted)',
                      textAlign: 'center',
                      padding: '24px 0',
                    }}
                  >
                    {isHindi ? 'कोई शिल्प उत्पाद कैटलॉग नहीं किया गया' : 'No craft products catalogued'}
                  </p>
                ) : (
                  craftPopularityData
                    .slice(0, 8)
                    .map((item) => (
                      <CraftBar
                        key={item.craft}
                        craft={item.craft}
                        count={item.count}
                        maxCount={maxCraftCount}
                      />
                    ))
                )}
              </section>
            </div>

            <div
              style={{
                padding: '16px 20px',
                background: 'var(--color-surface)',
                border:
                  '1px solid var(--color-border)',
                borderRadius: 12,
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-muted)',
                lineHeight: 1.5,
              }}
            >
              <strong
                style={{
                  color: 'var(--color-text)',
                }}
              >
                {isHindi ? 'बैकएंड एकत्रीकरण सूचना (टीम 2 और 3 हैंडऑफ़):' : 'Backend Aggregation Notice (Team 2 & 3 Handoff):'}
              </strong>{' '}
              {isHindi
                ? 'ऊपर दिखाए गए सभी मेट्रिक्स क्लाइंट सेवाओं (productService, artisanService, और enquiryService) से गतिशील रूप से गणना किए जाते हैं। उत्पादन में, समय-श्रृंखला और महीने-दर-महीने विकास मॉडल फ़ायरस्टोर में शेड्यूल्ड क्लाउड फ़ंक्शंस द्वारा प्रदान किए जाएंगे।'
                : 'All metrics shown above are computed dynamically from client services (productService, artisanService, and enquiryService). In production, longitudinal timeseries, conversion funnels, and month-over-month growth models will be served by scheduled Cloud Functions writing aggregated rollups into Firestore.'}
            </div>
          </>
        )}
      </div>
    </div>
  );
}