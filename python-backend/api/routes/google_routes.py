from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import List, Optional, Dict
from services.gemini_service import GeminiTravelAgent
from services.firebase_service import FirebaseTravelMatcher
import json
import asyncio

router = APIRouter(prefix="/api/google", tags=["google"])

gemini_agent = GeminiTravelAgent()
firebase_matcher = FirebaseTravelMatcher()

# WebSocket connection manager for real-time updates
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: str, user_id: str):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_text(message)
            except:
                self.disconnect(user_id)

    async def broadcast_to_destination(self, message: str, destination: str):
        # In a real app, you'd filter by destination
        for user_id, connection in self.active_connections.items():
            try:
                await connection.send_text(message)
            except:
                self.disconnect(user_id)

manager = ConnectionManager()

# Request Models
class ItineraryRequest(BaseModel):
    destination: str
    start_date: str
    end_date: str
    interests: Optional[List[str]] = []
    budget_per_day: Optional[int] = 100
    dietary_restrictions: Optional[List[str]] = []
    travel_pace: Optional[str] = "moderate"
    group_size: Optional[int] = 1
    accessibility_needs: Optional[List[str]] = []

class MatchRequest(BaseModel):
    user_id: str
    destination: str
    start_date: str
    end_date: str
    interests: Optional[List[str]] = []

@router.post("/generate-itinerary")
async def generate_itinerary(request: ItineraryRequest):
    try:
        # Calculate days (simple approximation)
        try:
            from datetime import datetime
            start = datetime.fromisoformat(request.start_date.replace('Z', '+00:00'))
            end = datetime.fromisoformat(request.end_date.replace('Z', '+00:00'))
            days = abs((end - start).days) + 1
        except:
            days = 3 # Default fallback

        result = gemini_agent.generate_itinerary(
            request.destination,
            days,
            request.dict()
        )
        
        if not result.get("success", False) and "itinerary" not in result:
             raise HTTPException(status_code=500, detail=result.get("error", "Unknown error"))
             
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Legacy endpoint for backward compatibility
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

@router.post("/generate-itinerary-legacy")
async def generate_itinerary_legacy(request: LegacyItineraryRequest):
    """Legacy endpoint for backward compatibility with old frontend"""
    try:
        # Calculate days
        try:
            from datetime import datetime
            start = datetime.fromisoformat(request.date_from.replace('Z', '+00:00'))
            end = datetime.fromisoformat(request.date_to.replace('Z', '+00:00'))
            days = abs((end - start).days) + 1
        except:
            days = 3

        # Convert to new format
        preferences = {
            "interests": request.interests or [],
            "dietary_restrictions": request.dietary_restrictions or [],
            "budget_per_day": 100,  # Default
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

@router.post("/find-matches")
async def find_matches(request: MatchRequest):
    try:
        # Store profile first to ensure it exists for matching
        profile = request.dict()
        firebase_matcher.store_user_profile(request.user_id, profile)
        
        matches = firebase_matcher.find_compatible_matches(
            request.user_id,
            profile,
            request.destination
        )
        
        # Notify other users about new traveler (real-time feature)
        await manager.broadcast_to_destination(
            json.dumps({
                "type": "new_traveler",
                "destination": request.destination,
                "user_id": request.user_id
            }),
            request.destination
        )
        
        return {
            "success": True,
            "matches": matches,
            "total": len(matches)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.websocket("/ws/matches/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """Real-time traveler matching notifications via WebSocket"""
    await manager.connect(websocket, user_id)
    try:
        # Send welcome message
        await websocket.send_text(json.dumps({
            "type": "connected",
            "message": f"Connected to real-time matching for user {user_id}",
            "user_id": user_id
        }))
        
        # Keep connection alive and listen for messages
        while True:
            data = await websocket.receive_text()
            # Echo back for testing
            await websocket.send_text(f"Echo: {data}")
            
    except WebSocketDisconnect:
        manager.disconnect(user_id)
        print(f"User {user_id} disconnected from WebSocket")
