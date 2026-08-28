# RealRate v2

Premium liquid-glass gold/silver rate dashboard for India.

## What it shows
- IBJA-style benchmark/base rate (Gold 999, 916, 750 and Silver 999)
- BUY estimate = benchmark + 3% GST (making/wastage/retailer premium are not included)
- SELL estimate = benchmark minus a user-adjustable deduction
- Weight calculator for Gold and Silver
- Responsive liquid-glass UI

## Live-rate architecture
1. On Vercel, `/api/rates` fetches the public IBJA rates page server-side and returns parsed benchmark values with 15-minute edge caching.
2. `npm run dev` and `npm run build` attempt to refresh `public/rates.json` first.
3. If the network/source is unavailable, the app falls back to the last saved benchmark snapshot instead of showing fake demo data.

IBJA describes its displayed Gold rates as per 10g and Silver as per 1kg, excluding 3% GST and making charges. The sell figure on RealRate is an estimate, not an official universal resale rate.

## Run locally
```bash
npm install --ignore-scripts
npm run dev -- --host 0.0.0.0
```

## Build
```bash
npm run build
```

## Deploy
Deploy the repository to Vercel. The `api/rates.js` serverless endpoint will work automatically there.


## SEO V4
Search-intent landing pages, calculator pages with working standalone tools, internal linking, canonical/meta/OpenGraph/Twitter tags, Breadcrumb/WebPage/WebApplication structured data, FAQ content, robots.txt and sitemap.xml are included.


## AdSense-readiness (pre-approval)
- Added About, Contact, Privacy Policy, Terms, Disclaimer and calculation Methodology pages.
- Privacy Policy includes Google advertising/cookie disclosures for use once AdSense is enabled.
- Navigation and internal links expose trust/legal pages on the homepage and static SEO pages.
- No AdSense publisher code or ads.txt is added yet because those require the real publisher ID from the approved/created AdSense account.
