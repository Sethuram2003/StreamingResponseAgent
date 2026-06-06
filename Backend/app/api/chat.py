from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from app.core.agent_logic.agent_service import get_agent
import json
import logging
from langchain_core.messages import HumanMessage

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/")
async def chat_ai(request: Request):
    """
    POST /chat
    Body: {
        "session_id": "required-thread-id",
        "messages": [{"role": "human", "content": "..."}]
    }
    Returns SSE stream of lightweight, typed events.
    Uses session_id as LangGraph thread_id for persistent chat history.
    """
    body = await request.json()

    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")

    frontend_messages = body.get("messages", [])

    lc_messages = []
    for msg in frontend_messages:
        if msg.get("role") == "human":
            lc_messages.append(HumanMessage(content=msg.get("content", "")))
    if lc_messages:
        lc_messages = [lc_messages[-1]]   

    config = {"configurable": {"thread_id": session_id}}

    async def event_stream():
        try:
            agent = await get_agent()

            async for event in agent.astream_events(
                {"messages": lc_messages},
                config=config,
                version="v2"
            ):
                if await request.is_disconnected():
                    logger.info("Client disconnected – stopping stream")
                    break

                if event["event"] == "on_chat_model_stream":
                    chunk = event["data"]["chunk"]
                    chunk_content = chunk.content or ""
                    if chunk_content:
                        yield f"data: {json.dumps({'event': 'on_chat_model_stream', 'data': {'chunk': {'content': chunk_content}}})}\n\n"

                elif event["event"] == "on_tool_start":
                    tool_name = event["name"]
                    tool_input = event["data"].get("input")
                    run_id = event["run_id"]
                    yield f"data: {json.dumps({'event': 'on_tool_start', 'name': tool_name, 'run_id': run_id, 'data': {'input': tool_input}})}\n\n"

                elif event["event"] == "on_tool_end":
                    run_id = event["run_id"]
                    output = event["data"].get("output")
                    yield f"data: {json.dumps({'event': 'on_tool_end', 'run_id': run_id, 'data': {'output': output}})}\n\n"

                elif event["event"] == "on_tool_error":
                    run_id = event["run_id"]
                    error_msg = event["data"].get("error", "Unknown tool error")
                    yield f"data: {json.dumps({'event': 'on_tool_error', 'run_id': run_id, 'data': {'error': error_msg}})}\n\n"

            yield "data: [DONE]\n\n"

        except Exception as e:
            logger.error(f"Streaming error: {e}", exc_info=True)
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )