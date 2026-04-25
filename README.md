# UnifyOne Modern Commerce Theme

A reusable Shopify theme template designed for modern retail brands.

## Features
- Flexible homepage sections (hero, trust bar, collections, story, featured products, testimonials, newsletter)
- Responsive Liquid templates for product, collection, cart, search, and content pages
- Theme settings for branding, colors, typography, and social links
- Optional Meta Pixel support (when configured)
- Packaged release workflow for marketplace/direct-sale distribution

## Requirements
- Shopify Online Store 2.0 compatible store
- Shopify CLI (optional, for local development)
- Node.js 18+ and npm 9+ (optional, for local tooling)

## Quick Start
1. Upload the packaged ZIP from `release/` in Shopify Admin (`Online Store` → `Themes` → `Add theme` → `Upload zip file`).
2. Publish the theme copy after preview checks.
3. Configure branding and content in Theme Editor.

For full instructions, see:
- `/docs/INSTALLATION.md`
- `/docs/CUSTOMIZATION.md`
- `/docs/SUPPORT.md`
- `/docs/CHANGELOG.md`

## Local Development
```bash
npm install
npm run dev
```

`npm run dev` expects `SHOPIFY_FLAG_STORE` to be set in your shell environment.
Example:
```bash
export SHOPIFY_FLAG_STORE=your-store.myshopify.com
npm run dev
```

## Linting and Formatting
```bash
npm run lint
npm run format
```

## Packaging for Sale
```bash
npm run package
```

This creates `release/unifyone-modern-commerce-theme.zip` containing only Shopify theme files and buyer docs.

Packaging requires the `zip` CLI utility to be available in your PATH.

## Support
See `/docs/SUPPORT.md`.
