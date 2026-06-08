from langchain.agents import create_agent
from langchain_ollama import ChatOllama
from langchain_mcp_adapters.client import MultiServerMCPClient  
from langgraph.checkpoint.memory import InMemorySaver

from app.core.agent_logic.prompt import SYSTEM_PROMPT

async def chat_agent() -> str:

    llm = ChatOllama(model="gemma4:12b")
    
    client = MultiServerMCPClient(
        {
            "partnumber_search": {
                "command": "python3",
                "args": ["/Users/sethuramgauthamr/Documents/Projects/AgenticGenerativeUI/PartNumberMCP/main.py"],
                "transport": "stdio"
            }
        }
    )

         
    tools = await client.get_tools()

    checkpointer = InMemorySaver()

    agent = create_agent(
            llm,
            tools=tools,
            system_prompt=SYSTEM_PROMPT,
            checkpointer=checkpointer
        )

    return agent
