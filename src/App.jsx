import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { NetworkProvider } from './context/NetworkContext.jsx';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { AppShell } from './components/layout/AppShell.jsx';
import { ProtectedRoute, RoleGuard } from './components/auth/ProtectedRoute.jsx';
import './index.css';

// Pages — Auth
import { Welcome } from './pages/Welcome.jsx';
import { Login } from './pages/auth/Login.jsx';
import { SignUp } from './pages/auth/SignUp.jsx';
import { ForgotPassword } from './pages/auth/ForgotPassword.jsx';
import { VerifyEmail } from './pages/auth/VerifyEmail.jsx';
import { ChoosePanel } from './pages/auth/ChoosePanel.jsx';

// Pages — Onboarding
import { SelectRole } from './pages/onboarding/SelectRole.jsx';
import { ArtisanOnboarding } from './pages/onboarding/ArtisanOnboarding.jsx';
import { CustomerOnboarding } from './pages/onboarding/CustomerOnboarding.jsx';

// Pages — Artisan
import { ArtisanHome } from './pages/artisan/ArtisanHome.jsx';
import { MyProducts } from './pages/artisan/MyProducts.jsx';
import { AddProduct } from './pages/artisan/AddProduct.jsx';
import { PhotoStudio } from './pages/artisan/PhotoStudio.jsx';
import { VoiceCapture } from './pages/artisan/VoiceCapture.jsx';
import { AIProcessing } from './pages/artisan/AIProcessing.jsx';
import { SmartCatalog } from './pages/artisan/SmartCatalog.jsx';
import { PricingAssistant } from './pages/artisan/PricingAssistant.jsx';
import { ListingPreview } from './pages/artisan/ListingPreview.jsx';
import { ArtisanStore } from './pages/artisan/ArtisanStore.jsx';
import { ArtisanProfile } from './pages/artisan/ArtisanProfile.jsx';
import { ArtisanProductDetail } from './pages/artisan/ArtisanProductDetail.jsx';

// Pages — Buyer
import { BuyerHome } from './pages/buyer/BuyerHome.jsx';
import { ProductDiscovery } from './pages/buyer/ProductDiscovery.jsx';
import { ProductDetail } from './pages/buyer/ProductDetail.jsx';
import { ArtisanStory } from './pages/buyer/ArtisanStory.jsx';
import { BuyerProfile } from './pages/buyer/BuyerProfile.jsx';

// Pages — B2B
import { B2BMatching } from './pages/b2b/B2BMatching.jsx';

// Pages — Admin
import { AdminDashboard } from './pages/admin/AdminDashboard.jsx';
import { AdminArtisans } from './pages/admin/AdminArtisans.jsx';
import { AdminProducts } from './pages/admin/AdminProducts.jsx';
import { AdminInsights } from './pages/admin/AdminInsights.jsx';

function Unauthorized() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '60dvh', padding: 'var(--space-8)', textAlign: 'center',
    }}>
      <h2 style={{ color: 'var(--color-text)' }}>Access Restricted</h2>
      <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-3)' }}>
        You don't have permission to view this page.
      </p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <NetworkProvider>
        <LanguageProvider>
          <AuthProvider>
            <AppShell>
              <Routes>
                {/* Public */}
                <Route path="/" element={<Welcome />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* Multi-role Workspace / Panel Selection */}
                <Route path="/choose-panel" element={
                  <ProtectedRoute><ChoosePanel /></ProtectedRoute>
                } />

                {/* Onboarding — authenticated, any role */}
                <Route path="/select-role" element={
                  <ProtectedRoute><SelectRole /></ProtectedRoute>
                } />
                <Route path="/onboarding/artisan" element={
                  <ProtectedRoute><ArtisanOnboarding /></ProtectedRoute>
                } />
                <Route path="/onboarding/customer" element={
                  <ProtectedRoute><CustomerOnboarding /></ProtectedRoute>
                } />

                {/* Artisan routes */}
                <Route path="/artisan" element={
                  <RoleGuard allowedRoles={['artisan']}><ArtisanHome /></RoleGuard>
                } />
                <Route path="/artisan/products" element={
                  <RoleGuard allowedRoles={['artisan']}><MyProducts /></RoleGuard>
                } />
                <Route path="/artisan/products/new" element={
                  <RoleGuard allowedRoles={['artisan']}><AddProduct /></RoleGuard>
                } />
                <Route path="/artisan/products/photo" element={
                  <RoleGuard allowedRoles={['artisan']}><PhotoStudio /></RoleGuard>
                } />
                <Route path="/artisan/products/voice" element={
                  <RoleGuard allowedRoles={['artisan']}><VoiceCapture /></RoleGuard>
                } />
                <Route path="/artisan/products/processing" element={
                  <RoleGuard allowedRoles={['artisan']}><AIProcessing /></RoleGuard>
                } />
                <Route path="/artisan/products/catalog" element={
                  <RoleGuard allowedRoles={['artisan']}><SmartCatalog /></RoleGuard>
                } />
                <Route path="/artisan/products/pricing" element={
                  <RoleGuard allowedRoles={['artisan']}><PricingAssistant /></RoleGuard>
                } />
                <Route path="/artisan/products/preview" element={
                  <RoleGuard allowedRoles={['artisan']}><ListingPreview /></RoleGuard>
                } />
                <Route path="/artisan/store" element={
                  <RoleGuard allowedRoles={['artisan']}><ArtisanStore /></RoleGuard>
                } />
                <Route path="/artisan/profile" element={
                  <RoleGuard allowedRoles={['artisan']}><ArtisanProfile /></RoleGuard>
                } />
                <Route path="/artisan/products/:id" element={
                  <RoleGuard allowedRoles={['artisan']}><ArtisanProductDetail /></RoleGuard>
                } />

                {/* Buyer routes */}
                <Route path="/buyer" element={
                  <RoleGuard allowedRoles={['buyer']}><BuyerHome /></RoleGuard>
                } />
                <Route path="/buyer/products" element={
                  <RoleGuard allowedRoles={['buyer']}><ProductDiscovery /></RoleGuard>
                } />
                {/* Public showcase for shared links on User/Buyer Panel */}
                <Route path="/buyer/products/:id" element={<ProductDetail />} />
                <Route path="/buyer/artisans/:id" element={<ArtisanStory />} />
                <Route path="/buyer/profile" element={
                  <RoleGuard allowedRoles={['buyer']}><BuyerProfile /></RoleGuard>
                } />
                <Route path="/b2b" element={
                  <RoleGuard allowedRoles={['buyer']}><B2BMatching /></RoleGuard>
                } />

                {/* Admin routes */}
                <Route path="/admin" element={
                  <RoleGuard allowedRoles={['admin']}><AdminDashboard /></RoleGuard>
                } />
                <Route path="/admin/artisans" element={
                  <RoleGuard allowedRoles={['admin']}><AdminArtisans /></RoleGuard>
                } />
                <Route path="/admin/products" element={
                  <RoleGuard allowedRoles={['admin']}><AdminProducts /></RoleGuard>
                } />
                <Route path="/admin/insights" element={
                  <RoleGuard allowedRoles={['admin']}><AdminInsights /></RoleGuard>
                } />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppShell>
          </AuthProvider>
        </LanguageProvider>
      </NetworkProvider>
    </BrowserRouter>
  );
}
