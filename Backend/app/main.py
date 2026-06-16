from dotenv import load_dotenv
load_dotenv()

import logging
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI

from app.core.agent_logic.agent_service import get_agent, stop_agents
from app.api.chat import router as chat
from app.api.healthcheck import router as healthcheck

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    
    await get_agent("single")
    await get_agent("deep")

    logger.info("Agent startup completed")

    logger.info("Application startup initialized")

    yield

    await stop_agents()
    
    logger.info("Agent shutdown completed")

    logger.info("Application shutdown")
    

app = FastAPI(
    title="Streaming Response",
    description="API for Streaming Responses",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat)
app.include_router(healthcheck)