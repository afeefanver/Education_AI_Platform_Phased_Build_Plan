# Education AI Platform

Multi-tenant EdTech platform with AI-powered learning (RAG tutor, notes, quizzes) and teacher portal tools.

**Owner:** MIS Data Automate LLP  
**Spec:** [docs/SPEC.md](docs/SPEC.md)

## Quick start (dev)

```bash
# 1. Copy environment config
cp .env.example .env

# 2. Start infrastructure
docker compose -f infra/docker-compose.yml up -d postgres redis chromadb minio ollama

# 3. Create Python venv and install dependencies
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt
pip install -e packages/shared-models

# 4. Run migrations
cd infra/migrations && alembic upgrade head && cd ../..

# 5. Seed demo data
python scripts/seed.py

# 6. Start API gateway
cd services/api-gateway
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/docs

## Demo credentials (after seed)

| Role    | Email              | Password   |
|---------|--------------------|------------|
| Admin   | admin@demo.school  | demo1234   |
| Teacher | teacher@demo.school| demo1234   |
| Student | student@demo.school| demo1234   |

## Repository layout

```
edu-platform/
├── apps/              # React frontends (Phase 2+)
├── services/          # FastAPI microservices
├── packages/          # Shared Python/TS packages
├── workers/           # Background job workers
├── infra/             # Docker, migrations
└── docs/              # Specifications
```

## Build phases

1. **Foundation** — auth, data layer, RAG pipeline *(current)*
2. **Core Learning Loop** — syllabus, notes, tutor, quiz
3. **Analytics** — PYQ, prediction, student dashboard
4. **Teacher Portal v1** — question papers, hall tickets, timetables
5. **Teacher Portal v2** — seating, invigilation
6. **Advanced AI** — voice tutor, video summaries, answer-sheet eval
7. **Planner & Polish** — study planner, adaptive learning, QA
