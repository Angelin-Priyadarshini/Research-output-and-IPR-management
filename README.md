# Unified Research Output and IPR Management Portal

## Overview

The **Unified Research Output and IPR Management Portal** is a comprehensive, enterprise-grade platform designed exclusively to handle the rigorous academic mapping and Intellectual Property generation workflows of modern universities and research institutions.

By unifying two distinct administrative domains—**Research Output Management System (ROMS)** and **Intellectual Property Rights (IPR)** tracking—into a centralized, role-based architecture, this platform eliminates manual reporting redundancies, bridges informational silos, and actively measures institutional innovation metrics in real-time.

## Key Capabilities

*   **Intelligent DOI Scraping**: Natively integrated asynchronous scraping endpoints leverage the Crossref API. Faculty and scholars simply paste a DOI (e.g., `10.1109/LPT...`), and the backend automatically extracts rich metadata (Titles, Authors, Journals, Dates) for frictionless registry mapping.
*   **Dual-Domain Layout**: A meticulously organized glassmorphic interface that visually segments operations into a *Research Hub* for publishing insights and an *IPR Command Center* for patent strategy.
*   **Automated Specification Generation**: The platform eliminates the repetitive administration of Word and PDF patent formatting by relying on `docx` and `jspdf` to auto-compile institutional invention disclosures immediately in the browser.
*   **Hierarchical Review Matrix (RBAC)**: A secure, multi-tier funnel controlling information flow. Students submit theoretical drafts; Mentors review, iterate, and endorse; Institutional Heads of Department (HODs) give final patent filing clearance using a 3-point IP evaluation algorithm.
*   **Dynamic Analytics**: High-level statistical visualization plotting institutional patent generation, journal clustering, and publication density. 

---

## 🛠️ Technology Stack & Core Architecture

The infrastructure employs a decoupled full-stack implementation to strictly separate rendering performance from background database orchestration.

*   **Frontend Ecosystem (React + Vite)**: Housed in `/frontend`. Uses React 19 optimized firmly for Vite's HMR standard. Client-state dynamically maps components through React hooks with specialized libraries for vector iconography (`lucide-react`) and statistical charting (`recharts`).
*   **Backend Ecosystem (Node.js + Express.js)**: Housed in `/backend`. Uses a RESTful architecture bound with JWT authorization middleware to securely negotiate all HTTP interactions.
*   **Relational Database (SQLite)**: Utilizing `sqlite3` under Node natively. It automatically creates lightweight structured schema paths to host users, journal archives, proceeding logs, and patent disclosure logic cleanly. It requires zero configuration.

---

## ⚙️ Initial Deployment Walkthrough

To execute the system on a local development tier, two parallel terminal environments are necessary to boot the client and the API gateway simultaneously. 

### Step 1: Initialize the API Backend
Open your terminal and mount into the backend directory.
```bash
cd backend

# Execute package synchronization
npm install

# Boot the Express Server & trigger automated SQLite database seeding
node server.js
```
> *Expected Result*: The backend actively listens on `http://localhost:5000` and creates the `research.db` file, immediately injecting several mock administrative accounts and research metrics.

### Step 2: Initialize the Client Frontend
Launch a second terminal at the root path and mount into the frontend directory.
```bash
cd frontend

# Execute package synchronization
npm install

# Launch the accelerated Vite compiler proxy
npm run dev
```
> *Expected Result*: The frontend environment binds locally on `http://localhost:5173` rendering the authentication portal.

---

## 🔐 Administrative Simulation Parameters

The initial database seed generates pre-configured roles. You may authenticate the platform utilizing any of the subsequent credentials to simulate specific workflows:

| Internal Role | Hierarchy | Username | Password |
| :--- | :--- | :--- | :--- |
| **HOD** | Tier 3 (Full Administrative Clearances) | `hod` | `password123` |
| **Professor** | Tier 2 (Review, Mentor & Self-Assign) | `professor` | `password123` |
| **Scholar** | Tier 1 (Submission Isolation) | `scholar` | `password123` |
| **Student** | Tier 1 (Submission Isolation) | `student` | `password123` |

---

## Authors & Maintainers

Architected and developed as a premiere academic administration tool. 

* **Maintainer**: Angelin Priyadarshini
* **Repository**: [https://github.com/Angelin-Priyadarshini/Research-output-and-IPR-management](https://github.com/Angelin-Priyadarshini/Research-output-and-IPR-management)
