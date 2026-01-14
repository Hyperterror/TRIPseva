"""
FastAPI Backend for AI Itinerary Generation (Google Gemini + Firebase)
Run with: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from api.routes import google_routes

# Load environment variables
load_dotenv()
load_dotenv("../.env")

# Initialize FastAPI
app = FastAPI(title="TripSync AI Itinerary API")

# Configure CORS
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", 
    "http://localhost:3000,https://tripseva.vercel.app,https://*.vercel.app"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Google Routes
app.include_router(google_routes.router)

# Legacy route for backward compatibility
from pydantic import BaseModel
from typing import List, Optional, Dict

class LegacyItineraryRequest(BaseModel):
    location: str
    date_from: str
    date_to: str
    interests: Optional[List[str]] = []
    group_size: Optional[Dict] = None
    dietary_restrictions: Optional[List[str]] = []
    allergies: Optional[str] = None
    cuisine_preferences: Optional[List[str]] = []
    meal_budget: Optional[str] = None
    activity_level: Optional[str] = None
    accommodation_preference: Optional[str] = None

@app.post("/api/generate-itinerary")
async def generate_itinerary_legacy(request: LegacyItineraryRequest):
    """Legacy endpoint for backward compatibility"""
    from services.gemini_service import GeminiTravelAgent
    from datetime import datetime
    
    try:
        gemini_agent = GeminiTravelAgent()
        
        # Calculate days
        try:
            start = datetime.fromisoformat(request.date_from.replace('Z', '+00:00'))
            end = datetime.fromisoformat(request.date_to.replace('Z', '+00:00'))
            days = abs((end - start).days) + 1
        except:
            days = 3

        # Convert to new format
        preferences = {
            "interests": request.interests or [],
            "dietary_restrictions": request.dietary_restrictions or [],
            "budget_per_day": 100,
            "travel_pace": "moderate",
            "group_size": request.group_size.get("max", 1) if request.group_size else 1
        }

        result = gemini_agent.generate_itinerary(
            request.location,
            days,
            preferences
        )
        
        if not result.get("success", False) and "itinerary" not in result:
            return {
                "success": False,
                "error": result.get("error", "Failed to generate itinerary")
            }
        
        # Return in legacy format
        return {
            "success": True,
            "itinerary": result.get("itinerary", {}),
            "metadata": {
                "location": request.location,
                "duration_days": days,
                "generated_at": datetime.now().isoformat()
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/")
@app.head("/")
def read_root():
    return {
        "message": "TripSync AI Itinerary API",
        "status": "running",
        "provider": "Google Cloud",
        "endpoints": {
            "generate": "/api/google/generate-itinerary",
            "matches": "/api/google/find-matches",
            "health": "/health"
        }
    }

@app.get("/health")
@app.head("/health")
def health_check():
    return {"status": "healthy", "service": "AI Itinerary Generator (Gemini + Firebase)"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
