# Product Requirements Document (PRD)

## 1. Overview

### 1.1 Product Summary

Build a **Next.js web application** that restricts access to its news content based on **age verification** using the **Concordium ID App** and the **Verify & Access** flow. Users must scan a **QR code** (or tap a deep link on mobile) displayed on the website, which establishes a **WalletConnect v2** session with the Concordium ID App. A **Verifiable Presentation Request (VPR)** is generated via the **Concordium Verifier Service**, anchored on-chain as a **Verification Request Anchor (VRA)**. Upon successful verification, a **Verification Audit Anchor (VAA)** is created on-chain, and the website unlocks the protected content.

No personal data (date of birth, name, nationality, etc.) is revealed to the website -- only a **zero-knowledge proof of age eligibility**.

### 1.2 Goals

- Ensure legally compliant age-restricted access
- Preserve user privacy via zero-knowledge proofs
- Provide a smooth, fast, and understandable user experience
- Generate auditable, tamper-evident verification records on-chain
- Be production-ready and auditable

### 1.3 Non-Goals

- No user account system
- No persistent identity storage
- No custody or management of user credentials

---

## 2. Target Users

- Visitors accessing age-restricted content (e.g., alcohol, adult content, gambling, compliance-restricted information)
- Users who already have the **Concordium ID App** installed

---

## 3. User Flow

### 3.1 High-Level Flow

1. User visits the website and sees blurred/locked news cards with an age verification overlay
2. User clicks **"Verify Age"** -- frontend initializes WalletConnect SignClient
3. Frontend generates WalletConnect pairing URI and displays a **QR code** (desktop) or **deep link button** (mobile)
4. User scans QR code / taps deep link with Concordium ID App -- WalletConnect pairing established
5. Frontend calls backend `POST /api/verification/create` with the WalletConnect session topic (connectionId)
6. Backend calls Concordium Verifier Service `POST /verifiable-presentations/create-verification-request` with connectionId, resourceId, contextString, and age credential statement
7. Verifier Service creates **VRA** on-chain (`RegisterData` transaction), returns VPR with transactionRef
8. Backend stores pending session, returns VPR + sessionId to frontend
9. Frontend sends VPR to IDApp via WalletConnect `request_verifiable_presentation_v1` method
10. IDApp validates VPR against on-chain VRA, prompts user for consent, generates ZK proof (VP)
11. IDApp returns VP to frontend via WalletConnect
12. Frontend sends VP + VPR + sessionId to `POST /api/verification/verify`
13. Backend generates audit UUID, calls Verifier Service `POST /verifiable-presentations/verify`
14. Verifier Service validates VP against VPR, creates **VAA** on-chain, returns result + Verification Audit Record (VAR) + anchor transaction hash
15. Backend stores VAR, sets HTTP-only encrypted session cookie
16. Frontend detects verified state, removes overlay, unlocks news content (no page reload)

### 3.2 Failure Paths

- User cancels proof request in IDApp
- Proof verification fails (invalid ZK proof)
- Proof expires (session TTL exceeded)
- WalletConnect pairing times out
- Concordium ID App not installed
- Verifier Service unavailable

Each failure path must result in a clear user-facing error message with the option to retry.

---

## 4. Functional Requirements

### 4.1 Frontend (Next.js App Router)

#### 4.1.1 Landing / Restricted Page

- Detect unauthenticated state from server-side session cookie
- Display news cards with **blurred content** and a gradient overlay
- Show "18+ Verification Required" badges on locked cards
- Display:
  - Age requirement (e.g., "You must be 18+ to continue")
  - Call-to-action button: **"Verify Age"**

#### 4.1.2 WalletConnect Pairing

- Initialize **WalletConnect SignClient** with Concordium namespace
- Generate a **pairing URI** and render as QR code (desktop)
- Provide **deep link button** for mobile same-device flow
- Handle wallet approval and session establishment

#### 4.1.3 Verification Flow

- Frontend orchestrates the flow via a state machine hook:
  `idle -> connecting -> creating_vpr -> awaiting_proof -> verifying -> verified | failed`
- Call backend API to create VPR
- Send VPR to IDApp via WalletConnect `request_verifiable_presentation_v1`
- Receive VP from IDApp via WalletConnect
- Forward VP + VPR to backend for verification

#### 4.1.4 Success State

- Unlock content without page reload
- Store verification state via server-side encrypted HTTP-only cookie (iron-session)
- Verification persists for 24 hours

#### 4.1.5 Failure State

- Show clear error messages in the QR modal
- Allow retry with a fresh WalletConnect session and new VPR

---

### 4.2 Backend (Next.js API Routes)

#### 4.2.1 Session Management

- Create short-lived verification sessions (in-memory Map, 5-minute TTL)
- Session fields: sessionId, createdAt, status, connectionId, vpr, transactionRef, VAR, anchorTransactionHash
- For production: replace in-memory store with Redis

#### 4.2.2 VPR Creation Endpoint (`POST /api/verification/create`)

- Accept `connectionId` (WalletConnect session topic) from frontend
- Call **Concordium Verifier Service** `POST /verifiable-presentations/create-verification-request`
- Pass credential statement: `AttributeInRange` on `dob` attribute with dynamically calculated upper bound
- Verifier Service anchors VRA on-chain, returns VPR
- Store pending session, return VPR + sessionId to frontend

#### 4.2.3 VP Verification Endpoint (`POST /api/verification/verify`)

- Accept sessionId, VP (presentation), VPR (verificationRequest) from frontend
- Generate `auditRecordId` (UUID)
- Call **Concordium Verifier Service** `POST /verifiable-presentations/verify`
- On success: update session, set encrypted session cookie, store VAR
- On failure: update session with error status

#### 4.2.4 Status Polling Endpoint (`GET /api/verification/status/:sessionId`)

- Return current session status for the given sessionId

#### 4.2.5 News Endpoint (`GET /api/news`)

- Fetch news from **GNews API** and **The Guardian API**
- Normalize responses to unified `NewsArticle` interface
- Cache with Next.js `revalidate` (30-minute TTL)
- Support `category` query parameter
- Gate full article content on verification status (strip content field for unverified users)

---

## 5. Concordium ID Integration

### 5.1 Proof Type

- **Zero-Knowledge Proof of Attribute (AttributeInRange)**
- Attribute: `dob` (date of birth)
- Predicate: born before `(today - REQUIRED_AGE)` years ago

### 5.2 QR Code Payload

The QR code encodes a **WalletConnect pairing URI**, NOT the proof request directly. The VPR is sent separately through the WalletConnect session after pairing is established.

### 5.3 WalletConnect Configuration

- Protocol: WalletConnect v2 (SignClient)
- Concordium namespace: `ccd`
- Testnet chain ID: `ccd:4221332d34e1694168c2a0c0b3fd0f27`
- Mainnet chain ID: `ccd:9dd9ca4d19e9393877d2c44b70f89acb`
- Method: `request_verifiable_presentation_v1`

### 5.4 Concordium Verifier Service

- Docker image: `concordium/credential-verification-service:0.1.0`
- Requires: Concordium account key (`.export` file) funded with CCD
- API: port 8000, Health/monitoring: port 8001
- Endpoints:
  - `POST /verifiable-presentations/create-verification-request`
  - `POST /verifiable-presentations/verify`

### 5.5 On-Chain Anchoring

- **VRA (Verification Request Anchor)**: Created during VPR generation. A `RegisterData` transaction containing a hash of the verification context and credential statements. Provides tamper-evident proof that a verification was requested.
- **VAA (Verification Audit Anchor)**: Created during VP verification. A `RegisterData` transaction containing a hash of the VAR. Provides tamper-evident proof that verification occurred.
- **VAR (Verification Audit Record)**: Stored off-chain in the merchant's database. Contains the full VPR, VP, and proof metadata for compliance auditing. No personal data is stored.

### 5.6 Trusted Issuers

- Testnet: `did:ccd:testnet:idp:0` through `did:ccd:testnet:idp:3`
- Mainnet: `did:ccd:mainnet:idp:0` through `did:ccd:mainnet:idp:3`

### 5.7 Security Constraints

- Proof requests are **single-use** (bound to a unique nonce and connectionId)
- Sessions expire after 5 minutes
- Proofs are verified server-side only via the Concordium Verifier Service
- VPR is cryptographically bound to the WalletConnect session via connectionId

---

## 6. News Integration

### 6.1 News Sources

- **GNews API**: Multi-source aggregation (100 req/day free, production use allowed)
- **The Guardian API**: Full-text journalism (500 req/day free)

### 6.2 Categories

`general`, `world`, `business`, `technology`, `science`, `sports`, `entertainment`, `health`

### 6.3 Caching

- Server-side caching with Next.js `revalidate` (30-minute TTL)
- Responses normalized to a unified `NewsArticle` interface
- Deduplication by title similarity across sources

### 6.4 Customization

- Categories configurable via UI category bar
- News API keys and cache TTL configurable via environment variables
- New news providers can be added by implementing the fetch + normalize pattern

---

## 7. Security & Privacy Requirements

- No storage of:
  - Date of birth
  - Identity attributes
  - Public keys linked to individuals
- HTTPS required everywhere (production)
- HTTP-only encrypted session cookies (iron-session)
- Rate limiting on proof creation recommended for production
- Session IDs are cryptographically random (UUID v4)
- VAR stored securely for audit compliance (no PII)

---

## 8. UX Requirements

- Clear explanation of why age verification is required
- Visual guidance on how to scan QR code
- Deep link support for mobile same-device flow
- Mobile-friendly responsive layout
- Loading skeletons during data fetch
- State-machine-driven verification flow with clear status at each step
- Accessible (WCAG AA): screen reader friendly, high contrast

---

## 9. Technical Stack

### 9.1 Frontend

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4
- QR code: `qrcode.react`
- WalletConnect: `@walletconnect/sign-client`

### 9.2 Backend

- Next.js API routes
- `iron-session` for encrypted session cookies
- Concordium Verifier Service (Docker)

### 9.3 Infrastructure

- Docker Compose for Concordium Verifier Service
- Concordium account funded with CCD for `RegisterData` transaction fees

---

## 10. Configuration

| Variable | Default | Description |
|---|---|---|
| `REQUIRED_AGE` | 18 | Minimum age required |
| `VERIFICATION_SESSION_TTL` | 300 | Session TTL in seconds |
| `NEXT_PUBLIC_CONCORDIUM_NETWORK` | testnet | testnet or mainnet |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | -- | WalletConnect Cloud project ID |
| `VERIFIER_SERVICE_URL` | http://localhost:8000 | Concordium Verifier Service URL |
| `GNEWS_API_KEY` | -- | GNews API key |
| `GUARDIAN_API_KEY` | -- | The Guardian API key |
| `NEWS_CACHE_TTL` | 1800 | News cache TTL in seconds |
| `SESSION_SECRET` | -- | iron-session encryption key (32+ chars) |
| `CONTEXT_STRING` | Age verification... | Human-readable context for VPR |
| `RESOURCE_ID` | /api/news | Resource being protected |

---

## 11. Acceptance Criteria

- User cannot access protected content without verification
- Successful proof unlocks content within 2 seconds of VP receipt
- No personal data is exposed to the website
- Proof replay attacks are not possible (nonce + connectionId binding)
- VRA and VAA are anchored on Concordium blockchain
- VAR is stored for audit compliance
- Works on desktop + mobile browsers
- Deep link works for mobile same-device flow

---

## 12. Open Questions / Future Enhancements

- Support multiple age thresholds
- Add country-specific age rules
- Add audit logging dashboard
- Replace `@concordium/web-sdk` with new SDK when available
- Add Redis for session storage in production
- Add database persistence for VAR records

---

## 13. Success Metrics

- Proof success rate > 95%
- Average verification time < 10 seconds
- Zero PII stored
- No critical security findings in audit

---

**Owner:** Product / Engineering

**Status:** Ready for implementation
