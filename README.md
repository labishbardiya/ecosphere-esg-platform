# ecosphere-esg-platform 🌍

## 📌 Overview
Environmental, Social, and Governance (ESG) tracking has become a critical aspect of modern businesses. While traditional ERP systems collect operational data, ESG reporting is often manual and disconnected. 

**EcoSphere** is a centralized platform built to integrate ESG directly into day-to-day ERP operations. It measures sustainability metrics, encourages employee participation through gamification, and provides management with real-time, actionable reports.

---

## 🚀 Core Modules

The platform is structured into four primary modules following a clean MVC architecture:

*   **🌱 Environmental:** Handles carbon accounting, emission factors, sustainability goals, and automated carbon reports.
*   **🤝 Social:** Manages CSR (Corporate Social Responsibility) activities, employee participation tracking, diversity metrics, and engagement.
*   **⚖️ Governance:** Tracks company policies, governance audits, compliance issues, and governance reporting.
*   **🎮 Gamification:** Drives user engagement through sustainability challenges, XP (Experience Points), unlockable badges, rewards, and leaderboards.

---

## 📊 Business Intelligence & Scoring

The application aggregates departmental ESG performance to provide an overall organizational snapshot. 

The **Overall ESG Score** is a weighted average of the Department Total Scores. By default, the calculation is configured as:

$$Overall\ ESG=(0.4\times Environmental)+(0.3\times Social)+(0.3\times Governance)$$

*Note: The weighting distribution is configurable per organization via the settings module.*

---

## 🗄️ Data Model Overview

The system strictly divides data into Master Configuration and Transactional Data to ensure data integrity.

### Master Data
*   **Departments:** Defines the organizational hierarchy and ESG ownership.
*   **Categories:** Shared values for CSR Activities and Challenges.
*   **Emission Factors:** Standardized values used for calculating carbon output.
*   **Gamification Assets:** Badges (with unlock rules) and Rewards (with point requirements and stock limits).

### Transactional Data
*   **Carbon Transactions:** Automated emission calculations stemming from ERP operations.
*   **Employee Participation:** Tracking involvement in CSR Activities and Challenges, requiring proof and approval workflows.
*   **Compliance Issues:** Governance violations logged with an assigned owner, severity, and due date.

---

## ⚙️ Key Business Rules & Workflows

1.  **Automated Emissions:** When enabled, carbon transactions are calculated automatically from linked operational records (Purchasing, Manufacturing, Fleet) using the relevant Emission Factors.
2.  **Evidence-Based Approvals:** CSR Activity participation requires attached proof files before it can be marked as "Approved".
3.  **Dynamic Gamification:** Badges are auto-awarded the moment an employee's XP or completed challenge count satisfies the specific unlock rule[cite: 2]. Employees can redeem their earned points for rewards from the catalog.
4.  **Compliance Accountability:** Every compliance issue must have an assigned Owner and a Due Date. The platform's notification engine flags issues that remain open past their deadline.

---

## 🛠️ Installation & Setup

1. Clone the repository:
   ```bash
   git clone [https://github.com/manishprasad9156/ecosphere-esg-platform.git](https://github.com/manishprasad9156/ecosphere-esg-platform.git)
