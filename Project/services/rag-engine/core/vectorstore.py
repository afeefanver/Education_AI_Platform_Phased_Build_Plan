"""ChromaDB VectorStore manager for RAG Engine."""

import logging
from typing import Any

from core.config import settings

logger = logging.getLogger(__name__)

try:
    import chromadb
    from chromadb.config import Settings as ChromaSettings
except ImportError:
    chromadb = None


class VectorStoreManager:
    """Namespaces ChromaDB collections per organization and subject."""

    def __init__(self) -> None:
        self._client: Any = None
        self._memory_store: dict[str, list[dict]] = {}

    def _get_client(self) -> Any:
        if self._client is None and chromadb is not None:
            try:
                self._client = chromadb.HttpClient(
                    host=settings.chroma_host,
                    port=settings.chroma_port,
                    settings=ChromaSettings(anonymized_telemetry=False),
                )
            except Exception as e:
                logger.warning(f"Could not connect to ChromaDB host {settings.chroma_host}:{settings.chroma_port}: {e}")
                self._client = None
        return self._client

    def _collection_name(self, org_id: str, subject_id: str) -> str:
        clean_org = str(org_id).replace("-", "_")
        clean_subj = str(subject_id).replace("-", "_")
        return f"org_{clean_org}_subj_{clean_subj}"

    def add_documents(
        self,
        org_id: str,
        subject_id: str,
        texts: list[str],
        metadatas: list[dict],
        ids: list[str],
    ) -> None:
        name = self._collection_name(org_id, subject_id)
        client = self._get_client()

        if client is not None:
            try:
                collection = client.get_or_create_collection(name=name)
                collection.add(documents=texts, metadatas=metadatas, ids=ids)
                return
            except Exception as e:
                logger.warning(f"ChromaDB add_documents failed, falling back to memory store: {e}")

        # In-memory fallback
        if name not in self._memory_store:
            self._memory_store[name] = []
        for doc_id, text, meta in zip(ids, texts, metadatas, strict=False):
            self._memory_store[name].append({"id": doc_id, "text": text, "metadata": meta})

    def query(
        self,
        org_id: str,
        subject_id: str,
        query_text: str,
        top_k: int = 3,
    ) -> list[dict]:
        name = self._collection_name(org_id, subject_id)
        client = self._get_client()

        if client is not None:
            try:
                collection = client.get_or_create_collection(name=name)
                results = collection.query(query_texts=[query_text], n_results=top_k)
                docs = results.get("documents", [[]])[0]
                metas = results.get("metadatas", [[]])[0]
                return [{"text": doc, "metadata": meta} for doc, meta in zip(docs, metas, strict=False)]
            except Exception as e:
                logger.warning(f"ChromaDB query failed: {e}")

        # In-memory fallback search
        if name in self._memory_store:
            items = self._memory_store[name]
            return [{"text": item["text"], "metadata": item["metadata"]} for item in items[:top_k]]
        return []


vector_store = VectorStoreManager()
