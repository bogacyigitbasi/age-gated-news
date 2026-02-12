# Project: Concordium Age-Gated News (NewsGate)

Next.js 15 (App Router, TypeScript, Tailwind CSS v4) web app that displays news behind an age gate. Users verify age via Concordium ID App using ZK proofs through the Verify & Access flow. No personal data is revealed.
Try it out from: https://age-gated-news.vercel.app/ 

## Architecture

- **Frontend**: Next.js App Router + WalletConnect v2 SignClient + QR code
- **Backend**: Next.js API routes + iron-session cookies
- **Verification**: Concordium Verifier Service (Docker, port 8000) handles VPR creation, VP validation, and on-chain anchoring (VRA + VAA)
- **News**: GNews API + The Guardian API, dual-source with 30-min cache

## Key Technical Details

- Concordium namespace: `ccd`, Testnet chain ID: `ccd:4221332d34e1694168c2a0c0b3fd0f27`
- WalletConnect method: `request_verifiable_presentation_v1`
- Deep link scheme: `concordium://wc?uri={encoded}` (mobile only, same for testnet/mainnet)
- VP from WalletConnect is wrapped in `{ verifiablePresentationJson: {...} }` - must unwrap before sending to Verifier Service
- Credential statement: `AttributeInRange` on `dob` with dynamically calculated upper bound
- Trusted issuers: `did:ccd:testnet:idp:0` through `did:ccd:testnet:idp:3`
- `@concordium/web-sdk` is NOT needed - Verifier Service handles all chain interactions
- In-memory session store uses `globalThis` pattern to survive dev hot reloads

## Dev Server

- Uses `next dev --webpack` (not Turbopack) to avoid intermittent 404s on API routes
- Verifier Service Docker: `concordium/credential-verification-service:0.1.0` with `platform: linux/amd64` for Apple Silicon
- Account key: `keys/private.export` mounted into container

## Commands

- `npm run dev` - Start dev server (webpack mode)
- `npm run docker:verifier` - Start Concordium Verifier Service
- `npm run docker:verifier:stop` - Stop Verifier Service
- `npx next build` - Production build (uses Turbopack, compiles clean)

## Environment Variables

See `.env.example`. Key ones: `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`, `SESSION_SECRET`, `GNEWS_API_KEY`, `GUARDIAN_API_KEY`, `VERIFIER_SERVICE_URL`

## Reference Implementation

The Concordium wallet browser app at `/Users/bogachanyigitbasi/Desktop/Work/IdAppWallet/concordium-wallet/` was used as reference for WalletConnect integration and deep link scheme.

## Known Issues / Future Work

- Debug console.log statements still present in verifier-service.ts, verify/route.ts, useVerification.ts, walletconnect.ts - remove for production
- Replace in-memory session store with Redis for production
- Add database persistence for VAR (Verification Audit Records)
- `Verfiy&Access.pdf` is untracked (intentional - reference doc)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
