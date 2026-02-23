<div align="center">

# ⬟ Blueprint

### *From idea to complete developer brief — in your VS Code sidebar.*

**Blueprint is a VS Code extension that acts as a team of elite AI agents,** each specializing in one phase of software design. You describe your app, Blueprint runs 8 sequential agents, and you get a battle-tested, fully-commented, one-shot build brief that any developer or AI coding assistant can execute immediately.

[![VS Code](https://img.shields.io/badge/VS%20Code-1.85+-blue?logo=visual-studio-code)](https://code.visualstudio.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![LLM Providers](https://img.shields.io/badge/LLM-Gemini%20%7C%20OpenAI%20%7C%20Groq%20%7C%20Azure-orange)](https://openai.com)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

</div>

---

## 🤔 The Problem

Every developer has been here:

> *"I have a great app idea. Where do I even start?"*

You open an AI chat and describe your idea. You get... a half-baked wireframe, a generic tech stack suggestion, and a code snippet that doesn't actually work together. You spend hours in back-and-forth trying to get the AI to understand your vision.

**Blueprint fixes this at the root.**

---

## ✨ What Blueprint Does

Blueprint runs **8 specialized AI agents** in sequence, each deeply focused on one layer of your application — from brand identity to database schema to the final one-shot build prompt. Every agent **reads every prior phase's approved output**, ensuring nothing is contradictory, nothing is forgotten.

The result: a `08_handoff.md` file that contains **the complete blueprint of your application** — ready to paste into Antigravity, Copilot, Claude, or hand to a developer.

---

## 🚀 The 8-Phase Workflow

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
| **4** | ⬢ **Contract** | Every FastAPI endpoint — method, path, Pydantic schemas, auth, error codes |
| **5** | ◉ **Testing** | TDD strategy + executable test patterns (pytest + Vitest + Playwright) |
| **6** | ◈ **Data** | SQLAlchemy ORM models, ER diagram, migration strategy, indexed queries |
| **7** | ◇ **Design** | Component library, Tailwind tokens, Framer Motion catalogue, **✨ Wow Factor** |
| **8** | ⬟ **Handoff** | One-shot build brief — all artifacts embedded, step-by-step build order |

---

## 💡 Key Features

### 🎯 Build Level — Not One-Size-Fits-All
Set your ambition on the setup screen. Everything adapts automatically:

- **⚡ Prototype**: SQLite, simple auth, monolith, move fast. Perfect for demos.
- **🚀 MVP**: PostgreSQL, JWT, modular — production-like without the overhead.
- **🏭 Production**: Full security, observability, scalability, CI/CD directives.

### 🧠 Cumulative Context = No Contradictions
Every agent receives the **approved, edited output** of every previous phase. The Database agent knows your API contract. The Design agent references your brand colors. The Handoff agent embeds *all of it* inline.

### ✏️ Edit Before Committing
Every generated artifact appears in an **editable textarea** in the sidebar. Change a user story, edit a field name, rewrite a section — those changes propagate to every subsequent agent automatically.

### 🎨 Tech Stack Wizard (Context-Aware)
After approving your Scope document, a slide-up overlay asks 4-6 tech stack questions — tailored to your project type and build level. No version control questions. No deployment questions. Just: *what are you building with?*

> "Best for a prototype: SQLite with aiosqlite — zero config, migrate to Postgres later"

### ✨ Wow Factor Built-In
The Design phase explicitly produces a **"✨ Wow Factor"** section: signature micro-interactions, delight features, branded empty states, and loading experiences. Because *good* software is also *delightful* software.

### 💬 Code Comments Mandate
Every agent is instructed to produce code with:
- **File headers** — path, purpose, key dependencies
- **Docstrings** on every class and function
- **Inline comments** on all non-trivial logic
- **`# TODO:` markers** on all stubs and placeholders

The handoff brief doesn't just tell someone *what* to build — it tells them *why* every decision was made.

### 🔌 4 LLM Providers — Your Key, Your Choice
No subscription. No middleman. Bring your own API key:

| Provider | Models |
|----------|--------|
| **Google Gemini** | gemini-2.0-flash, gemini-1.5-pro |
| **OpenAI** | gpt-4o, gpt-4-turbo, gpt-3.5-turbo |
| **Groq** | llama-3.3-70b (ultra-fast, free tier available) |
| **Azure OpenAI** | Any deployed model on your Azure resource |

### 📁 Artifacts Saved to Your Workspace
Every phase writes a `.md` file to `.blueprint/` in your workspace:
```
.blueprint/
├── 01_identity.md
├── 02_scope.md
├── 03_skeleton.md
├── 04_contract.md
├── 05_testing.md
├── 06_data.md
├── 07_design.md
└── 08_handoff.md    ← The crown jewel
```
Commit them. Share them. Use them as a project wiki.

---

## ⚡ Quick Start

### 1. Install
- Install the `.vsix` directly: **Extensions panel → `···` → Install from VSIX**
- Or install from the VS Code Marketplace *(coming soon)*

### 2. Configure your LLM
Open VS Code Settings → search **"Blueprint"** → enter your API key for your preferred provider.

> **Free option**: Use [Groq](https://console.groq.com) with `llama-3.3-70b-versatile` — it's fast and has a generous free tier.

### 3. Open a workspace folder
Blueprint saves artifacts to your current workspace. Open any folder first.

### 4. Click the Blueprint icon in the Activity Bar
The sidebar opens. Fill in:
- **Project name** — e.g., "FinTrack"
- **Client/Brand** *(optional)* — auto-scrapes colors and fonts from their website
- **Industry** — calibrates agent personas
- **Requirements** — paste your brief, import a `.txt`/`.md` file, or just describe it
- **Build Level** — Prototype / MVP / Production

### 5. Run phases, review, approve
Click **▷ Run** on Phase 1. Review the output. Edit anything you want. Click **✓ Approve → Scope** to move to Phase 2.

After Phase 2 (Scope) is approved, the **Tech Stack wizard** slides up automatically.

### 6. Invoke Handoff
After Phase 8, click **🚀 Invoke Handoff**. Blueprint will:
1. Copy the full brief to your clipboard
2. Attach `.blueprint/08_handoff.md` as a file context in your AI chat
3. You're ready to build

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
│   │   ├── AgentOrchestrator.ts  — 8 specialized system prompts + phase runner
│   │   └── LLMClient.ts          — Multi-provider LLM client (Gemini/OpenAI/Groq/Azure)
│   └── state/
│       └── ProjectStateManager.ts — State, artifact persistence, context builder
│
└── media/
    └── sidebar.html              — Full sidebar UI (vanilla HTML/CSS/JS)
```

**Key design decision**: The entire sidebar is a single `sidebar.html` file with vanilla JS — no bundler, no React, no build step. Fast to iterate, easy to inspect.

---

## 🛠️ Development

```bash
git clone https://github.com/yourusername/blueprint
cd blueprint
npm install
npm run compile

# Press F5 in VS Code to launch Extension Development Host
```

---

## 🗺️ Roadmap

- [ ] 🤝 VS Code Marketplace publish
- [ ] 📊 Project dashboard — view all `.blueprint/` artifacts in a panel
- [ ] 🌐 URL import — paste a spec doc URL, Blueprint scrapes it
- [ ] 🔄 Phase regeneration with custom instructions
- [ ] 🧩 Custom phase definitions — add your own agents
- [ ] 🚀 Direct Copilot/Antigravity file injection via `github.copilot.chat.attachFile`

---

## 📄 License

MIT © 2024 Blueprint Contributors

---

<div align="center">

**Built with obsessive attention to developer experience.**

*Blueprint doesn't write your code. It makes sure you know exactly what to build — before you write a single line.*

</div>
