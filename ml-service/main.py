#!/usr/bin/env python3
"""
ML Service API
Provides predictive maintenance and analytics
"""

from fastapi import FastAPI
from api.prediction_api import router as prediction_router
from api.model_service import router as model_router

app = FastAPI(
    title="IoT ML Service",
    description="Machine Learning service for IoT Industrial Automation",
    version="1.0.0"
)

# Include routers
app.include_router(prediction_router, prefix="/api/v1")
app.include_router(model_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ml-service"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)