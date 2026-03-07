<div align="center">

# ⬟ Blueprint

### *From idea to complete developer brief — in your VS Code sidebar.*

**Blueprint is a VS Code extension that acts as a team of elite AI agents,** each specializing in one phase of software design. You describe your app, Blueprint runs 8 sequential agents, and you get a battle-tested, fully-commented, one-shot build brief that any developer or AI coding assistant can execute immediately.

[![VS Code](https://img.shields.io/badge/VS%20Code-1.85+-blue?logo=visual-studio-code)](https://code.visualstudio.com/)
[![Version](https://img.shields.io/badge/version-0.2.0-brightgreen)](https://github.com/akdey/Blueprint/raw/main/blueprint-0.2.0.vsix)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![LLM Providers](https://img.shields.io/badge/LLM-Gemini%20%7C%20OpenAI%20%7C%20Groq%20%7C%20Azure%20%7C%20LiteLLM-orange)](https://openai.com)
[![License](https://img.shields.io/badge/license-Proprietary-red)](LICENSE)

</div>

---

## 🚀 Instant Install

**Get Blueprint running in 30 seconds:**

1.  **Download the Extension**: [**Click here to download `blueprint-0.2.0.vsix`**](https://github.com/akdey/Blueprint/raw/main/blueprint-0.2.0.vsix)
2.  **Install in VS Code**: Open VS Code → Extensions (`Ctrl+Shift+X`) → Click the `...` in the top right → **Install from VSIX...** → Select the downloaded file.
3.  **Activate**: Click the ⬟ icon in your Activity Bar.

---

## 🆕 What's New in v0.2.0

| | Feature | Impact |
|---|---|---|
| 🗜️ | **LLMLingua2 Context Compression** | Phases 4–8 no longer hit token limits — older artifacts are semantically compressed |
| 🎨 | **Real CSS Branding Scraper** | Fetches actual linked stylesheets and extracts `--color-*`, `@font-face`, hex tokens |
| 📝 | **9× Deeper Agent Prompts** | All 8 agents now have mandatory numbered output sections with exact code/table formats |
| 🧠 | **Two-Dimensional Wow Factor** | Solution Intelligence (sentiment analysis, anomaly detection, etc.) + UI/UX Delight |
| 🚀 | **Cache-Friendly Prompts** | 100% static system prompts enable Gemini/OpenAI prefix caching |

---

## 📋 Prerequisites

Before you start, ensure you have:
- **VS Code 1.85+**
- **An Open Workspace**: Blueprint needs a folder to save your `.blueprint/` artifacts.
- **An LLM API Key**: You'll need a key from Gemini, OpenAI, Groq, or Azure.
  - *Recommendation*: Use [Groq](https://console.groq.com) for near-instant (and free) generations during your first trial.

---

## 🤔 The Problem

Every developer has been here:

> *"I have a great app idea. Where do I even start?"*

You open an AI chat and describe your idea. You get... a half-baked wireframe, a generic tech stack suggestion, and a code snippet that doesn't actually work together. You spend hours in back-and-forth trying to get the AI to understand your vision.

**Blueprint fixes this at the root.**

---

## ✨ What Blueprint Does

Blueprint runs **9 specialized AI agents** in sequence, each deeply focused on one layer of your application — from brand identity to database schema to the final one-shot build prompt. Every agent **reads every prior phase's approved output**, ensuring nothing is contradictory, nothing is forgotten.

The result: a `08_handoff.md` file that contains **the complete blueprint of your application** — including a mandatory **Traceability Matrix** directive to ensure 100% feature coverage. Ready to paste into Antigravity, Copilot, Claude, or hand to a developer. Optionally, run the 9th phase to generate mock data or RAG documents.

---

## 🚀 The 9-Phase Workflow

```
⚡ PROTOTYPE  ──  🚀 MVP  ──  🏭 PRODUCTION
     ↑
  You choose the depth on day one.
  All agents calibrate to your level.
```

| # | Phase | What the Agent Produces |
|---|-------|------------------------|
| **1** | ✦ **Identity** | Brand mission, color palette (hex), typography, logo concept, taglines |
| **2** | ◈ **Scope** | User personas, 10+ user stories, functional requirements, KPIs |
| **3** | ⬡ **Skeleton** | ASCII architecture diagram, full directory tree, data flow, design patterns |
| **4** | ⬢ **Contract** | Every API endpoint — method, path, validation schemas, auth, error codes |
| **5** | ◉ **Testing** | TDD strategy + executable test patterns (pytest + Vitest + Playwright) |
| **6** | ◈ **Data** | Database ORM models, ER diagram, migration strategy, indexed queries |
| **7** | ◇ **Design** | Component library, CSS/Tailwind tokens, UI/UX, **✨ Wow Factor** |
| **8** | ⬟ **Handoff** | One-shot build brief — all artifacts embedded, step-by-step build order |
| **9** | 🌿 **Seeding** | *(Optional)* DB seed scripts honoring foreign-keys, or Domain-Specific RAG Mock Docs |

---

## 🏆 Flagship Features (The Game Changers)

### 🏗️ Bring Your Own DNA (Standards & Patterns)
Blueprint is the first orchestrator that lets you enforce **your** engineering DNA.
- **Upload your `STANDARDS.md`**: Paste or import your team's specific naming conventions, folder structures (e.g., Clean Architecture vs. Hexagonal), and coding patterns.
- **Strike Directive**: Every agent is given a **high-priority instruction** to prioritize your custom guidelines over its default suggestions.
- **Architecture on Your Terms**: The Architecture agent builds the tree you want; the API agent uses your preferred patterns.

### 🎨 Tech Stack Wizard (Zero Noise)
Generic generators ask too much. Blueprint's wizard is **context-aware** and **level-calibrated**:
- **Automatic Multi-Factor Analysis**: After Phase 2 (Scope), Blueprint analyzes your specific app idea to curate a perfect questionnaire.
- **Build-Level Filtering**: If you're building a "Prototype," the wizard automatically suppresses enterprise complexity like CI/CD, Kubernetes, and Observability.
- **Intelligent Recommendations**: Every choice includes a **justification** based on your app type and build level.

---

## 💡 Key Features

### 🎯 Build Level — Not One-Size-Fits-All
Set your ambition on the setup screen. Everything adapts automatically:

- **⚡ Prototype**: SQLite, simple auth, monolith, move fast. Perfect for demos.
- **🚀 MVP**: PostgreSQL, JWT, modular — production-like without the overhead.
- **🏭 Production**: Full security, observability, scalability, CI/CD directives.

### ✨ Wow Factor Built-In
The Design phase (Phase 7) is uniquely structured to produce a **"✨ Wow Factor"** section:
- **Micro-interactions**: 3-5 signature animations (spring physics, skeleton shimmers).
- **Unexpected Delight**: One "surplus" feature (AI-generated hover summaries, confetti on milestones).
- **Premium UX**: Glassmorphism, smooth transitions, and high-quality empty states as first-class citizens.

### 🧠 Smart Context + LLMLingua2 Compression
Every agent gets exactly the context it needs — no more token overflows on later phases.
- **Provider-Specific Token Budgets**: Dynamically allocates massive 100K character budgets for Gemini/OpenAI, and strict 24K limits for Groq to prevent TPM rate limits.
- **Phase-Aware Policy**: Each agent receives full verbatim context for the 2 most recent phases, LLMLingua2-compressed context for older phases, and headline-only snippets for the oldest.
- **LLMLingua2 (Microsoft, JS/Node port)**: Uses a BERT-sized token classifier to compress older phase artifacts by 50% while preserving semantic meaning.
- **Graceful fallback**: If LLMLingua2 hasn't loaded yet, a deterministic compressor (header + first-sentence extraction) kicks in automatically.

### 🎨 Real Website Branding Extraction (Identity Agent)
Blueprint now fetches your client's actual brand tokens from their live website:
- **External CSS scraping**: Discovers and fetches up to 3 linked stylesheets in parallel (capped at 30KB each) — where real brand custom properties live.
- **CSS token extraction**: Scans for `--color-*`, `--brand-*`, `--font-*` custom properties, `@font-face` declarations, and all hex color values.
- **Google Fonts detection**: Found in both HTML `<link>` tags and CSS `@import` rules.
- **Meta signals**: Theme color, OG title, OG description.

### 🧠 Cumulative Context = No Contradictions
Every agent receives the **approved, edited output** of every previous phase. The Database agent knows your API contract. The Design agent references your brand colors. The Handoff agent embeds *all of it* inline.

### ✏️ Edit Before Committing
Every generated artifact appears in an **editable textarea** in the sidebar. Change a user story, edit a field name, rewrite a section — those changes propagate to every subsequent agent automatically.

### 💬 Code Comments Mandate
Every agent is instructed to produce code with:
- **File headers** — path, purpose, key dependencies
- **Docstrings** on every class and function
- **Inline comments** on all non-trivial logic
- **`# TODO:` markers** on all stubs and placeholders

The handoff brief doesn't just tell someone *what* to build — it tells them *why* every decision was made.

### 🔌 Multi-LLM Support — Your Key, Your Choice
No subscription. No middleman. Bring your own API key. Supports **Google Gemini** (2.0 Flash/1.5 Pro), **OpenAI**, **Groq** (fastest), **Azure OpenAI**, and **LiteLLM** (connect to anything).

---

## 📁 Artifacts Saved to Your Workspace
Every phase writes a `.md` file to `.blueprint/` in your workspace:
```
.blueprint/
├── 01_identity.md
├── 02_scope.md    (Tech Stack Wizard triggers after this)
├── 03_skeleton.md
├── 04_contract.md
├── 05_testing.md
├── 06_data.md
├── 07_design.md   (Wow Factor injected here)
├── 08_handoff.md  (The 1-Step Build Prompt)
└── 09_seeding.md  (Mock DB Scripts / RAG Docs)
```

---

## ⚡ Quick Start

### 1. Configure your LLM
Open VS Code Settings → search **"Blueprint"** → enter your API key.

### 2. Setup your Project
- **Requirements**: Describe your app or import a spec file.
- **✨ Custom Standards**: Paste your team's coding guidelines or import a `STANDARDS.md`.
- **Build Level**: Choose **Prototype**, **MVP**, or **Production**.

### 3. Run & Refine
Run phases 1-8. Review, edit, and approve each step. The **Tech Stack Wizard** will help you lock in your tools after Phase 2.

### 4. Invoke Handoff
After Phase 8, click **🚀 Invoke Handoff** and paste your ultimate **Master Prompt** into any AI coder (Antigravity, Copilot, etc.) to build your app.

---

## 🏗️ Architecture

```
Blueprint VS Code Extension
│
├── src/
│   ├── extension.ts              — Activation, commands, sidebar registration
│   ├── panels/
│   │   ├── BlueprintViewProvider.ts  — Webview controller, all message handlers
│   │   └── BlueprintPanelManager.ts — (stub, sidebar is primary UI)
│   ├── agents/
│   │   ├── AgentOrchestrator.ts  — 9 specialized phases + smart context routing
│   │   ├── ContextCompressor.ts  — LLMLingua2 + deterministic fallback compressor
│   │   ├── LLMClient.ts          — Multi-provider LLM client (Gemini/OpenAI/Groq/Azure)
│   │   └── prompts/              — 9 agent prompts (cache-friendly static system prompts)
│   └── state/
│       └── ProjectStateManager.ts — State, artifact persistence, buildContext + buildSmartContext
│
└── media/
    └── sidebar.html              — Full sidebar UI (vanilla HTML/CSS/JS)
```

**Key design decisions**:
- The entire sidebar is a single `sidebar.html` with vanilla JS — no bundler, no React, no build step.
- System prompts are **fully static** (no dynamic variables) — enabling server-side caching on Gemini and OpenAI.
- Dynamic content (project data + prior artifacts) lives **only in user prompts**, at the end — ensuring the static prefix caches correctly.

---

## 🛠️ Development

```bash
git clone https://github.com/akdey/Blueprint
cd Blueprint
npm install
npm run compile

# Press F5 in VS Code to launch Extension Development Host
```

---

## 🗺️ Roadmap

- [x] 🎨 Real website branding extraction (external CSS stylesheets + CSS custom properties)
- [x] 🧠 LLMLingua2 prompt compression — smart context budgeting across all 8 phases
- [x] 📝 All 8 agent prompts deeply detailed with mandatory output sections
- [x] 🚀 Cache-friendly prompt structure (static system prompts, dynamic content last)
- [ ] 🤝 VS Code Marketplace publish
- [ ] 📊 Project dashboard — view all `.blueprint/` artifacts in a panel
- [ ] 🌐 URL import — paste a spec doc URL, Blueprint scrapes it
- [ ] 🔄 Phase regeneration with custom instructions
- [ ] 🧩 Custom phase definitions — add your own agents
- [ ] 🚀 Direct Copilot/Antigravity file injection via `github.copilot.chat.attachFile`

---

## 📄 License

© 2024 Amit Dey. All Rights Reserved. Proprietary software.

---

<div align="center">

**Built with obsessive attention to developer experience.**

*Blueprint doesn't write your code. It makes sure you know exactly what to build — before you write a single line.*

</div>
