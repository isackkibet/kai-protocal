from langchain_ollama.llms import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from vector import retriever
import os
from dotenv import load_dotenv

load_dotenv()

# Fast local Ollama model
model = OllamaLLM(
    model=os.getenv("OLLAMA_LLM_MODEL", "qwen3:1.7b"),
    base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
    num_predict=512,
    think=False,
)

template = """
You are KAI, an expert advisor for the KAI Nuvari DeFi ecosystem on Avalanche C-Chain.

Use the following retrieved context to answer the user's question:

{reviews}

User question:
{question}

Answer concisely, accurately, and only use the context when it is relevant.
"""

prompt = ChatPromptTemplate.from_template(template)
chain = prompt | model


def main():
    print("\n========================================")
    print("        KAI Nuvari AI Agent")
    print("========================================")
    print("Fast RAG + Ollama (Qwen3 1.7B)")
    print("Type 'q' to quit.\n")

    while True:
        question = input("You: ").strip()

        if question.lower() == "q":
            print("Goodbye!")
            break

        if not question:
            continue

        try:
            print("\n🔎 Searching KAI knowledge base...")

            reviews = retriever.invoke(question)

            print("✓ Relevant context retrieved")
            print("🧠 KAI is analyzing and responding...\n")
            print("KAI: ", end="", flush=True)

            # Stream the answer so the user sees it immediately
            for chunk in chain.stream({
                "reviews": reviews,
                "question": question,
            }):
                print(chunk, end="", flush=True)

            print("\n")

        except Exception as e:
            print(f"\n❌ Error: {e}")
            print(
                "Check that Ollama is running and your RAG retriever "
                "is available.\n"
            )


if __name__ == "__main__":
    main()