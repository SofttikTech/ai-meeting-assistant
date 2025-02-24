from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
import os
from fastapi import FastAPI, HTTPException
import uvicorn

from langchain.document_loaders import DirectoryLoader, PyPDFLoader, Docx2txtLoader

def load_documents(data_folder="data"):
    
    documents = []
    
    # Load PDF files using PyPDFLoader
    pdf_loader = DirectoryLoader(data_folder, glob="*.pdf", loader_cls=PyPDFLoader)
    pdf_docs = pdf_loader.load()
    documents.extend(pdf_docs)
    
    # Load DOCX files using Docx2txtLoader
    # docx_loader = DirectoryLoader(data_folder, glob="*.docx", loader_cls=Docx2txtLoader)
    # docx_docs = docx_loader.load()
    # documents.extend(docx_docs)
    
    return documents

def build_vectorstore(documents):
    
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    docs = text_splitter.split_documents(documents)
    
    embeddings = OpenAIEmbeddings(openai_api_key="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")
    vectorstore = FAISS.from_documents(docs, embeddings)
    return vectorstore

app = FastAPI()

print("Loading documents from the 'data' folder...")
docs = load_documents("data")
print(f"Loaded {len(docs)} documents.")

print("Building vector store from documents...")
vectorstore = build_vectorstore(docs)

retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
print("Retriever is ready.")

@app.post("/query/")
async def query_api(payload: dict):
    query_text = payload.get("query")
    if not query_text:
        raise HTTPException(status_code=400, detail="Missing 'query' in the request payload.")
    
    retrieved_docs = retriever.get_relevant_documents(query_text)
    
    results = []
    for doc in retrieved_docs:
        results.append({
            "content": doc.page_content,
            # "metadata": doc.metadata
        })
    
    return {"query": query_text, "results": results}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
