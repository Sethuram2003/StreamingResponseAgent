from pathlib import Path
from typing import Any

from langchain_ollama import ChatOllama
from langchain_mcp_adapters.client import MultiServerMCPClient
from deepagents import create_deep_agent

from app.core.agent_logic.prompt import (
    SEARCH_SPECIALIST_PROMPT,
    OFFER_SUMMARY_PROMPT,
    ALTERNATIVES_PROMPT,
)


# Shared Ollama model for all agents.
_MAIN_MODEL = ChatOllama(model="minimax-m2.1:cloud", temperature=0.2)
_SUB_MODEL = ChatOllama(model="minimax-m2.1:cloud", temperature=0.1)

# MCP server configuration for the part-number search tool.
_MCP_SERVER_PATH = Path(
    "/Users/sethuramgauthamr/Documents/Projects/AgenticGenerativeUI/PartNumberMCP/main.py"
)


async def _get_mcp_tools():
    """Load tools from the configured MCP server."""
    client = MultiServerMCPClient(
        {
            "partnumber_search": {
                "command": "python3",
                "args": [str(_MCP_SERVER_PATH)],
                "transport": "stdio",
            }
        }
    )
    return await client.get_tools()


async def deep_chat_agent():
    """Create a coordinator agent that delegates to procurement sub-agents."""
    tools = await _get_mcp_tools()

    subagents: list[dict[str, Any]] = [
        {
            "name": "search_specialist",
            "description": "Searches real-time pricing, inventory, and specs for an MPN.",
            "system_prompt": SEARCH_SPECIALIST_PROMPT,
            "tools": tools,
            "model": _SUB_MODEL,
        },
        {
            "name": "offer_summary_specialist",
            "description": "Summarizes supplier offers and recommends the best buy.",
            "system_prompt": OFFER_SUMMARY_PROMPT,
            "tools": tools,
            "model": _SUB_MODEL,
        },
        {
            "name": "alternatives_specialist",
            "description": "Suggests alternative parts when stock is unavailable.",
            "system_prompt": ALTERNATIVES_PROMPT,
            "tools": tools,
            "model": _SUB_MODEL,
        },
    ]

    main_agent = create_deep_agent(
        model=_MAIN_MODEL,
        subagents=subagents,  # type: ignore[arg-type]
        tools=tools,
        system_prompt=(
            "You are a procurement coordinator with three specialist sub-agents available as tools: "
            "search_specialist, offer_summary_specialist, alternatives_specialist.\n\n"
            "Rules:\n"
            "1. For ANY part-number, pricing, inventory, or supplier question, call search_specialist.\n"
            "2. After search results are returned, call offer_summary_specialist to summarize and recommend.\n"
            "3. Only call alternatives_specialist when a part is out of stock or a substitute is needed.\n"
            "4. Combine the sub-agent outputs into a concise final answer.\n"
            "5. Never invent part data; always rely on the search tool."
        ),
    )

    return main_agent
