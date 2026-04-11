# ⬟ Blueprint Real-World Case: EA Policy Navigator

This document transforms the "EA Policy" business narrative into a high-fidelity **"Elite Requirement"**. Use this input to demonstrate how Blueprint handles complex corporate governance, multi-domain policies, and high-ROI operational problems.

---

## 🎯 The "Elite" Input (Copy-Paste)

Copy the entire block below into the Blueprint sidebar to begin the 8-phase generation.

### Project: **"EA Policy Navigator — Intelligent RAG Assistant"**

**The Brief**:
> "We are building the **EA Policy Navigator**, an intelligent enterprise assistant designed to eliminate operational friction caused by policy complexity. 
>
> **The Problem**: Our PnC (People & Culture) team currently manually processes ~1,000 queries per month spanning payroll, safety, and risk management. This complexity slows down 'time to competency' for new starters and creates a burden for people leaders.
>
> **Functional Requirements**:
> 1. **Multi-Domain Policy RAG**: The assistant must provide a single source of truth across three distinct domains:
>    - **People & Culture** (Leave, Remuneration, D&I).
>    - **Risk & Compliance** (Retail Risk, Whistleblowing, Modern Slavery).
>    - **Operations & Safety** (Travel, Drugs & Alcohol, Procurement).
> 2. **Process Orchestration**: It must be able to guide a user through a workflow (e.g., 'How do I submit a travel request?' or 'What is the procurement limit for my level?').
> 3. **High-Accuracy Citation**: Every response MUST cite the specific policy document, section, and date to ensure employee confidence.
> 4. **Ticketing Integration**: If the AI cannot resolve a query after 2 attempts, it must offer to 'Draft a Ticket' for the PnC Advisory team.
> 5. **Admin Insight Dashboard**: A view for leaders to see 'Policy Hotspots' (which policies are confusing employees most often).
>
> **Technical & Business Guardrails**:
> - **Build Level**: PRODUCTION (Emphasis on security, accuracy, and audit logs).
> - **Tech Stack**: **React** (UI) and **FastAPI** (API). Use a Vector Database (like Pinecone or Qdrant) for the policy embeddings.
> - **Authentication**: Mandatory OIDC/SSO integration to ensure employees only see policies relevant to their role and region."

---

## 💡 Demo "Pro Tips" for the EA Squad

When showcasing this build tomorrow (Feb 17th), focus on these three things:

### 1. Show the "Gap Analysis" (Phase 2 & 7)
Wait for Phase 2 (Scope) to finish. Point out the **Intelligent Capabilities** Blueprint suggested. A great one for EA would be: *"Policy Decay Detection: Flagging policies that haven't been accessed or updated in 12 months."*

### 2. The Logic of Accuracy (Phase 4)
In Phase 4 (Contract), show the `/query` endpoint. Point out how Blueprint included `source_metadata` and `confidence_score` in the response schema. This shows the audience that the assistant is **reliable**, not just chatty.

### 3. Rapid Scaffolding (Phase 8)
After approving Phase 8, you will have a master brief that builds the **Front/Backend separation** perfectly. You can honestly tell the squad: *"We used Blueprint to go from a PnC policy problem to a production-ready system architecture in 15 minutes."*

---

<div align="center">
**EA — Improving Operational Efficiency through Intelligent Context.**
</div>
