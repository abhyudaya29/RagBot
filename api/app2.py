import openai
from langchain_community.vectorstores import Chroma
from langchain.schema import StrOutputParser
from langchain.schema.runnable import RunnablePassthrough
from langchain_openai import OpenAIEmbeddings
from langchain_community.llms import OpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.document_loaders import TextLoader, PyPDFLoader, CSVLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
import os
import huggingface_hub
from langchain_huggingface.embeddings import HuggingFaceEmbeddings
from langchain_huggingface import HuggingFaceEndpoint
from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS




app2 = Flask(__name__)
CORS(app2)  # Enable CORS for all routes

huggingface_hub.login(token="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")

# Load the document
loader = PyPDFLoader("animal.pdf")
doc_text = loader.load()

# Split the document into chunks
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=500)
doc = text_splitter.split_documents(doc_text)
embed_hugging_face = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
# Define the embeddings and vectorstore
 #Save to disk
# vectorstore = Chroma.from_documents(
#                      documents=doc,                 # Data
#                      embedding=embeddings,    # Embedding model
#                      persist_directory="./chroma_db_animals_huggingface" # Directory to save data
#                      )

#acces the database
vectorstore_disk = Chroma(
    persist_directory="./chroma_db_animals_huggingface",
    embedding_function=embed_hugging_face)


retriever = vectorstore_disk.as_retriever(search_kwargs={"k": 2})

# Define the language model
llm=HuggingFaceEndpoint(repo_id="mistralai/Mistral-7B-Instruct-v0.3",temperature=0.3)

# Function to format documents
def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

# Define the prompt
prompt = ChatPromptTemplate.from_template("""You are "Ema", an assistant knowledgeable about animals. Your task is to handle inquiries related to animals' law ,acts and overall well-being. Given a question input, the task of the model is to identify relevant keywords, sentences, phrases in the question and retrieve corresponding answers from the knowledge base. The model should analyze the input question, extract key terms, and search for similar or related questions in the knowledge base. The output should provide the answers associated with the identified keywords or closely related topics. The model should understand the context of the question, identify relevant keywords, phrases and sentences, and retrieve information from the knowledge base based on these keywords. It should be able to handle variations in question phrasing and retrieve accurate answers accordingly with generative answers like a chatbot answers to the user's query. Do not show "relevant keyword fetched" in the answer, simply answer the questions in an intelligent manner.


Context:
{context}

Question:
{question}""")

rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

# Function to generate response
def gen_response(question):
    if question.lower() in ["hi", "hi!", "hello", "hello!"]:
        return "Hello! How can I assist you today?"

    answer = rag_chain.invoke(question)
    return answer


@app2.route('/api/query', methods=['POST'])
def query():
    data = request.json
    question = data.get('question', '')
    response = gen_response(question)
    return jsonify({"response": response})

if __name__ == '__main__':
    app2.run(port=8000, debug=True)
