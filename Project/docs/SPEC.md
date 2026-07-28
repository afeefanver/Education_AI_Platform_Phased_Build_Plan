# Education AI Platform — Technical Build Specification

Owner: Afeef Anver Sha (Afifu) — MIS Data Automate LLP
Purpose: hand this file to Claude Code / Cursor as the seed spec for a new repo.
Companion doc: `Education_AI_Platform_Phased_Build_Plan.docx` (sequencing/timeline — read this file first for *what* to build and *how*, that doc for *in what order*).

---

## 0. Ground rules for the coding agent

- Target deploy environment: **CPU-only server** (no GPU assumed). All LLM calls go through **Ollama**, running locally.
- Use **FastAPI** (async) for every backend service, **Postgres** via `asyncpg`/SQLAlchemy async, **Redis** for caching + queues, **ChromaDB** for embeddings, **React** (Vite) for both frontends.
- Every service is a separate FastAPI app under `services/`. Do not merge them into a monolith.
- Multi-tenant from day one: every table has a `school_id` (or `org_id`) column; every ChromaDB collection is namespaced per org (`{org_id}_{subject_id}`). No cross-tenant data leakage, ever — this is a hard constraint, not a nice-to-have.
- Auth: JWT, role-based (`student`, `teacher`, `admin`). Every endpoint declares required role(s).
- Fail-open credits system: if the credits/billing check itself errors, allow the request and log it — never hard-block a user because the billing service hiccupped.
- Write tests alongside each module (pytest for backend). Don't wait until the end.
- Use environment variables for all config (`.env`, never hardcoded). Provide `.env.example`.

---

## 1. Tech Stack

| Layer | Choice |
|---|---|
| Backend framework | FastAPI (Python 3.11+), async |
| LLM runtime | Ollama (local), model TBD per module — see §5 |
| Vector store | ChromaDB, per-org/per-subject collections |
| Relational DB | PostgreSQL 15+, SQLAlchemy 2.0 async + Alembic migrations |
| Cache/queue | Redis 7+ (cache) + Celery or RQ (background jobs) |
| Frontend | React 18 + Vite, TypeScript, Tailwind |
| Object storage | S3-compatible (MinIO for local/dev) |
| PDF generation | WeasyPrint or ReportLab (question papers, hall tickets) |
| OCR | Tesseract or PaddleOCR (answer-sheet evaluation) |
| Auth | JWT (python-jose), bcrypt for passwords |
| Containerization | Docker + docker-compose (dev), same as MISVector |

---

## 2. Repository Structure

```
edu-platform/
├── apps/
│   ├── student-web/
│   └── teacher-web/
├── services/
│   ├── api-gateway/
│   ├── rag-engine/
│   ├── analytics-engine/
│   ├── quiz-engine/
│   ├── question-paper-gen/
│   ├── scheduling-engine/
│   └── evaluation-engine/
├── workers/
├── packages/
│   ├── shared-models/      # Pydantic schemas + SQLAlchemy models, shared
│   └── shared-ui/
├── infra/
│   ├── docker-compose.yml
│   └── migrations/
└── docs/
    └── SPEC.md             # this file
```

Each `services/*` folder: `main.py`, `routes/`, `models/`, `schemas/`, `core/` (config, security), `tests/`.

---

## 3. Data Model (Postgres — core tables)

```sql
-- Tenancy & identity
organizations(id, name, plan_tier, credits_balance, created_at)
users(id, org_id, email, password_hash, role, full_name, created_at)
students(user_id FK, org_id, class, section, roll_number)
teachers(user_id FK, org_id, subjects_taught[])

-- Curriculum
subjects(id, org_id, name, class_level)
syllabus_units(id, subject_id, unit_name, order_index)
syllabus_docs(id, subject_id, file_path, uploaded_by, uploaded_at)

-- Notes & tutor
notes(id, subject_id, unit_id, type ENUM(detailed, exam, revision, last_minute, cheat_sheet), content, generated_at)
tutor_sessions(id, student_id, subject_id, mode ENUM(beginner, standard, interview), created_at)
tutor_messages(id, session_id, role, content, created_at)

-- PYQ & prediction
pyq_papers(id, subject_id, year, file_path)
pyq_questions(id, pyq_paper_id, unit_id, question_text, marks, bloom_level)
topic_weightage(id, subject_id, unit_id, frequency_score, last_computed_at)
exam_predictions(id, subject_id, exam_date, predicted_questions JSONB, confidence_score)

-- Quiz
quiz_questions(id, subject_id, unit_id, type ENUM(mcq, true_false, fill_blank), question_text, options JSONB, correct_answer, difficulty)
quiz_attempts(id, student_id, quiz_id, score, answers JSONB, completed_at)

-- Question paper generation
question_papers(id, subject_id, exam_type, total_marks, pattern JSONB, generated_file_path, created_by, created_at)

-- Student analytics
student_performance(id, student_id, subject_id, avg_score, weak_units JSONB, strong_units JSONB, updated_at)
study_plans(id, student_id, exam_date, daily_schedule JSONB, created_at)

-- Teacher portal: scheduling
hall_tickets(id, student_id, exam_id, qr_code, file_path)
exams(id, org_id, subject_id, exam_date, duration_minutes)
seating_arrangements(id, exam_id, room_id, layout JSONB)          -- layout maps seat -> student_id
rooms(id, org_id, name, capacity, rows, columns)
timetables(id, org_id, class_level, term, schedule JSONB)
invigilation_duty(id, exam_id, teacher_id, room_id)

-- Evaluation
answer_sheets(id, student_id, exam_id, scanned_file_path, ocr_text, uploaded_at)
evaluations(id, answer_sheet_id, question_id, marks_awarded, ai_confidence, teacher_reviewed BOOLEAN)
```

Notes for the agent:
- All `JSONB` fields above need a documented shape — define Pydantic schemas for each before writing the migration, not after.
- `seating_arrangements.layout` must enforce the "no adjacent roll numbers" constraint at write-time, not just at generation-time — validate on save too.

---

## 4. API Contracts (representative — expand per service)

### api-gateway
```
POST   /auth/login                  -> {access_token, refresh_token}
POST   /auth/refresh
GET    /me
```

### rag-engine
```
POST   /syllabus/upload             {subject_id, file}           -> {syllabus_doc_id, extracted_units[]}
POST   /notes/generate              {unit_id, type}              -> {note_id, content}
POST   /tutor/message                {session_id, message, mode} -> {reply, sources[]}
GET    /tutor/sessions/{student_id}
```

### quiz-engine
```
POST   /quiz/generate               {unit_id, count, difficulty} -> {quiz_id, questions[]}
POST   /quiz/submit                 {quiz_id, student_id, answers[]} -> {score, breakdown[]}
```

### analytics-engine
```
POST   /pyq/upload                  {subject_id, year, file}
GET    /pyq/weightage/{subject_id}
POST   /prediction/generate         {subject_id, exam_date}      -> {predicted_questions[], confidence}
GET    /analytics/student/{student_id}
```

### question-paper-gen
```
POST   /paper/generate    {subject_id, pattern, total_marks}     -> {paper_id, file_url}
```

### scheduling-engine
```
POST   /seating/generate  {exam_id, rooms[]}                     -> {arrangement_id, layout}
POST   /timetable/generate {class_level, term, constraints}      -> {timetable_id, schedule}
POST   /invigilation/assign {exam_id}                            -> {assignments[]}
```

### evaluation-engine
```
POST   /answer-sheet/upload {student_id, exam_id, file}          -> {answer_sheet_id, ocr_status}
POST   /evaluate            {answer_sheet_id}                    -> {evaluations[], flagged_for_review[]}
```

Fill in error responses, pagination, and auth requirements per route before implementation — this is a starting contract, not the final one.

---

## 5. Module-by-Module Functional Notes

**AI note generator** — inputs: unit + note type. Output must be structured (headings, bullet points), not a wall of text. Cache generated notes; regenerate only on syllabus change.

**AI tutor chat** — RAG over syllabus + notes, namespaced per subject. Three modes change *system prompt tone*, not retrieval logic: beginner (simple language, analogies), standard, interview-oriented (concise, exam-focused).

**PYQ analysis / exam prediction** — **not an LLM task.** Compute topic frequency via simple counting/statistics across `pyq_questions` grouped by `unit_id`. Prediction = weighted scoring (recency + frequency), optionally an LLM pass at the end only to phrase the summary, not to "guess" questions.

**Quiz engine** — LLM generates candidate questions from notes/syllabus; validate structurally (correct option present, no duplicate options) before saving.

**Question paper generator** — take a "pattern" (e.g., 2×10 marks, 5×5 marks, 10×2 marks) and fill it from `quiz_questions`/`pyq_questions` matching Bloom level and marks, not free-generate from scratch each time — reuse a vetted question bank first, generate net-new only to fill gaps.

**Seating arrangement / timetable / invigilation** — treat as constraint satisfaction (consider `python-constraint` or OR-Tools), not an LLM prompt. Constraints: no two adjacent seats share a roll-number-prefix; no teacher double-booked; room capacity respected.

**Answer-sheet evaluation** — OCR first (flag low-confidence scans for manual review before AI marking even runs), then LLM-assisted marking against an answer key, always producing a `teacher_reviewed` flag — never auto-finalize a grade without a review step in v1.

---

## 6. Non-Functional Requirements

- CPU-only inference: keep model sizes practical (7B-class quantized models, matching what's already validated in MISVector — re-run a comparative eval before committing to one model per module, since needs differ, e.g. tutoring vs. structured quiz generation).
- Multi-tenancy and data isolation are non-negotiable — write a test that explicitly asserts org A cannot query org B's data, for every service.
- Every long-running job (video summaries, bulk hall tickets, OCR) goes through the worker queue, never blocks the request thread.

---

## 7. Environment Setup

Provide in repo root:
- `.env.example` — DB URL, Redis URL, Ollama host, JWT secret, S3/MinIO creds
- `infra/docker-compose.yml` — postgres, redis, chromadb, minio, ollama, all services
- `README.md` — one-command dev bootstrap (`docker-compose up`, migration command, seed script)

---

## 8. Build Order

Follow the phase order in `Education_AI_Platform_Phased_Build_Plan.docx` (Foundation → Core Learning Loop → Analytics → Teacher Portal v1 → Teacher Portal v2 → Advanced AI → Planner/Polish). Do not start Teacher Portal v2 (seating/invigilation) before the core data model and auth are stable — it depends on `exams`, `rooms`, and `teachers` tables being final.
