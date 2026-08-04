"""LLM wrapper (Ollama with template generator fallback)."""

import logging

import httpx

from core.config import settings
from shared_models.schemas import NoteType, TutorMode

logger = logging.getLogger(__name__)


class LLMService:
    def __init__(self) -> None:
        self.ollama_url = f"{settings.ollama_host}/api/generate"

    async def _call_ollama(self, prompt: str, system: str = "") -> str | None:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    self.ollama_url,
                    json={
                        "model": "llama3",
                        "prompt": prompt,
                        "system": system,
                        "stream": False,
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("response", "").strip()
        except Exception as e:
            logger.warning(f"Ollama call failed ({self.ollama_url}): {e}")
        return None

    async def generate_notes(self, unit_name: str, note_type: NoteType, context: str = "") -> str:
        system = "You are an expert AI Educator generating structured study notes."
        prompt = f"Generate {note_type.value} study notes for the topic '{unit_name}'.\nContext: {context}"

        result = await self._call_ollama(prompt, system=system)
        if result:
            return result

        # Fallback structured notes generator
        titles = {
            NoteType.DETAILED: f"# Detailed Study Notes: {unit_name}\n\n## 1. Overview & Core Concepts\n- Comprehensive introduction to {unit_name}.\n- Key principles and theoretical framework.\n\n## 2. In-Depth Analysis\n- Detailed breakdown of sub-components.\n- Important formulas, diagrams, and definitions.\n\n## 3. Solved Examples & Case Studies\n- Step-by-step problem walkthroughs.\n",
            NoteType.EXAM: f"# Exam-Focused Prep Notes: {unit_name}\n\n## Frequently Asked Exam Questions\n- High-yield topics and key definitions for {unit_name}.\n- Common pitfalls and scoring strategies.\n",
            NoteType.REVISION: f"# Quick Revision Notes: {unit_name}\n\n- Key Summary Point 1: Fundamental rule for {unit_name}.\n- Key Summary Point 2: Essential formula.\n- Key Summary Point 3: Important diagram description.\n",
            NoteType.LAST_MINUTE: f"# Last Minute Review: {unit_name}\n\n- Flash Card 1: What is {unit_name}?\n- Flash Card 2: 3 key facts to memorize before entering the exam.\n",
            NoteType.CHEAT_SHEET: f"# Cheat Sheet: {unit_name}\n\n| Term / Formula | Description | Key Insight |\n|---|---|---|\n| Core Concept | Main definition of {unit_name} | Essential for Section A |\n",
        }
        return titles.get(note_type, f"# Notes for {unit_name}\n\nContent overview for {unit_name}.")

    async def generate_tutor_reply(self, message: str, mode: TutorMode, context: list[str]) -> str:
        retrieved_context = "\n---\n".join(context) if context else "No extra syllabus context."
        
        personas = {
            TutorMode.BEGINNER: "You are a friendly, encouraging AI Tutor. Explain concepts using simple language, real-world analogies, and step-by-step guidance.",
            TutorMode.STANDARD: "You are a balanced, knowledgeable AI Tutor. Provide clear, accurate academic explanations with appropriate technical depth.",
            TutorMode.INTERVIEW: "You are a demanding, interview-focused AI Tutor. Be concise, direct, exam-oriented, and challenge the student to verify their reasoning.",
        }

        system = personas.get(mode, personas[TutorMode.STANDARD])
        prompt = f"Student Question: {message}\n\nSyllabus Context:\n{retrieved_context}\n\nAnswer the student according to your tutor persona."

        result = await self._call_ollama(prompt, system=system)
        if result:
            return result

        # Fallback tutor response
        if mode == TutorMode.BEGINNER:
            return f"Great question! Let's break down your question about '{message}' in simple terms. Imagine it like a puzzle step by step: first, understand the basics, then connect the pieces!"
        elif mode == TutorMode.INTERVIEW:
            return f"Direct Answer regarding '{message}': Focus on the core definition, key mechanisms, and time complexity. Be prepared to justify your trade-offs in exam conditions."
        else:
            return f"Here is the standard academic explanation for '{message}': Based on the syllabus, the core principles involve understanding the primary concepts, structure, and applications."


llm_service = LLMService()
