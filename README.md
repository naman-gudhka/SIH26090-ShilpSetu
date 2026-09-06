<div align="center">
  <img src="public/icons/icon-192.png" alt="ShilpSetu Logo" width="100" />
  <h1>ShilpSetu</h1>
  <p><em>AI-Powered Market Linkage & Smart Cataloging Platform for India's Artisans</em></p>
</div>

ShilpSetu is an AI-powered digital platform and Progressive Web Application (PWA) designed to empower Indian artisans by simplifying product cataloging, enhancing visual presentation, determining fair market pricing, and connecting handmade crafts directly with retail buyers and institutional bulk purchasers.

---

## Overview

India is home to millions of traditional craftspeople whose generational skills produce extraordinary handmade goods. However, many artisans encounter severe hurdles when attempting to enter digital commerce: complex e-commerce interfaces, language barriers, difficulty creating high-quality product photographs, uncertainty around competitive pricing, and limited access to wider markets.

ShilpSetu bridges this gap by providing an accessible, mobile-first workspace:
- **Artisans** can capture photos or record voice notes to generate market-ready product listings using guided cataloging workflows.
- **Buyers** can discover authentic handcrafted products directly from verified makers across India, read artisan stories, send direct inquiries, or initiate WhatsApp chats via pre-composed message links.
- **Bulk Buyers (B2B)** can submit sourcing requirements and view match recommendations computed from artisan cluster capacities.
- **Administrators** can track platform-wide onboarding, monitor regional craft representation, verify artisan profiles, and review listing metrics.

---

## Key Features

### Artisan Workspace & Cataloging
- **Guided Onboarding**: A 3-step setup wizard collecting maker details, craft specializations, regional origin, and language preferences.
- **Camera & Photo Studio Capture**: Direct device camera capture or photo upload with real-time multi-angle previews.
- **AI-Assisted Image Processing**: Simulated background cleaning, lighting enhancement, and visual centering optimized for craft presentation.
- **Voice-Based Cataloging**: Voice capture interface with audio waveform visualization simulating vernacular speech-to-text cataloging.
- **Smart Catalog Generation**: Automated generation of search-optimized product titles, descriptions, dimensions, care instructions, and material breakdowns.
- **Intelligent Pricing Assistant**: Client-side pricing calculation model recommending minimum, maximum, and fair market price ranges based on craft type, labor time, and material input costs.
- **Preview & Direct Publishing**: Pre-publish review screen allowing artisans to inspect their listing, adjust details, toggle draft/published status, and share public links.
- **Digital Storefront**: Dedicated artisan profile showcasing published collections, bio, experience, regional heritage, and direct contact options.
- **Inquiry Management**: Incoming message inbox allowing artisans to review buyer inquiries and respond directly.

### Buyer Marketplace
- **Curated Craft Discovery**: Exploration by craft category (Textiles, Pottery, Metalwork, Paintings, Woodcraft, Jewellery, etc.) and geographic region.
- **Product Details & Maker Story**: Comprehensive product view featuring craft badges, material specifications, transparent pricing, and direct links to the creator's background.
- **Direct Buyer Inquiries**: In-app modal for buyers to submit questions or bulk inquiries directly to the maker.
- **Public Product & Profile Sharing**: Native Web Share API integration with clipboard fallback for sharing product and maker links.
- **Responsive Navigation**: Adaptive desktop header and mobile bottom bar for navigation across Home, Explore, and Store.

### B2B Bulk Order Matching
- **Procurement Requirement Submission**: Form capturing desired craft category, quantity, budget per unit, delivery timeline, and regional preferences.
- **Capacity Matching**: Client-side matching algorithm scoring enterprise requests against simulated artisan cluster profiles based on production capacity, turnaround feasibility, and craft proficiency.
- **Direct RFQ Dispatch**: One-click dispatch to connect institutional buyers directly with suitable artisan groups.

### Administrative Governance
- **Program Metrics Dashboard**: Overview cards tracking total artisans, cataloged products, published listings, active regions, and pending reviews.
- **Visual Analytics**: Pure CSS comparative charts tracking catalog completion by region and distribution across craft categories.
- **Artisan Management Table**: Searchable, filterable artisan roster with regional filters, verification status badges, and inline verification toggle controls.
- **Product Catalog Management**: Status-based sorting and monitoring of active, pending, and draft items.

### Accessibility & Platform Polish
- **Bilingual Interface**: Seamless bilingual switching between English and Hindi (`हिंदी`).
- **PWA Installation**: Installable application on desktop and mobile devices via Web App Manifest and Service Worker.
- **Offline Awareness**: Reassuring connectivity banner, status indicators, and localized local draft storage when working in intermittent network conditions.
- **Light Warm Design System**: Visual theme built around warm terracotta, forest teal, and natural paper surfaces tailored for clarity.

---

## User Experience

ShilpSetu provides dedicated user interfaces tailored to each participant:

```
                          ┌─────────────────────────────┐
                          │          Welcome            │
                          │   Role Selection / Auth     │
                          └──────────────┬──────────────┘
                                         │
         ┌───────────────────────────────┼───────────────────────────────┐
         ▼                               ▼                               ▼
  ┌──────────────┐                ┌──────────────┐                ┌──────────────┐
  │   Artisan    │                │    Buyer     │                │    Admin     │
  ├──────────────┤                ├──────────────┤                ├──────────────┤
  │ Studio Home  │                │ Marketplace  │                │ Dashboard    │
  │ Photo Studio │                │ Discovery    │                │ Artisans     │
  │ Smart Catalog│                │ Product Page │                │ Products     │
  │ Pricing Tool │                │ Maker Story  │                │ Insights     │
  │ My Products  │                │ Enquiries    │                │ B2B Matching │
  │ Storefront   │                │ Saved Items  │                └──────────────┘
  └──────────────┘                └──────────────┘
```

1. **Artisan**: Focused on ease of creation. Uses large touch targets, step-by-step assistance, camera access, voice recording, and minimal text entry to manage their craft catalog.
2. **Buyer**: An editorial discovery experience highlighting handmade authenticity, regional geography, fair trade provenance, and direct connection with makers.
3. **Administrator**: A data-dense operational portal for program managers and cooperatives to monitor cataloging progress, analyze regional uptake, and verify artisan credentials.

---

## Technology Stack

- **Core Framework**: React 19 (Functional Components, Hooks)
- **Build Tool & Bundler**: Vite 8
- **Routing**: React Router 7 (Declarative routing with role-based layout shells)
- **Icons**: Lucide React
- **Progressive Web App**: `vite-plugin-pwa` with Workbox Service Worker generation
- **Authentication & Storage Boundary**: Modular abstraction layer prepared for Firebase Auth and Cloud Firestore integration, currently utilizing client-side mock authentication and session persistence in browser storage
- **Styling**: Vanilla CSS utilizing design tokens (CSS custom properties) with a light, warm palette (`#0F766E` primary teal, `#C2542E` terracotta accent, `#FAF8F5` surface background)

---

## Frontend Architecture

The codebase is organized into modular directories under `src/`:

```
src/
├── components/          # Reusable UI components
│   ├── auth/            # Protected route guards and role wrappers
│   ├── layout/          # AppShell, TopBar, Sidebar, and BottomNav
│   ├── product/         # ProductCard, ArtisanCard, and display elements
│   ├── pwa/             # Connection indicators, offline banners, install prompts
│   └── shared/          # Buttons, loading spinners, empty states, language switcher
├── context/             # Global React Context providers
│   ├── AuthContext.jsx       # Authentication state, session handling, and role selection
│   ├── LanguageContext.jsx   # Active language provider and translation lookup helper
│   └── NetworkContext.jsx    # Real-time online/offline status monitoring
├── data/                # Mock datasets and static dictionaries
│   ├── mockData.js           # Sample artisans, products, crafts, categories, and 36 states/UTs
│   └── translations.js       # Complete bilingual (EN/HI) UI dictionary
├── hooks/               # Custom React hooks
│   ├── useAuth.js            # Access auth state and role methods
│   ├── useLanguage.js        # Access current language and translation function
│   ├── useNetwork.js         # Access online/offline and sync state
│   └── usePWAInstall.js      # Detect installability and prompt PWA install
├── pages/               # Route-level view components
│   ├── admin/           # Dashboard, artisan directory, catalog audit, insights
│   ├── artisan/         # Studio home, camera capture, catalog generator, pricing tool
│   ├── auth/            # Login, registration, password recovery, email verification
│   ├── b2b/             # Bulk RFQ matching interface
│   ├── buyer/           # Marketplace feed, category search, product view, artisan stories
│   ├── onboarding/      # Role picker, artisan setup wizard, buyer setup
│   └── Welcome.jsx      # Initial landing experience and language selector
└── services/            # Client-side service abstraction boundaries
    ├── artisanService.js             # Artisan profile retrieval and persistence
    ├── authService.js                # Auth methods and RFC-compliant email validation
    ├── catalogGenerationService.js   # AI copy generation simulation
    ├── enquiryService.js             # Buyer-to-artisan message handling
    ├── imageEnhancementService.js    # Canvas-based photo filters and processing
    ├── matchingService.js            # B2B scoring and procurement matchmaking
    ├── offlineSyncService.js         # Local draft queue and simulated sync states
    ├── pricingSuggestionService.js   # Cost-based price computation
    ├── productService.js             # Product CRUD, publishing, and filtering
    └── voiceTranscriptionService.js  # Voice recording and transcription simulation
```

> **Architecture Note**: The current frontend includes local and mock service implementations where applicable, with modular service boundaries designed to support future backend, AI, database, and cloud integrations.

---

## Localization

ShilpSetu provides built-in bilingual support designed for rural artisans and domestic buyers:

- **English (`en`)**: Clean, accessible terminology.
- **Hindi (`hi` / `हिंदी`)**: Vernacular phrasing adapted for Indian craft terms (e.g., *शिल्प बाज़ार*, *कारीगर स्टूडियो*, *सत्यापित कारीगर*).

### Persistence
Language selection is managed by `LanguageContext` and stored in browser `localStorage` under the key `shilpsetu_lang`. The selected language persists across page refreshes and session restarts.

---

## PWA & Offline Experience

ShilpSetu is engineered to function gracefully in areas with intermittent cellular connectivity:

- **Web App Manifest**: Configured for standalone portrait display with themed status bars and platform icons.
- **Service Worker**: Pre-caches static visual assets, icons, and build bundles via Workbox for offline presentation.
- **Network Monitoring**: `NetworkContext` listens to browser `online` and `offline` events in real time.
- **Non-Intrusive Notifications**:
  - A persistent topbar indicator displays current connectivity status.
  - A warm amber banner informs the user when offline without obstructing cached content.
  - An animated banner confirms when connection is restored.
- **Local Draft Management**: Newly added crafts created while offline are tracked in browser `localStorage` via `offlineSyncService.js` with simulated sync states (`SAVED_LOCALLY`, `PENDING_SYNC`, `SYNC_COMPLETE`), providing an integration boundary ready for full database and cloud background synchronization.

---

## Pan-India Regional Coverage

The platform encompasses all **28 States and 8 Union Territories** of India:

- **States (28)**: Andhra Pradesh, Arunachal Pradesh, Assam, Bihar, Chhattisgarh, Goa, Gujarat, Haryana, Himachal Pradesh, Jharkhand, Karnataka, Kerala, Madhya Pradesh, Maharashtra, Manipur, Meghalaya, Mizoram, Nagaland, Odisha, Punjab, Rajasthan, Sikkim, Tamil Nadu, Telangana, Tripura, Uttar Pradesh, Uttarakhand, West Bengal.
- **Union Territories (8)**: Andaman and Nicobar Islands, Chandigarh, Dadra and Nagar Haveli and Daman and Diu, Delhi (NCT), Jammu and Kashmir, Ladakh, Lakshadweep, Puducherry.

All forms (Artisan Onboarding, Customer Setup, Profile Editing, B2B Sourcing) offer alphabetized selection across all 36 regions.

---

## Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm (v9.0.0 or higher)

### Installation

1. Clone the repository to your local machine:
   ```bash
   git clone https://github.com/naman-gudhka/SIH26090-ShilpSetu.git
   cd SIH26090-ShilpSetu
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally

Start the Vite development server:
```bash
npm run dev
```

Open your browser and navigate to the printed local URL (typically `http://localhost:5173/`).

### Building for Production

Compile production-ready bundles to the `dist/` directory:
```bash
npm run build
```

Preview the production build locally:
```bash
npm run preview
```

### Code Quality & Linting

Run ESLint across the codebase:
```bash
npm run lint
```
