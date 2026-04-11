<div align="center">

# ⬟ Blueprint

### *From idea to complete developer brief — in your VS Code sidebar.*

**Blueprint is a VS Code extension that acts as a team of elite AI agents,** each specializing in one phase of software design. You describe your app, Blueprint runs 8 sequential agents, and you get a battle-checked, fully-commented, one-shot build brief that any developer or AI coding assistant can execute immediately.

[![VS Code](https://img.shields.io/badge/VS%20Code-1.85+-blue?logo=visual-studio-code)](https://code.visualstudio.com/)
[![Version](https://img.shields.io/badge/version-0.4.0-brightgreen)](https://github.com/akdey/Blueprint/raw/main/blueprint-0.4.0.vsix)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![LLM Providers](https://img.shields.io/badge/LLM-Gemini%20%7C%20OpenAI%20%7C%20Groq%20%7C%20Azure%20%7C%20LiteLLM-orange)](https://openai.com)
[![License](https://img.shields.io/badge/license-Proprietary-red)](LICENSE)

</div>

---

## 🚀 Instant Install

**Get Blueprint running in 30 seconds:**

1.  **Download the Extension**: [**Click here to download `blueprint-0.4.0.vsix`**](https://github.com/akdey/Blueprint/raw/main/blueprint-0.4.0.vsix)
2.  **Install in VS Code**: Open VS Code → Extensions (`Ctrl+Shift+X`) → Click the `...` in the top right → **Install from VSIX...** → Select the downloaded file.
3.  **Activate**: Click the ⬟ icon in your Activity Bar.

---

## 🆕 What's New in v0.4.0

| | Feature | Impact |
|---|---|---|
| 🎯 | **Native Custom Models** | **Total Flexibility**: Every provider now has a dedicated "Custom Model ID" textbox in VS Code settings. No more rigid enum constraints. |
| ⚙️ | **Simplified Setup** | The "Open Settings" button now redirects you directly to the native VS Code Settings editor, ensuring your configuration is always visible and secure. |
| 🔌 | **LiteLLM Dropdown** | LiteLLM is now a first-class citizen with its own curated model list and support for any custom local endpoint. |
| 🧠 | **April 2026 Models** | Default support for Gemini 3.1 series, GPT-5.4, Qwen 3 series, and DeepSeek V3/R1. |

---

## 📋 Prerequisites

Before you start, ensure you have:
- **VS Code 1.85+**
- **An Open Workspace**: Blueprint needs a folder to save your `.blueprint/` artifacts.
- **An LLM API Key**: You'll need a key from Gemini, OpenAI, Groq, Azure, or a LiteLLM proxy.
  - *Recommendation*: Use [Gemini 3.1 Pro](https://aistudio.google.com/) for the deepest reasoning and best quality.

---

## 🤔 The Problem

Every developer has been here:

> *"I have a great app idea. Where do I even start?"*

You open an AI chat and describe your idea. You get... a half-baked wireframe, a generic tech stack suggestion, and a code snippet that doesn't actually work together. You spend hours in back-and-forth trying to get the AI to understand your vision.

**Blueprint fixes this at the root.**

---

## ✨ What Blueprint Does

Blueprint runs **8 specialized AI agents** in sequence, each deeply focused on one layer of your application — from brand identity to database schema to the final one-shot build prompt. Every agent **reads every prior phase's approved output**, ensuring nothing is contradictory, nothing is forgotten.

The result: a `08_handoff.md` file that contains **the complete blueprint of your application**. Ready to paste into Antigravity, Copilot, Claude, or hand to a developer. Optionally, run the 9th phase to generate mock data or RAG documents.

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
| **3** | ⬡ **Skeleton** | System architecture, full directory tree, data flow, design patterns |
| **4** | ⬢ **Contract** | Every API endpoint — method, path, validation schemas, auth, error codes |
| **5** | ◉ **Testing** | TDD strategy + executable test patterns (pytest + Vitest + Playwright) |
| **6** | ◈ **Data** | Database ORM models, ER diagram, migration strategy, indexed queries |
| **7** | ◇ **Design** | Component library, CSS/Tailwind tokens, UI/UX, **✨ Wow Factor** |
| **8** | ⬟ **Handoff** | One-shot build brief — all artifacts embedded, step-by-step build order |

---

## 🏆 Flagship Features (The Game Changers)

### 🏗️ Bring Your Own DNA (Standards & Patterns)
Blueprint is the first orchestrator that lets you enforce **your** engineering DNA.
- **Upload your `STANDARDS.md`**: Paste or import your team's specific naming conventions and folder structures.
- **Strike Directive**: Every agent is given a **high-priority instruction** to prioritize your custom guidelines over its default suggestions.

### 🎨 Tech Stack Wizard (Zero Noise)
Blueprint's wizard is **context-aware** and **level-calibrated**:
- **Automatic Multi-Factor Analysis**: After Phase 2 (Scope), Blueprint analyzes your app idea to curate a perfect questionnaire.
- **Build-Level Filtering**: Monoliths for prototypes, modular/microservices for production.
- **Intelligent Recommendations**: Every choice includes a **justification** based on your app type.

### 🧩 Configuration Flexibility (All-New in v0.4.0)
Never be limited by a dropdown again.
- **"Other" Mode**: Select "Other" in any model or version dropdown to activate a dedicated textbox.
- **Universal IDs**: Input experimental Gemini models, tuned OpenAI models, or local LiteLLM model strings directly.
- **Native Settings**: Everything is handled through the VS Code Settings UI for maximum stability and visibility.

---

## 🧠 Cumulative Context = No Contradictions

Every agent receives the **approved, edited output** of every previous phase. The Database agent knows your API contract. The Design agent references your brand colors. The Handoff agent embeds *all of it* inline.

### ✏️ Edit Before Committing
Every generated artifact appears in an **editable textarea** in the sidebar. Change a user story or edit a field name — those changes propagate to every subsequent agent automatically.

---

## 📁 Artifacts Saved to Your Workspace
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
└── 08_handoff.md  (The Ultimate 1-Step Build Prompt)
```

---

## ⚡ Quick Start

1.  **Configure**: Click the **⚙ (Gear)** in the sidebar to open VS Code settings. Enter your API key.
2.  **Setup**: Describe your app, paste any custom standards, and choose a **Build Level**.
3.  **Run**: Execute phases 1-8. Review, edit, and approve each step.
4.  **Invoke Handoff**: Click **🚀 Invoke Handoff** and paste your master prompt into any AI coder to build your app.

---

## 📄 License

© 2024 Amit Dey. All Rights Reserved. Proprietary software.

---

<div align="center">

**Built with obsessive attention to developer experience.**

*Blueprint doesn't write your code. It makes sure you know exactly what to build — before you write a single line.*

</div>
