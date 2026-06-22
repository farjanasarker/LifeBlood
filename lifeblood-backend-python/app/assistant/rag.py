import os

from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_community.vectorstores import Chroma
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.assistant.prompt import SYSTEM_PROMPT_TEMPLATE
from app.config import CHROMA_PERSIST_DIR, EMBEDDING_MODEL, GROQ_API_KEY, GROQ_MODEL

KNOWLEDGE_BASE_DIR = os.path.join(os.path.dirname(__file__), "knowledge_base")
RETRIEVAL_K = 4

_embeddings: HuggingFaceEmbeddings | None = None
_vectorstore: Chroma | None = None
_llm: ChatGroq | None = None


def _get_embeddings() -> HuggingFaceEmbeddings:
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
    return _embeddings


def _build_vectorstore(embeddings: HuggingFaceEmbeddings) -> Chroma:
    loader = DirectoryLoader(
        KNOWLEDGE_BASE_DIR,
        glob="*.md",
        loader_cls=TextLoader,
        loader_kwargs={"encoding": "utf-8"},
    )
    documents = loader.load()
    splitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=80)
    chunks = splitter.split_documents(documents)
    return Chroma.from_documents(chunks, embeddings, persist_directory=CHROMA_PERSIST_DIR)


def _get_vectorstore() -> Chroma:
    global _vectorstore
    if _vectorstore is not None:
        return _vectorstore

    embeddings = _get_embeddings()
    if os.path.isdir(CHROMA_PERSIST_DIR) and os.listdir(CHROMA_PERSIST_DIR):
        _vectorstore = Chroma(persist_directory=CHROMA_PERSIST_DIR, embedding_function=embeddings)
    else:
        _vectorstore = _build_vectorstore(embeddings)
    return _vectorstore


def _get_llm() -> ChatGroq:
    global _llm
    if _llm is None:
        if not GROQ_API_KEY:
            raise RuntimeError("The assistant is not configured yet. Please contact support.")
        _llm = ChatGroq(api_key=GROQ_API_KEY, model=GROQ_MODEL, temperature=0.3)
    return _llm


def _retrieve_context(query: str) -> str:
    docs = _get_vectorstore().similarity_search(query, k=RETRIEVAL_K)
    if not docs:
        return "No matching guideline content found."
    return "\n\n".join(doc.page_content for doc in docs)


def _format_user_profile(profile: dict | None) -> str:
    if not profile:
        return "Not provided."
    parts = [f"{key}: {value}" for key, value in profile.items() if value]
    return "\n".join(parts) if parts else "Not provided."


def _build_messages(query: str, profile: dict | None, history: list[dict] | None) -> list[BaseMessage]:
    system_content = SYSTEM_PROMPT_TEMPLATE.format(
        retrieved_chunks=_retrieve_context(query),
        user_profile=_format_user_profile(profile),
    )
    messages: list[BaseMessage] = [SystemMessage(content=system_content)]

    for turn in history or []:
        content = (turn.get("content") or "").strip()
        if not content:
            continue
        if turn.get("role") == "assistant":
            messages.append(AIMessage(content=content))
        else:
            messages.append(HumanMessage(content=content))

    messages.append(HumanMessage(content=query))
    return messages


def get_answer(query: str, profile: dict | None = None, history: list[dict] | None = None) -> str:
    llm = _get_llm()
    messages = _build_messages(query, profile, history)
    response = llm.invoke(messages)
    return response.content
