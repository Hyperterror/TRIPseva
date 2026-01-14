import firebase_admin
from firebase_admin import credentials, db
import os
import json

class FirebaseTravelMatcher:
    """Real-time traveler matching using Firebase Realtime Database."""

    def __init__(self):
        self._initialize_firebase()

    def _initialize_firebase(self):
        try:
            # Check if already initialized
            if firebase_admin._apps:
                return

            cred_path = os.getenv("GOOGLE_CLOUD_CREDENTIALS_PATH")
            db_url = os.getenv("FIREBASE_DATABASE_URL")

            if not cred_path or not db_url:
                print("Warning: Firebase credentials or Database URL not found")
                return

            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred, {
                'databaseURL': db_url
            })
            print("Firebase initialized successfully")
        except Exception as e:
            print(f"Error initializing Firebase: {e}")

    def store_user_profile(self, user_id: str, profile: dict):
        """Store user profile in Firebase for real-time matching."""
        try:
            ref = db.reference(f'users/{user_id}')
            ref.set(profile)
            return True
        except Exception as e:
            print(f"Error storing profile: {e}")
            return False

    def find_compatible_matches(self, user_id: str, profile: dict, destination: str) -> list:
        """Find compatible travelers based on destination and preferences."""
        matches = []
        try:
            # Query users going to the same destination
            ref = db.reference('users')
            # Note: In a real app, use better querying/indexing
            users = ref.get()
            
            if not users:
                return []

            for uid, user_data in users.items():
                if uid == user_id:
                    continue
                
                # Check destination overlap
                if user_data.get('destination') == destination:
                    matches.append({
                        "userId": uid,
                        "compatibility": self._calculate_compatibility(profile, user_data),
                        "details": user_data
                    })
            
            # Sort by compatibility
            matches.sort(key=lambda x: x['compatibility'], reverse=True)
            return matches[:10]

        except Exception as e:
            print(f"Error finding matches: {e}")
            return []

    def _calculate_compatibility(self, profile1, profile2):
        # placeholder logic
        score = 50
        interests1 = set(profile1.get('interests', []))
        interests2 = set(profile2.get('interests', []))
        
        common = interests1.intersection(interests2)
        score += len(common) * 10
        
        return min(score, 100)
