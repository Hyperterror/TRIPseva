from google import genai
import os
import json
from datetime import datetime

class GeminiTravelAgent:
    """Generate personalized travel itineraries using Google Gemini API."""

    def __init__(self):
        api_key = os.getenv("GOOGLE_GEMINI_API_KEY")
        if not api_key:
            print("Warning: GOOGLE_GEMINI_API_KEY not found in environment variables")
            self.client = None
        else:
            try:
                self.client = genai.Client(api_key=api_key)
            except Exception as e:
                print(f"Error initializing Gemini client: {e}")
                self.client = None

    def generate_itinerary(self, destination: str, days: int, preferences: dict) -> dict:
        """
        Generate a personalized itinerary using Google Gemini.
        
        Args:
            destination: City or country name
            days: Number of days for the trip (1-30)
            preferences: Dict with interests, budget, dietary needs
            
        Returns:
            Dict with day-by-day itinerary and cost breakdown
        """
        if not self.client:
             return {
                "success": False,
                "error": "Gemini API key not configured"
            }

        prompt = self._build_prompt(destination, days, preferences)
        
        try:
            response = self.client.models.generate_content(
                model='gemini-2.0-flash-exp',
                contents=prompt
            )
            return self._parse_response(response.text, destination, days)
        except Exception as e:
            print(f"Error generating itinerary: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def _build_prompt(self, destination: str, days: int, preferences: dict) -> str:
        
        interests = ", ".join(preferences.get('interests', []))
        budget = preferences.get('budget_per_day', 'moderate')
        dietary = ", ".join(preferences.get('dietary_restrictions', []))
        pace = preferences.get('travel_pace', 'moderate')
        group_size = preferences.get('group_size', 1)

        return f"""
        You are an expert travel agent. Create a detailed {days}-day itinerary for {destination}.
        
        Context:
        - Travelers: {group_size} people
        - Interests: {interests}
        - Budget: ${budget} per person per day
        - Dietary Restrictions: {dietary}
        - Pace: {pace}

        Format requirements:
        Return ONLY valid JSON with no markdown formatting. The JSON must follow this structure:
        {{
          "success": true,
          "destination": "{destination}",
          "days": {days},
          "itinerary": {{
            "Day 1": {{
              "morning": [{{ "time": "09:00", "activity": "Name", "description": "Details", "cost": 0 }}],
              "afternoon": [...],
              "evening": [...]
            }}
          }},
          "budgetBreakdown": {{
            "totalCost": 0,
            "dailyCosts": [{{ "day": 1, "total": 0 }}]
          }}
        }}
        """

    def _parse_response(self, response_text: str, destination: str, days: int) -> dict:
        try:
            # Clean response text to ensure it's valid JSON
            cleaned_text = response_text.replace("```json", "").replace("```", "").strip()
            data = json.loads(cleaned_text)
            
            # Ensure basic structure exists
            if "itinerary" not in data:
                 data["itinerary"] = {}
            
            return data
        except json.JSONDecodeError:
            return {
                "success": False,
                "error": "Failed to parse AI response",
                "raw_response": response_text
            }
