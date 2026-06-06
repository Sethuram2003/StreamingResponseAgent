from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/", status_code=200)
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "message": "Streaming Response API is running"}
