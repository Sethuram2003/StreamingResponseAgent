import asyncio
import logging
from dotenv import load_dotenv
load_dotenv()

from app.core.agent_logic.agent import chat_agent
from app.core.agent_logic.deep_agent import deep_chat_agent

logger = logging.getLogger(__name__)

_agents: dict[str, object | None] = {
    "single": None,
    "deep": None,
}
_agent_lock = asyncio.Lock()


async def get_agent(agent_type: str = "single"):
    """Return a cached agent of the requested type.

    Supported types:
      - "single": standard LangChain tool-calling agent.
      - "deep": deepagents coordinator with sub-agents.
    """
    agent_type = agent_type if agent_type in _agents else "single"

    if _agents[agent_type] is not None:
        return _agents[agent_type]

    async with _agent_lock:
        if _agents[agent_type] is not None:
            return _agents[agent_type]

        logger.info("Creating %s agent (this may take a moment)...", agent_type)
        if agent_type == "deep":
            _agents["deep"] = await deep_chat_agent()
        else:
            _agents["single"] = await chat_agent()
        logger.info("%s agent created successfully", agent_type.capitalize())
        return _agents[agent_type]


async def stop_agents():
    """Clear cached agents during application shutdown."""
    global _agents

    async with _agent_lock:
        logger.info("Stopping agents")
        _agents = {"single": None, "deep": None}
