# Education AI Platform

Multi-tenant EdTech platform with AI-powered learning (RAG tutor, notes, quizzes) and teacher portal tools.

**Owner:** MIS Data Automate LLP  
**Spec:** [docs/SPEC.md](docs/SPEC.md)

---

## 🚦 Phase Build Status

- **Phase 1 — Foundation**: ✅ **100% Complete (Backend)**
  - JWT Auth, Multi-tenant RBAC (`student`, `teacher`, `admin`), Fail-open credits system.
  - PostgreSQL schema & Alembic migrations (`001_initial_schema`, `002_core_learning`).
  - ChromaDB vector store manager (namespaced `org_{org_id}_subj_{subject_id}`) & Ollama LLM integration.
- **Phase 2 — Core Learning Loop**: 🛠️ **Backend 100% Complete | Frontend UI & Gateway Routing Pending**
  - **Syllabus Intelligence**: PDF upload (`pypdf`), unit/chapter extraction, document storage, and vector indexing.
  - **AI Note Generator**: 5 note formats (`detailed`, `exam`, `revision`, `last_minute`, `cheat_sheet`), database caching & ChromaDB re-indexing.
  - **AI Tutor Chat**: Multi-persona RAG chat (`beginner`, `standard`, `interview`), session state, and source citations.
  - **Quiz Engine v1**: MCQ, True/False, Fill-blank generation, difficulty tiers, auto-grading, and attempt history.
- **Phase 3 — Analytics & Prediction**: ⏳ Pending
- **Phase 4 — Teacher Portal v1**: ⏳ Pending
- **Phase 5 — Teacher Portal v2**: ⏳ Pending
- **Phase 6 — Advanced AI**: ⏳ Pending
- **Phase 7 — Planner & Polish**: ⏳ Pending

---

## ⚡ Quick Start (Dev)

### 1. Copy Environment Config
```bash
cp .env.example .env
```

### 2. Start Infrastructure (Docker)
```bash
docker compose -f infra/docker-compose.yml up -d postgres redis chromadb minio ollama
```

### 3. Setup Python Virtual Environment
```bash
python -m venv .venv

# Windows (PowerShell):
.\.venv\Scripts\activate

# Linux / macOS:
# source .venv/bin/activate

pip install -r requirements.txt
pip install -e packages/shared-models
```

### 4. Run Database Migrations & Seed Demo Data
```bash
# Run migrations
cd infra/migrations
alembic upgrade head
cd ../..

# Seed initial orgs, users, subjects, and sample data
python scripts/seed.py
```

### 5. Running Microservices

Start each service in a separate terminal:

```bash
# Terminal 1: API Gateway (Port 8000)
uvicorn services.api-gateway.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: RAG Engine (Port 8001)
uvicorn services.rag-engine.main:app --reload --host 0.0.0.0 --port 8001

# Terminal 3: Quiz Engine (Port 8002)
uvicorn services.quiz-engine.main:app --reload --host 0.0.0.0 --port 8002
```

- **API Gateway Docs**: http://localhost:8000/docs
- **RAG Engine Docs**: http://localhost:8001/docs
- **Quiz Engine Docs**: http://localhost:8002/docs

---

## 🔑 Demo Credentials (After Seed)

| Role    | Email               | Password   |
|---------|---------------------|------------|
| Admin   | admin@demo.school   | demo1234   |
| Teacher | teacher@demo.school | demo1234   |
| Student | student@demo.school | demo1234   |

---

## 🧪 Running Tests

Run unit tests for each service using pytest:

```bash
# API Gateway Tests
$env:PYTHONPATH="services/api-gateway;packages/shared-models/src"; .\.venv\Scripts\pytest services/api-gateway/tests

# RAG Engine Tests
$env:PYTHONPATH="services/rag-engine;packages/shared-models/src"; .\.venv\Scripts\pytest services/rag-engine/tests

# Quiz Engine Tests
$env:PYTHONPATH="services/quiz-engine;packages/shared-models/src"; .\.venv\Scripts\pytest services/quiz-engine/tests
```

---

## 📁 Repository Layout

```
edu-platform/
├── apps/
│   ├── student-web/          # React frontend (Student Hub, Tutor, Quizzes)
│   └── teacher-web/          # React frontend (Teacher Portal)
├── services/
│   ├── api-gateway/          # FastAPI Gateway — Auth, Users, Credits (Port 8000)
│   ├── rag-engine/           # FastAPI RAG Engine — Syllabus, Notes, Tutor Chat (Port 8001)
│   └── quiz-engine/          # FastAPI Quiz Engine — Quiz Gen, Grading, History (Port 8002)
├── packages/
│   └── shared-models/        # Shared SQLAlchemy models & Pydantic schemas
├── infra/
│   ├── docker-compose.yml    # Postgres, Redis, ChromaDB, MinIO, Ollama
│   └── migrations/           # Alembic database migrations
├── scripts/
│   └── seed.py               # Database seed script
└── docs/
    └── SPEC.md               # Technical specification document
```

