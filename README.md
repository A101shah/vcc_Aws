# PortalEngine Enterprise | Academic Intelligence & Policy Cockpit

> **Institutional-grade Academic Intelligence & Policy Compliance Platform** for managing course syllabi, continuous assessment schemes, real-time grade simulation, and policy-driven grading rubrics.

---

## 🌟 Key Features

### 1. Executive Academic Cockpit
- Real-time student academic status, GPA tracking, and policy compliance verification.
- Honors List tracker (`Dean's Honor Roll`), NAAC A++ / ABET compliance standards.
- Deep glassmorphism interface with dark mode aesthetics and micro-animations.

### 2. Institutional Course Policy & Evaluation Schemes
- **Standard Collegiate Scheme (100 Marks Total Availability)**:
  - **50% Internal Continuous Assessment (ICA)**: Formed by internal components (Class Tests 1 & 2, Term Work, Practical Labs, Mini Projects, Attendance).
  - **50% Term End Examination (TEE)**: Terminal university/college examination.
- Automated passing threshold tracking (`≥ 40% (Grade D)` across ICA components).

### 3. PDF Syllabus Policy Extractor & Ingestion Engine
- Ingest institutional syllabus PDFs in one click.
- Automatically extracts course titles, codes, semester, faculty, and parses complex multi-unit assessment breakdown tables.
- Standard presets for quick course initialization.

### 4. Desired Grade & What-If Matrix Simulator
- 4-Column Subject Matrix table:
  - **ICA / Assessment Component**: Categorized by scope (`ICA` vs `TEE`), weight, and evaluation type.
  - **Achieved Marks (Real)**: Verified marks earned so far with live percentage badges.
  - **Desired Marks (What-If)**: Interactive numeric inputs and range sliders for upcoming assessments.
  - **Desired Grade & Possible Realistic Grade**: Real-time mathematical feasibility solver (`Realistic & Feasible`, `High Focus Required`, `Mathematically Unreachable`).
- **`⚡ Auto-Fill Required Marks`**: One-click solver that calculates the exact minimum scores needed on remaining exams to hit the target grade.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript
- **Styling**: Modern Vanilla CSS Design System with Glassmorphism
- **Build Tool**: Vite 8
- **PDF Engine**: PDF.js (`pdfjs-dist`) with client-side Web Worker parsing
- **Icons**: Lucide React

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/A101shah/vcc_Aws.git

# Navigate to project directory
cd vcc_Aws

# Install dependencies
npm install

# Start local development server
npm run dev
```

The application will be live at `http://localhost:5173`.

### Production Build

```bash
# Type check and build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 📄 License
MIT License. Developed for Institutional Academic Intelligence.
