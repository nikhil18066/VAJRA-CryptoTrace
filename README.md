# VAJRA (वज्र) — Real-Time Multi-Chain Crypto Fraud Intelligence & Forensic Tracing Suite

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Capacitor](https://img.shields.io/badge/Capacitor-Android-119EFF?style=flat-square&logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

**VAJRA** is an institutional-grade, real-time cryptocurrency forensic analysis and fraud tracing platform designed for law enforcement agencies (LEAs), cybercrime investigators, and forensic analysts. It automates multi-hop transaction tracing, entity clustering, AML compliance scoring, and court-admissible forensic dossier generation across EVM (Ethereum, BNB Chain, Polygon, Arbitrum, Base, Optimism), Tron (TRC-20), Bitcoin, and Solana blockchains.

---

## ⚡ Key Capabilities & 21-Pillar Architecture

### 1. 🌐 Interactive Multi-Tier Fund Flow Graph
- **Forensic Graph Engine**: Ingests up to 20+ on-chain counterparties with multi-column non-overlapping spatial layouts and dynamic collision relaxation.
- **Categorized Entity Color Nodes**:
  - 🌪️ **Sanctioned Mixers (Tornado.Cash, Blender)**: Neon Pink (`#ec4899`)
  - 🏦 **Compliant VASPs / CEX Gateways (Binance, OKX, Bybit)**: Emerald Green (`#00d68f`)
  - ⚡ **Syndicate Collector Hubs**: Crimson Red (`#ff3d5a`)
  - 👤 **Pass-Through Mules**: Warm Amber (`#f59e0b`)
  - 🛡️ **Verified Victims / Upstream Sources**: Cobalt Blue (`#60a5fa`)
  - 🎯 **Target Subject**: High-Contrast Cyan (`#00f2fe`)
  - 💼 **Intermediary Transit**: Sky Blue (`#38bdf8`)
  - 📄 **Smart Contracts**: Royal Purple (`#a855f7`)
- **Triage Filter Suite**: One-click filtering for `All Transfers`, `⚡ Large Transfers`, `🚨 Suspicious Tracking`, `⬇ Inflows`, and `⬆ Outflows`.
- **Time-Machine Playback Bar**: 4-stage chronological transaction timeline (`T0: Inflow` $\to$ `T1: Layering` $\to$ `T2: Mixer Hop` $\to$ `T3: Liquidation`) with `1x`, `2x`, and `4x` playback controls.
- **Interactive "What-If" Simulator**: Real-time topological re-tagging of nodes with instant graph-wide composite AML risk score re-propagation.

### 2. 🔍 Real-Time Multi-Chain Ledger Ingestion
- **EVM Networks**: Ethereum, BNB Chain (BSC), Polygon (POL), Arbitrum, Base, and Optimism with automated native & token balance tracking.
- **Tron Grid**: Live TRX and TRC-20 (USDT) token transfers with Base58Check decoding.
- **Bitcoin & Solana**: Native UTXO ledger analysis and SPL token tracking.
- **High-Reliability Multi-Provider RPC**: Seamless failover across Etherscan v2, GoldRush Covalent API, Blockscout v2, and public fallback RPC nodes.

### 3. 🤖 AI Forensic Investigator & Narrative Synthesis
- **LLM-Powered Case Generation**: Integrates with leading frontier models (DeepSeek R1, Qwen 2.5, Claude) via OpenRouter to generate structured intelligence reports.
- **Forensic DNA Profile**: Multi-vector risk assessment (AML risk, mixer exposure, behavioral velocity, fan-out dispersion, and exchange off-ramp exposure).
- **Alternative Hypothesis Testing**: Evaluates primary illicit assertions vs. counter-hypotheses (e.g. OTC market-making arbitrage) with explainable confidence differentiators.

### 4. 📷 Industrial QR Scanner & Multi-Modal FIR Ingestion
- **Single-Click QR Scanner**: Live hardware camera scanner with torch toggle, front/rear camera switcher, and instant address parsing.
- **OCR Document Parser**: Automated extraction of wallet addresses, FIR crime numbers, victim loss amounts, and incident dates from scanned First Information Reports (FIR).

### 5. 📑 Court-Admissible Documentation & Legal Notices
- **Printable Forensic Dossier**: Generates standardized Section 65B-compliant electronic evidence certificates for legal and judicial proceedings.
- **Section 91 CrPC / VASP Notice Generator**: Automated generation of emergency freeze and transaction record disclosure notices for centralized exchanges.

### 6. 📱 Standalone Offline Android App (APK)
- Fully packaged Android application via Capacitor with hardware back-button navigation, persistent cross-case registry, and offline cached intelligence.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18, TypeScript, Vite |
| **Styling & Design System** | Tailored High-Contrast Dark Theme, Vanilla CSS, Lucide Icons |
| **Mobile Runtime** | Capacitor 5, Android SDK 34, JDK 21 |
| **Blockchain Data Providers** | Etherscan v2 API, TronGrid REST API, Covalent GoldRush API, Blockscout v2 |
| **AI / Narrative Intelligence** | OpenRouter API (DeepSeek R1, Qwen 2.5 72B), Custom ML Classifier |
| **State & Persistence** | Custom Reactive Store with LocalStorage & Secure State Sync |

---

## 🚀 Quick Start & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm**
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/VAJRA-CryptoTrace.git
cd VAJRA-CryptoTrace
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the example environment template and add your API keys:
```bash
cp .env.example .env
```

Edit `.env` with your API credentials:
```env
# 1. On-Chain Data Provider Keys
VITE_ETHERSCAN_API_KEY=your_etherscan_api_key
VITE_TRONGRID_API_KEY=your_trongrid_api_key
VITE_GOLDRUSH_API_KEY=your_goldrush_api_key

# 2. AI & LLM Narrative Generation
VITE_OPENROUTER_API_KEY=your_openrouter_api_key

# 3. Optional ML Microservice
VITE_ML_SERVICE_URL=http://localhost:8000
```

### 4. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173/` in your browser.

### 5. Build for Production
```bash
npm run build
```

---

## 📱 Compiling the Android APK

To build the standalone debug Android APK (`VAJRA-CryptoTrace.apk`):

```powershell
# Run the PowerShell build script
powershell -ExecutionPolicy Bypass -File .\build_apk.ps1
```

The output APK will be generated in the root directory: `VAJRA-CryptoTrace.apk`.

---

## 📂 Project Directory Structure

```
├── src/
│   ├── components/            # UI Components (FundFlowGraph, QRScanner, BottomNav, RiskGauge, etc.)
│   ├── screens/               # Main Application Views (Dashboard, CaseDetail, AIInvestigator, etc.)
│   ├── services/              # Forensic Engines (blockchain.ts, riskEngine2.ts, entityIntelligence.ts, etc.)
│   ├── store/                 # Reactive State Stores (analysisStore.ts, caseStore.ts)
│   ├── context/               # Application & Theme Contexts
│   └── utils/                 # Dossier Exporters & Legal Notice Generators
├── android/                   # Capacitor Android Native Project
├── docs/                      # Technical Dossiers & Architecture Specifications
├── build_apk.ps1              # Automated Standalone APK Build Script
├── capacitor.config.ts        # Capacitor Mobile Configuration
└── vite.config.ts             # Vite Bundler Configuration
```

---

## 🛡️ Security & Privacy Notice
VAJRA operates entirely on public blockchain ledger metadata and privacy-preserving client-side analysis. No private keys, seed phrases, or sensitive credential data are ever collected, transmitted, or logged.

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
