<div align="center">

# Hannachi — Elektrohaushaltsgeräte & Ersatzteile (`hannachi.de`)

**Modern web platform for Kamal Hannachi's household appliance & original spare-parts specialist business in Osnabrück — established 1990.**

[![React 19](https://img.shields.io/badge/React-19-0284C7?logo=react&logoColor=white)](https://react.dev/)
[![Vite 8](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5%2F7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL_3D-0F2A4A?logo=threedotjs&logoColor=white)](https://threejs.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Deploy-Node_%2F_Cloudflare_Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)

[Website](https://hannachi.de) · [Features](#-key-features) · [Architecture](#-project-structure) · [Getting Started](#-getting-started) · [Deployment](#-deployment)

</div>

---

## Overview

`hannachi.de` is a fast, mobile-first web application built for **Hannachi Elektrohaushaltsgeräte & Ersatzteile** (Owner: **Kamal Hannachi**, Osnabrück, Germany). It combines personal consultation, original spare-parts lookup by rating-plate number (`E-Nr.` / `PNC`), selected brand appliances on request, and a 100% self-hosted interactive **3D Spare-Parts Explorer** — engineered with strict German legal (`§ 5 DDG`, `§ 14 GewO`, `§ 479 BGB`, `ElektroG`) and GDPR (`DSGVO`) compliance.

---

## ✨ Key Features

- **Interactive 3D Spare-Parts Explorer (`#3d-explorer`)**
  - Procedural Three.js cutaway models for **4 core appliances** (*Waschmaschine*, *Geschirrspüler*, *Backofen & Herd*, *Kühlschrank*), each with **5 clickable spare parts** (`01`–`05`), dashed engineering leader lines, and live explosion slider (`0%–100%`).
  - **100% self-hosted & GDPR-safe**: zero external CDNs, `.glb` downloads, or remote HDRI requests — procedural PBR materials, brushed steel textures, `RoomEnvironment`, and custom dual-theme GLSL studio cyclorama.
  - **Mobile-first ergonomics**: compact mobile canvas height (`330px`), `touch-action: pan-y` custom horizontal orbit controller (never traps vertical page scroll), collision-free mobile part chip strip, lazy WebGL loading, automatic offscreen `rAF` pausing, software-WebGL fence pacing, and full GPU resource disposal.
- **Direct Inquiry & WhatsApp Console**
  - Instant appliance & topic selector on the homepage synced directly with the 3D Explorer and `#anfrage` inquiry form.
  - Live formatted WhatsApp message builder, QR code handoff on desktop, and direct pre-filled part requests (`Teil anfragen` & `Per WhatsApp`).
- **Studio-Grade Motion & Dual Theme**
  - Smooth Light & Dark mode (`#0F2A4A` navy, `#0284C7` cerulean, `#10B981` emerald) with synchronized 3D lighting calibration.
  - Calibrated desktop CSS 3D micro-tilt, cursor radial spotlights, viewport count-up metrics, infinite brand marquee, and full `prefers-reduced-motion` support.
- **Verified Customer Reviews & Local SEO**
  - Displays all **82 Google Maps reviews (4.8 ★)** with topic filters, pauseable desktop ticker, and structured `LocalBusiness` JSON-LD schema.
- **Single-Source German Legal & GDPR Architecture**
  - Centralized business, address, email, tax/W-IdNr., warranty (`§ 479 BGB`), and `ElektroG` config in `src/data/site.ts`.
  - Clean customer-facing marketing pages paired with full statutory compliance on `/impressum` and `/datenschutz`, explicit cookie consent management, and GDPR WhatsApp notices.

---

## 🧭 Application Routes

| Route | Description |
| :--- | :--- |
| `/` | Homepage: Hero inquiry console, Brand Marquee, **3D Spare-Parts Explorer**, 3-Pillar Services, Process flow, Google Reviews, and Direct Inquiry (`#anfrage`) |
| `/leistungen` (`/geraete`) | Complete catalog of supported appliances & original spare-parts categories |
| `/leistungen/:slug` | Dedicated category pages (`waschmaschinen`, `geschirrspueler`, `kuehlschraenke`, `backoefen`) |
| `/marktplatz` (`/angebote`) | Selected brand appliances available on request |
| `/kundenbewertungen` | Full 82-review Google Maps showcase with filters |
| `/ueber-uns` | Owner story (since 1990), guiding principles, and 3D precision showcase |
| `/kontakt` | Contact channels, appointment info, and consent-gated map |
| `/anfrage` | Standalone quick inquiry form |
| `/impressum` | Statutory legal notice (`§ 5 DDG`, `§ 14 GewO / HwO`, `§ 479 BGB`, `ElektroG`) |
| `/datenschutz` | Full GDPR (`DSGVO`) privacy policy & WhatsApp/Maps disclosures |
| `/admin` | Protected administration console |

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 8 |
| **Styling & Motion** | Tailwind CSS v4 (`@tailwindcss/vite`), Motion (`motion` / `framer-motion`), Lucide Icons |
| **3D Graphics** | Three.js (`RoomEnvironment`, procedural PBR geometries, custom GLSL shaders) |
| **Backend / Edge** | Express (`server.ts`) for Node.js & Cloudflare Workers (`worker.ts` + `wrangler.jsonc`) |
| **Validation & Data** | Zod, Firebase SDK, Google Maps React (`@vis.gl/react-google-maps`) |

---

## 📁 Project Structure

```text
.
├── index.html                        # HTML entry point & synced SEO/OpenGraph metadata
├── server.ts                         # Express server (dev Vite middleware + production server)
├── worker.ts                         # Cloudflare Worker entry point (/api/* + SPA assets)
├── wrangler.jsonc                    # Cloudflare Workers deployment configuration
├── src/
│   ├── App.tsx                       # Client router, layout shell, JSON-LD & providers
│   ├── app/                          # Page modules (Home, Leistungen, Über uns, Kontakt, Legal, Admin)
│   ├── components/
│   │   ├── HomepageClient.tsx        # Homepage orchestration (Hero ↔ 3D Explorer ↔ Form)
│   │   ├── SparePartsExplorer3D.tsx  # Flagship 3D Explorer section, controls & GDPR action bar
│   │   ├── explorer3d/               # Modular Three.js engine & 4 procedural cutaway builders
│   │   │   ├── Explorer3DCanvas.tsx  # WebGL viewport, touch-safe orbit, raycast & pins
│   │   │   ├── studioCore.ts         # Materials, brushed steel texture, GLSL cyclorama
│   │   │   ├── buildWasher.ts        # Procedural washing machine assembly
│   │   │   ├── buildDishwasher.ts    # Procedural dishwasher assembly
│   │   │   ├── buildOven.ts          # Procedural oven & induction cooktop assembly
│   │   │   ├── buildFridge.ts        # Procedural fridge-freezer assembly
│   │   │   └── types.ts              # Spare-part catalog & appliance resolution helpers
│   │   ├── RepairForm.tsx            # Streamlined inquiry & WhatsApp message generator
│   │   ├── GoogleReviewsSection.tsx  # Interactive Google Maps reviews showcase
│   │   └── animations.tsx            # Motion primitives, Spatial3DCard, CountUp, Marquee
│   ├── data/
│   │   ├── site.ts                   # Single source of truth for business & legal config
│   │   └── googleReviews82.ts        # Structured customer reviews dataset
│   ├── lib/                          # Consent, SEO sync, haptics, Google Place live helpers
│   └── utils/                        # WhatsApp URL builders & formatting helpers
└── public/                           # Static self-hosted images & brand assets
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 20+** (or **Bun 1.4+**)
- **npm** or **bun**

### Installation

```bash
git clone <repository-url>
cd <repository-folder>
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in the required keys:

```bash
cp .env.example .env
```

| Variable | Required | Description |
| :--- | :---: | :--- |
| `APP_URL` | Optional | Public URL of the deployed application |
| `VITE_GOOGLE_MAPS_API_KEY` | Optional | Google Maps JS API key for the interactive location picker |
| `ADMIN_PASSWORD` | Optional | Server-side password override for the `/admin` console (never exposed to client) |
| `GEMINI_API_KEY` | Optional | Server-side API key if AI endpoints are enabled |

### Development

Starts the Express server with Vite middleware on **http://localhost:3000**:

```bash
npm run dev
```

### Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Start local development server (`tsx server.ts`) on port `3000` |
| `npm run build` | Build production static bundle into `dist/` |
| `npm run start` | Run production Node server (`node server.ts`) |
| `npm run lint` | Run strict TypeScript type-checking (`tsc --noEmit`) |
| `npm run deploy:cf` | Build and deploy directly to Cloudflare Workers (`wrangler deploy`) |
| `npm run clean` | Remove build artifacts (`dist/`, `server.js`) |

---

## 🌐 Deployment

### Node.js / Container

```bash
npm run build
NODE_ENV=production npm run start
```

### Cloudflare Workers (Static Assets + `/api/*` Worker)

```bash
npm run deploy:cf
```

Configured via `wrangler.jsonc` with SPA fallback routing (`not_found_handling: "single-page-application"`) and worker-first execution for `/api/*`.

---

## 📋 Business & Legal Notice

- **Business**: Hannachi Elektrohaushaltsgeräte & Ersatzteile · Owner: Kamal Hannachi
- **Address**: Iburger Straße 5, Im Hof, 49082 Osnabrück, Germany
- **Contact**: `contact@hannachi.de` · `0170 3493494`
- **Trade Classification**: Independent trade business under `§ 14 GewO` (personal consultation, original spare parts by rating plate, and selected brand appliances on request). Full statutory disclosures are maintained centrally in `src/data/site.ts` and rendered on `/impressum` and `/datenschutz`.

---

<div align="center">
  <sub>Built with precision for <strong>hannachi.de</strong> · Osnabrück since 1990</sub>
</div>
