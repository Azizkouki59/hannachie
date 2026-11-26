<div align="center">

# Hannachi — Elektrohaushaltsgeräte & Ersatzteile (`hannachi.de`)

**Modern web platform for Kamal Hannachi's household appliance & original spare-parts specialist business in Osnabrück — established 1990.**

[![React 19](https://img.shields.io/badge/React-19-0284C7?logo=react&logoColor=white)](https://react.dev/)
[![Vite 8](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5%2F7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Cloudflare Workers](https://img.shields.io/badge/Deploy-Node_%2F_Cloudflare_Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)

[Website](https://hannachi.de) · [Features](#-key-features) · [Architecture](#-project-structure) · [Getting Started](#-getting-started) · [Deployment](#-deployment)

</div>

---

## Overview

`hannachi.de` is a fast, mobile-first web application built for **Hannachi Elektrohaushaltsgeräte & Ersatzteile** (Owner: **Kamal Hannachi**, Osnabrück, Germany). It combines personal consultation, original spare-parts lookup by rating-plate number (`E-Nr.` / `PNC`), selected brand appliances on request — engineered with strict German legal (`§ 5 DDG`, `§ 14 GewO`, `§ 479 BGB`, `ElektroG`) and GDPR (`DSGVO`) compliance.

---

## ✨ Public website (`src/site/`)

- **Mobile-first, calm German "Fachhandel" design** – large type (17–18 px body), 48–56 px tap targets, sticky call/WhatsApp bar on phones, light theme only.
- **Compliant wording** – positioned as trade (§ 14 GewO): Ersatzteile nach E-Nr., geprüfte Markengeräte mit Verkäufergarantie, Ankauf, Beratung. No advertising of repair, installation or electrical connection work.
- **No tracking, no cookies, no third-party embeds** on public pages → no cookie banner needed. Google Maps / WhatsApp are plain links.
- **Inquiry form without backend** – composes a WhatsApp message or e-mail (`mailto:`) the customer sends themselves, so no inquiry can get lost.
- All copy lives in `src/site/content.ts` (rating, reviews selection, FAQ, offers); business & legal data in `src/data/site.ts`.

## 🧭 Routes

| Route | Description |
| :--- | :--- |
| `/` | Home: hero, offers, 3-step E-Nr. guide, reviews, brands, about, FAQ, contact |
| `/leistungen` | Sortiment overview |
| `/leistungen/:slug` | `waschmaschinen`, `geschirrspueler`, `kuehlschraenke`, `backoefen` |
| `/ueber-uns` | About the owner |
| `/kundenbewertungen` | Google review excerpts |
| `/kontakt` (`/anfrage`) | Contact data + inquiry form |
| `/impressum`, `/datenschutz` | Legal pages |
| `/admin` | Owner console (lazy-loaded, needs the Node server – not available on the Cloudflare Worker) |

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 8 |
| **Styling & Motion** | Tailwind CSS v4 (`@tailwindcss/vite`), Motion (`motion` / `framer-motion`), Lucide Icons |
| **Backend / Edge** | Express (`server.ts`) for Node.js & Cloudflare Workers (`worker.ts` + `wrangler.jsonc`) |
| **Validation & Data** | Zod, Firebase SDK, Google Maps React (`@vis.gl/react-google-maps`) |

---

## 📁 Project Structure

```text
src/
├── App.tsx            # Router, page chrome, JSON-LD
├── site/              # Public website (design system, pages, copy)
│   ├── content.ts     # All customer-facing copy & data
│   ├── ui.tsx         # Buttons, sections, picture, rating badge
│   ├── Chrome.tsx     # Header, mobile menu, mobile action bar, footer
│   └── pages/         # Home, Sortiment, Über uns, Bewertungen, Kontakt, Legal
├── app/admin/         # Owner console (lazy-loaded)
├── data/site.ts       # Business, legal & catalog data (single source of truth)
└── server/            # Edge API (Cloudflare Worker)
public/images/site/    # Optimised WebP images used by the public site
```

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
