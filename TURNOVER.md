# AquaBalance — Admin Website Turnover Document

> **Project:** AquaBalance — Admin & Landing Website
> **Type:** Next.js Web Application
> **URL:** Deployed via GitHub Pages / Vercel (developer-managed)
> **Prepared by:** Developer
> **Date:** September 2026

---

## 1. What This Website Does

The AquaBalance website serves two purposes:

| Section | Description |
|---|---|
| **Landing Page** | Public-facing marketing page. Explains what the AquaBalance app does, its features, and has a download/info section. |
| **Admin Dashboard** | A private section (requires login) for administrators to view system data and manage settings. |

The website does **not** replace the mobile app. It is a companion tool for administration and public promotion.

---

## 2. Technology Stack

| Technology | Purpose | Version |
|---|---|---|
| **Next.js** | React-based web framework (App Router) | `16.3.2` |
| **React** | UI library | `19.2.8` |
| **TypeScript** | Type-safe JavaScript | `^5` |
| **Tailwind CSS** | Utility-first styling | `^4` |
| **Framer Motion** | Animations | `^13.1.1` |
| **Lucide React** | Icon library | `^1.33.0` |
| **Firebase** | Admin authentication & data access | `^12.18.0` |

---

## 3. Project Folder Structure

```
admin_website/
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── page.tsx                # Landing page (root "/")
│   │   ├── layout.tsx              # Root HTML layout wrapper
│   │   ├── globals.css             # Global styles
│   │   └── admin/                  # Admin section ("/admin/...")
│   │       ├── layout.tsx          # Admin layout (sidebar, auth guard)
│   │       ├── login/              # Admin login page
│   │       ├── dashboard/          # Admin dashboard page
│   │       └── settings/           # Admin settings page
│   │
│   ├── components/                 # Reusable UI components
│   │   ├── Header.tsx              # Navigation header
│   │   ├── Hero.tsx                # Hero section (landing page top)
│   │   ├── Features.tsx            # Features section
│   │   ├── AppShowcase.tsx         # App screenshots showcase
│   │   ├── HowItWorks.tsx          # How-it-works steps section
│   │   ├── Download.tsx            # Download / CTA section
│   │   ├── About.tsx               # About section
│   │   ├── Accessibility.tsx       # Accessibility info section
│   │   ├── Footer.tsx              # Page footer
│   │   └── SplashScreen.tsx        # Animated website splash/intro
│   │
│   └── lib/                        # Shared utilities/helpers
│
├── public/                         # Static assets (images, icons)
│   └── images/                     # App screenshots and graphics
│
├── package.json                    # Project dependencies
├── next.config.ts                  # Next.js configuration
├── tailwind.config (inline)        # Tailwind CSS config
├── tsconfig.json                   # TypeScript config
└── TURNOVER.md                     # This file
```

---

## 4. Firebase Connection

The admin section connects to the same Firebase project as the mobile app for authentication:

```
Firebase Auth is used for admin login.
```

Firebase config is referenced inside the source code (in `src/lib/` or `src/app/admin/`). If you need to reconfigure, update the Firebase web SDK config object.

---

## 5. How the Website is Deployed

The website is deployed and hosted by the developer on their personal GitHub repository. The client does **not** need a GitHub account or any technical knowledge to access the live website — they simply visit the URL in a browser.

### Deployment Summary

| Detail | Info |
|---|---|
| Hosting provider | GitHub Pages or Vercel (developer-managed) |
| Who controls deployment | Developer |
| What the client needs | Just the website URL |
| How updates are pushed | Developer rebuilds and pushes to GitHub |

### How to Rebuild and Redeploy (Developer)

```bash
# 1. Install dependencies (first time or after changes)
npm install

# 2. Build the production site
npm run build

# 3. Push to GitHub — deployment is automatic via GitHub Actions or Vercel CI
git add .
git commit -m "Update website"
git push
```

---

## 6. How to Run Locally (Development)

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Open in browser: http://localhost:3000
```

---

## 7. How to Update Website Content

### To update text content (headings, descriptions, feature copy):
- Edit files in `src/components/` — each section is its own `.tsx` file
- Example: to change the hero text → open `src/components/Hero.tsx`

### To update images/screenshots:
- Replace image files in `public/images/`
- Filenames should match what is referenced in the components

### To update the download link (APK):
- Edit `src/components/Download.tsx`
- Update the link to point to the latest APK download location

---

## 8. Files Delivered to Client

| Item | What it is |
|---|---|
| `admin_website/` folder (zipped) | Full website source code |
| Live website URL | The publicly accessible site (hosted by developer) |
| This `TURNOVER.md` | Documentation |

---

## 9. What the Client Does NOT Need to Touch

- GitHub repository (developer manages this)
- Deployment pipeline
- Any code — the website is live and accessible via URL

---

## 10. Ongoing Maintenance Reference

| Task | Responsible |
|---|---|
| Updating website content or copy | Developer |
| Adding new app screenshots | Developer |
| Updating the APK download link | Developer |
| Domain management (if custom domain) | Developer |
| Firebase admin user management | Developer |

---

*This document was prepared as part of the project handover. For technical questions, contact the developer.*
