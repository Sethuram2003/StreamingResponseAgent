import asyncio
from langchain.agents import create_agent
from langchain_ollama import ChatOllama
from langchain_mcp_adapters.client import MultiServerMCPClient  

from app.core.agent_logic.prompt import SYSTEM_PROMPT

async def chat_agent() -> str:

    llm = ChatOllama(model="llama3.1:8b")
    
    client = MultiServerMCPClient()   
         
    tools = await client.get_tools()

    agent = create_agent(
            llm,
            tools=tools,
            system_prompt=SYSTEM_PROMPT
        )

    return agent
