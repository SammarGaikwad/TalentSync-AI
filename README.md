# TalentSync AI ⚡ Enterprise AI-Powered Recruitment Suite

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20TailwindCSS%20v4-blue)](https://react.dev/)
[![Express](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green)](https://expressjs.com/)
[![Inference](https://img.shields.io/badge/Inference-Google%20Gemini%20%2F%20NVIDIA%20NIM-purple)](https://aistudio.google.com/)
[![RAPIDS](https://img.shields.io/badge/Analytics-NVIDIA%20RAPIDS%20cuDF-76b900)](https://rapids.ai/)

---

## 🏆 Hackathon Submission Guide
To review criteria alignment, see our detailed [HACKATHON_SUBMISSION.md](file:///d:/projects/TalentSync%20AI/HACKATHON_SUBMISSION.md) mapping core multi-agent architecture and hardware-cloud synergy.

---

**TalentSync AI** is a premium, high-performance recruitment and talent analytics dashboard designed to ingest candidate CVs, parse competencies, match candidates against job specifications, and orchestrate autonomous multi-agent pipelines. It features state-of-the-art glassmorphic design and hardware-accelerated text preprocessing benchmarks.

---

## ⚡ Core Features

### 📁 Smart Candidate Ingestion
- **Bulk & Single Ingestion:** Upload one or multiple candidate PDF resumes simultaneously.
- **Job Description (JD) Comparison:** Match CV details against a job description (either text or PDF) to generate automated alignment evaluations.
- **Deep Signature Verification:** Verifies PDF magic bytes (`%PDF-`) directly in the file buffer to prevent extension-spoofing and security injection exploits.

### 🧠 Autonomous Multi-Agent Workspace
Orchestrates specialized agent personas to manage recruiter workflows sequentially or in parallel:
- **PlannerAgent:** Analyzes the recruitment mission and dynamically charts execution steps.
- **ScreenerAgent:** Reviews resumes for tech stack alignments, strengths, and candidate gaps.
- **VerificationAgent:** Validates public GitHub activity and LinkedIn work timelines.
- **InterviewerAgent:** Devises highly targeted technical interview challenges based on identified gaps.
- **OutreachAgent:** Drafts personalized email outreach sequences referencing candidate highlights.

### 🚀 NVIDIA GPU-Accelerated Preprocessing
- **NVIDIA RAPIDS (cuDF):** Features a parallel text clean-and-tokenize execution script ([gpu_pipeline.py](file:///d:/projects/TalentSync%20AI/backend/analytics/gpu_pipeline.py)) to process huge batches of resume files in parallel GPU memory.
- **Telemetry Dashboard:** Live tracking of GPU specifications (such as NVIDIA L4 Tensor Core GPU), memory utilization, temperature, VRAM overhead, and CPU vs. GPU benchmark speedup ratios (showing ~14.5x faster string preprocessing).

### ☁️ GCP Data Warehousing
- **GCS Ingestion:** Syncs resume files directly from Google Cloud Storage buckets.
- **BigQuery Warehousing:** Automatically logs evaluated candidates, technical scores, and alignment flags to Google BigQuery datasets.

### 🛡️ Enterprise Security Hardening
- **HTTP Security Headers:** Implemented custom middleware enforcing Helmet-equivalent protections (`X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`).
- **CORS Restrictive Policy:** Rejects requests outside allowed frontend origins.
- **Isolated Rate Limiting:** Closed sliding-window rate limiters prevent endpoint abuse (e.g. 15 uploads/minute for resumes, 60 requests/minute for general APIs).
- **Environment-Only Secrets:** Zero API key storage in databases or frontend code. Credentials (like `GEMINI_API_KEY`) are managed strictly on the server-side via environment variables.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TailwindCSS v4, Lucide Icons, Vite 8, CSS Glassmorphism |
| **Backend** | Node.js, Express, Multer, PDF-Parse, `@google/genai` (SDK) |
| **Analytics & GPU** | Python 3, NVIDIA cuDF, Pandas |
| **Database** | JSON File Database (`data/candidates.json`, `data/settings.json`) |

---

## ⚙️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (v3.10+ if running native GPU telemetry benchmarks)

---

### Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SammarGaikwad/TalentSync-AI.git
   cd TalentSync-AI
   ```

2. **Install Frontend Dependencies:**
   ```bash
   npm install
   ```

3. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```

4. **Set Up Python Virtual Environment:**
   Initialize a virtual environment in the project root:
   ```bash
   cd ..
   python -m venv .venv
   # Activate virtualenv:
   # Windows (Powershell):
   .venv\Scripts\Activate.ps1
   # Linux/macOS:
   source .venv/bin/activate
   # Install dependencies:
   pip install pandas google-cloud-storage google-cloud-bigquery
   ```

5. **Configure Environment Variables:**
   Create a `.env` file in the `backend/` directory:
   ```env
   # backend/.env
   PORT=5000
   GEMINI_API_KEY=your_google_studio_gemini_api_key_here
   NVIDIA_API_KEY=your_optional_nvidia_nim_api_key_here
   ```

---

### Running the Application

For a smooth developer workflow, start both servers in development mode:

1. **Start the Backend Server:**
   ```bash
   cd backend
   npm run dev
   ```
   *Express server will bind to [http://localhost:5000](http://localhost:5000).*

2. **Start the Frontend Dev Server:**
   In a separate terminal tab/window:
   ```bash
   npm run dev
   ```
   *Vite client will bind to [http://localhost:5173](http://localhost:5173) (or next available port) and proxy requests to backend API.*

---

## 🧪 Testing and Quality Control

- **Linting:** Check the code quality standards:
  ```bash
  npm run lint
  ```
- **Production Bundling:** Compile code for production release:
  ```bash
  npm run build
  ```

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
