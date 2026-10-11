# CertiChain — Institutional Trust Modernist Design System & Specification

## Brand & Style

The visual identity embodies the intersection of rigorous academic governance and state-of-the-art cryptographic infrastructure. It projects unwavering institutional authority, tamper-proof security, and modern enterprise software ergonomics. 

The aesthetic is crisp, structured, and deliberate—borrowing architectural precision from prestigious universities while retaining the operational clarity of high-grade cryptographic tools. It steers clear of playful tech tropes or hyper-futuristic Web3 clichés (no neon glows, chromatic gradients, or floating polyhedrons). Instead, trust is communicated through disciplined geometric layouts, immaculate typography, hairline borders, and purposeful contrast between deep oceanic navies and surgical whites.

The system relies on a Modern Corporate & Tonal Layering approach. The primary mood should evoke feelings of certainty, verifiable truth, and scholarly prestige for registrars, credential evaluators, and students alike.

## Colors

The palette establishes an uncompromising visual hierarchy based on institutional depth and cryptographic validation.

### Core Roles
- **Primary Emerald Teal (`#0D9488` / `#00685F`)**: The signature action and cryptographic validation anchor. Communicates authenticity, live minting, verification triggers, and primary interactive links. Hover states step down to `#0F766E`, while active focus states employ `#115E59`.
- **Secondary Midnight Navy (`#0F172A` / `#213145`)**: The institutional bedrock. Used for top-level navigation chrome, dark sidebars, terminal windows, hash inspectors, and primary display text. Secondary dark tone `#0B0F19` anchors root-level structural frames.
- **Tertiary Academic Gold (`#D97706` / `#8D4B00`)**: Reserved strictly for high-prestige elements, graduation seals, verification badges of honor, Magna Cum Laude callouts, and official accreditation shields. Muted supporting tint `#FEF3C7` / `#FFDCC3` provides context fills.
- **Neutral Slate (`#64748B` / `#6D7A77`)**: Bridges structural surfaces with crisp legibility. Foundation shades span from pristine canvas (`#FFFFFF`) to canvas surface alt (`#F8FAFC` / `#EFF4FF`) and structural border line (`#E2E8F0` / `#BCC9C6`).

### Semantic Status
- **Verified / Active**: `#059669` (Surface: `#ECFDF5`, Border: `#A7F3D0`)
- **Pending / In Review**: `#D97706` (Surface: `#FFFBEB`, Border: `#FDE68A`)
- **Revoked / Tampered**: `#E11D48` (Surface: `#FFF1F2`, Border: `#FECDD3`)
- **On-Chain Synced**: `#0284C7` (Surface: `#F0F9FF`, Border: `#BAE6FD`)

## Color Token Mapping (Tailwind & CSS Variables)
- `surface`: `#f8f9ff`
- `surface-dim`: `#cbdbf5`
- `surface-bright`: `#f8f9ff`
- `surface-container-lowest`: `#ffffff`
- `surface-container-low`: `#eff4ff`
- `surface-container`: `#e5eeff`
- `surface-container-high`: `#dce9ff`
- `surface-container-highest`: `#d3e4fe`
- `on-surface`: `#0b1c30`
- `on-surface-variant`: `#3d4947`
- `inverse-surface`: `#213145`
- `inverse-on-surface`: `#eaf1ff`
- `outline`: `#6d7a77`
- `outline-variant`: `#bcc9c6`
- `surface-tint`: `#006a61`
- `primary`: `#00685f` (Brand Teal: `#0d9488`)
- `on-primary`: `#ffffff`
- `primary-container`: `#008378`
- `on-primary-container`: `#f4fffc`
- `inverse-primary`: `#6bd8cb`
- `secondary`: `#565e74`
- `on-secondary`: `#ffffff`
- `secondary-container`: `#dae2fd`
- `on-secondary-container`: `#5c647a`
- `tertiary`: `#8d4b00` (Gold: `#d97706`)
- `on-tertiary`: `#ffffff`
- `tertiary-container`: `#b15f00`
- `on-tertiary-container`: `#fffbff`
- `error`: `#ba1a1a`
- `on-error`: `#ffffff`
- `error-container`: `#ffdad6`
- `on-error-container`: `#93000a`
- `primary-fixed`: `#89f5e7`
- `primary-fixed-dim`: `#6bd8cb`
- `tertiary-fixed`: `#ffdcc3`
- `tertiary-fixed-dim`: `#ffb77d`

## Typography

The type system is constructed exclusively around **Inter**, engineered for optimal screen legibility, strict vertical alignment, and structured data consumption. For raw cryptographic payloads, transaction IDs, smart contract hashes, and Merkle tree roots, **JetBrains Mono** serves as the utilitarian companion.

### Tabular Formatting
All numeric data grids, timestamp outputs, credential identifiers, and ledger tables enable font feature settings `'tnum' on, 'zero' on`. This ensures clean tabular number alignment without character drift across rows.

## Elevation & Depth
- **Level 0 (Flat Ground)**: Baseline canvases (`#F8FAFC`). No shadow. Borderless or delineated by a single continuous 1px `#E2E8F0` rule.
- **Level 1 (Structural Cards & Modules)**: Pure white `#FFFFFF` surfaces with a 1px border (`#E2E8F0`) and an ambient micro-shadow: `0 1px 2px 0 rgba(15, 23, 42, 0.05)`.
- **Level 2 (Interactive Hover & Dropdowns)**: Active credential rows and hover card elevations: `0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)`.
- **Level 3 (Certificate Inspections & Modals)**: Critical proof inspectors, cryptographic validation popovers, and full-screen modals: `0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.04)`, bordered with 1px `#CBD5E1`.

## Component Directives
- **The Certificate Parchment Canvas**: Set on crisp pure white `#FFFFFF` or elevated `#FAFAF9` with a subtle inside 2px gold accent hairline (`#FDE68A`) to denote official diploma dignity.
- **Verification Seal**: Scalable SVG watermark stamp in `#D97706` overlaid with a verified micro-badge in `#0D9488`.
- **Hash / Proof Blocks**: Monospaced terminal container styled in `#0F172A` with `#F8FAFC` JetBrains Mono text, fitted with quick-copy micro buttons and cryptographic integrity hashes.
- **Multi-Sig Custody Pipeline**: Hardware signer queue display showing quorum requirements (3-of-5).
