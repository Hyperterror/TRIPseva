"""
FastAPI Backend for AI Itinerary Generation
Run with: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from groq import Groq
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
# Also try loading from parent directory
load_dotenv("../.env")

# Initialize FastAPI
app = FastAPI(title="TripSync AI Itinerary API")

# Configure CORS
# Get allowed origins from environment or use defaults
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

# Configure Groq
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY or GROQ_API_KEY == "your-groq-api-key-here":
    raise ValueError(
        "GROQ_API_KEY not found! Please set it in .env file or environment variables.\n"
        "Get your API key from: https://console.groq.com/keys"
    )
groq_client = Groq(api_key=GROQ_API_KEY)

# Request model
class ItineraryRequest(BaseModel):
    location: str
    date_from: str
    date_to: str
    interests: Optional[List[str]] = []
    group_size: Optional[dict] = {"min": 1, "max": 4}
    dietary_restrictions: Optional[List[str]] = []
    allergies: Optional[str] = None
    cuisine_preferences: Optional[List[str]] = []
    meal_budget: Optional[str] = None
    activity_level: Optional[str] = None
    accommodation_preference: Optional[str] = None

@app.get("/")
def read_root():
    return {
        "message": "TripSync AI Itinerary API",
        "status": "running",
        "endpoints": {
            "generate": "/api/generate-itinerary",
            "health": "/health"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "AI Itinerary Generator"}

@app.post("/api/generate-itinerary")
async def generate_itinerary(request: ItineraryRequest):
    try:
        # Calculate trip duration
        start_date = datetime.fromisoformat(request.date_from.replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(request.date_to.replace('Z', '+00:00'))
        duration_days = (end_date - start_date).days + 1

        # Build dietary info
        dietary_info = ""
        if request.dietary_restrictions:
            dietary_info += f"\n- Dietary Restrictions: {', '.join(request.dietary_restrictions)}"
        if request.allergies:
            dietary_info += f"\n- Allergies: {request.allergies}"
        if request.cuisine_preferences:
            dietary_info += f"\n- Cuisine Preferences: {', '.join(request.cuisine_preferences)}"
        if request.meal_budget:
            dietary_info += f"\n- Meal Budget: {request.meal_budget}"

        # Build lifestyle info
        lifestyle_info = ""
        if request.activity_level:
            lifestyle_info += f"\n- Activity Level: {request.activity_level}"
        if request.accommodation_preference:
            lifestyle_info += f"\n- Accommodation Preference: {request.accommodation_preference}"

        # System prompt
        system_prompt = """You are an AI travel planner that creates realistic and time-specific itineraries.

INSTRUCTIONS:
- Create a structured day-by-day plan with specific times
- Include morning (8-12), afternoon (12-17), and evening (17-22) activities
- Suggest specific restaurants and food experiences that match dietary preferences
- Keep descriptions concise and practical
- Only provide the itinerary, do not add extra explanations or introductions
- Format in clean markdown with day headers (## Day 1, ## Day 2, etc.)
- Use bullet points with time stamps (e.g., "• 9:00 AM - Visit Eiffel Tower")
- Consider travel time between locations
- Respect dietary restrictions and food preferences when recommending restaurants
- Match activity intensity to the user's activity level preference"""

        # User prompt
        user_prompt = f"""Create a {duration_days}-day travel itinerary for {request.location}.

TRIP DETAILS:
- Destination: {request.location}
- Dates: {start_date.strftime('%B %d, %Y')} to {end_date.strftime('%B %d, %Y')}
- Duration: {duration_days} days
- Group Size: {request.group_size.get('min', 1)}-{request.group_size.get('max', 4)} travelers
{f"- Interests: {', '.join(request.interests)}" if request.interests else ''}{dietary_info}{lifestyle_info}

REQUIREMENTS:
1. Provide specific times for each activity
2. Recommend restaurants that accommodate dietary restrictions
3. Include realistic travel times between locations
4. Match activity intensity to preferences
5. Suggest local food experiences aligned with cuisine preferences
6. Keep each day balanced and not overly packed

Start with Day 1 and provide the complete itinerary."""

        # Use Groq with Llama model
        model_name = "llama-3.3-70b-versatile"  # Fast and high quality
        
        print(f"Generating itinerary for {request.location} using Groq {model_name}...")
        
        # Generate with Groq
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": user_prompt
                }
            ],
            model=model_name,
            temperature=0.7,
            max_tokens=4096,
        )
        
        itinerary = chat_completion.choices[0].message.content
        print(f"Itinerary generated successfully, length: {len(itinerary)}")

        if not itinerary or len(itinerary.strip()) == 0:
            raise HTTPException(status_code=500, detail="AI generated empty itinerary")

        return {
            "success": True,
            "itinerary": itinerary,
            "metadata": {
                "location": request.location,
                "duration": duration_days,
                "generated_at": datetime.now().isoformat()
            }
        }

    except Exception as e:
        print(f"Error generating itinerary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate itinerary: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
