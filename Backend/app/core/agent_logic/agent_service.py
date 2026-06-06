import asyncio
import logging
from app.core.agent_logic.agent import chat_agent

logger = logging.getLogger(__name__)

_agent = None
_agent_lock = asyncio.Lock()

async def get_agent():

    global _agent

    if _agent is not None:
        return _agent

    async with _agent_lock:
        if _agent is None:
            logger.info("Creating agent (this may take a moment)...")
            _agent = await chat_agent()
            logger.info("Agent created successfully")
        return _agent


async def stop_agent():

    global _agent

    async with _agent_lock:
        if _agent is not None:

            logger.info("Stopping agent")
            _agent = None