"use client";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState, ChangeEvent } from "react";
import axios from "axios";
import UserProfileRatings from "@/components/ratings/UserProfileRatings";
import { Camera, MapPin, Calendar, User, Mail, Loader2, Settings, Utensils, Heart, ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";
import '../../styles/design-system.css';

interface Profile {
  name: string;
  bio?: string;
  profileImg?: string;
  dob?: string;
  gender?: string;
  hometown?: string;
}

interface PreferencesSummary {
  lifestyle?: {
    smokingPreference?: string;
    drinkingPreference?: string;
    activityLevel?: string;
  };
  food?: {
    dietaryRestrictions?: string[];
    cuisinePreferences?: string[];
    spiceLevel?: string;
  };
}

export default function ProfilePage() {
  const { user, isSignedIn } = useUser();
  const [profile, setProfile] = useState<Profile>({
    name: "",
    bio: "",
    profileImg:
      "https://res.cloudinary.com/dguqpdnw6/image/upload/v1750306565/codeconnect/vpprdbsn4uxjfygao27v.png",
    dob: "",
    gender: "",
    hometown: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [preferences, setPreferences] = useState<PreferencesSummary>({});

  // Fetch profile data on mount
  useEffect(() => {
    if (!isSignedIn || !user) return;

    const fetchProfile = async () => {
      try {
        const res = await axios.get(`/api/profile`);
        if (res.data) {
          setProfile({
            name: res.data.name || "",
            bio: res.data.bio || "",
            profileImg:
              res.data.profileImg ||
              "https://res.cloudinary.com/dguqpdnw6/image/upload/v1750306565/codeconnect/vpprdbsn4uxjfygao27v.png",
            dob: res.data.dob ? res.data.dob.split("T")[0] : "",
            gender: res.data.gender || "",
            hometown: res.data.hometown || "",
          });
          if (res.data.profileImg) setPhotoPreview(res.data.profileImg);
        }
      } catch (err) {
        console.error(err);
      }
    };

    const fetchPreferences = async () => {
      try {
        const [lifestyleRes, foodRes] = await Promise.all([
          axios.get('/api/preferences/lifestyle'),
          axios.get('/api/preferences/food')
        ]);
        
        setPreferences({
          lifestyle: lifestyleRes.data.data || null,
          food: foodRes.data.data || null
        });
      } catch (err) {
        console.error('Error fetching preferences:', err);
      }
    };

    Promise.all([fetchProfile(), fetchPreferences()]).finally(() => {
      setLoading(false);
    });
  }, [isSignedIn, user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("userId", user.id);
      formData.append("name", profile.name);
      formData.append("bio", profile.bio || "");
      formData.append("dob", profile.dob || "");
      formData.append("gender", profile.gender || "");
      formData.append("hometown", profile.hometown || "");
      if (photoFile) {
        formData.append("profileImg", photoFile);
      }

      await axios.put("/api/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("✅ Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div 
        className="flex flex-col justify-center items-center h-[70vh]"
        style={{ color: 'var(--text-secondary)' }}
      >
        <Loader2 className="h-12 w-12 animate-spin mb-4" style={{ color: 'var(--color-soft-terracotta)' }} />
        <p className="text-lg">Loading your profile...</p>
      </div>
    );
  if (!isSignedIn)
    return (
      <div 
        className="flex flex-col justify-center items-center h-[70vh]"
        style={{ color: 'var(--text-secondary)' }}
      >
        <User className="h-16 w-16 mb-4 opacity-50" />
        <p className="text-lg">Please sign in to view your profile.</p>
      </div>
    );

  return (
    <div className="min-h-screen p-6 md:p-10" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 
            className="text-3xl md:text-4xl font-bold mb-2"
            style={{ color: 'var(--color-warm-brown)' }}
          >
            Your <span style={{ color: 'var(--color-soft-terracotta)' }}>Profile</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage your travel identity and preferences
          </p>
        </div>

        {/* Profile Card */}
        <div className="card-featured p-8 mb-8">
          {/* Profile Photo */}
          <div className="flex justify-center mb-8">
            <div className="relative group">
              <div 
                className="w-32 h-32 rounded-full overflow-hidden"
                style={{ border: '4px solid var(--color-soft-terracotta)' }}
              >
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center text-2xl font-bold"
                    style={{ 
                      background: 'var(--gradient-earthy)',
                      color: 'var(--color-warm-brown)'
                    }}
                  >
                    {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
                  </div>
                )}
              </div>
              {/* Camera Overlay */}
              <label 
                htmlFor="photo"
                className="absolute inset-0 flex items-center justify-center rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'rgba(0, 0, 0, 0.6)' }}
              >
                <Camera className="h-8 w-8 text-white" />
              </label>
              <input
                type="file"
                id="photo"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Read-only fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col">
              <label 
                className="text-sm font-semibold mb-2 flex items-center"
                style={{ color: 'var(--color-warm-brown)' }}
              >
                <Mail className="h-4 w-4 mr-2" />
                Email
              </label>
              <input
                type="email"
                value={user?.emailAddresses[0].emailAddress || ""}
                readOnly
                className="input-field opacity-75 cursor-not-allowed"
                style={{ background: 'var(--bg-secondary)' }}
              />
            </div>
            <div className="flex flex-col">
              <label 
                className="text-sm font-semibold mb-2 flex items-center"
                style={{ color: 'var(--color-warm-brown)' }}
              >
                <User className="h-4 w-4 mr-2" />
                Username
              </label>
              <input
                type="text"
                value={user?.username || ""}
                readOnly
                className="input-field opacity-75 cursor-not-allowed"
                style={{ background: 'var(--bg-secondary)' }}
              />
            </div>
          </div>

          {/* Editable fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col">
              <label 
                className="text-sm font-semibold mb-2 flex items-center"
                style={{ color: 'var(--color-warm-brown)' }}
              >
                <User className="h-4 w-4 mr-2" />
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="input-field"
              />
            </div>
            <div className="flex flex-col">
              <label 
                className="text-sm font-semibold mb-2 flex items-center"
                style={{ color: 'var(--color-warm-brown)' }}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Hometown
              </label>
              <input
                type="text"
                name="hometown"
                value={profile.hometown}
                onChange={handleChange}
                placeholder="Where are you from?"
                className="input-field"
              />
            </div>
            <div className="flex flex-col">
              <label 
                className="text-sm font-semibold mb-2"
                style={{ color: 'var(--color-warm-brown)' }}
              >
                Gender
              </label>
              <select
                name="gender"
                value={profile.gender}
                onChange={handleChange as any}
                className="input-field"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label 
                className="text-sm font-semibold mb-2 flex items-center"
                style={{ color: 'var(--color-warm-brown)' }}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Date of Birth
              </label>
              <input
                type="date"
                name="dob"
                value={profile.dob}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          {/* Bio */}
          <div className="mb-6">
            <label 
              className="text-sm font-semibold mb-2 block"
              style={{ color: 'var(--color-warm-brown)' }}
            >
              About Me
            </label>
            <textarea
              name="bio"
              value={profile.bio}
              onChange={handleChange}
              placeholder="Tell other travelers about yourself, your interests, and what you love about traveling..."
              className="input-field w-full h-32 resize-none"
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              {profile.bio?.length || 0} / 500 characters
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full py-3 font-semibold rounded-xl shadow-lg hover:scale-105 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Saving...
              </span>
            ) : (
              "💾 Save Profile"
            )}
          </button>
        </div>

        {/* Preferences Summary Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 
              className="text-2xl font-bold"
              style={{ 
                fontFamily: 'var(--font-playfair), "Playfair Display", serif',
                color: 'var(--color-warm-brown)' 
              }}
            >
              Your <span style={{ color: 'var(--color-soft-terracotta)' }}>Preferences</span>
            </h2>
            <Link 
              href="/preferences"
              className="btn-secondary px-4 py-2 text-sm font-semibold rounded-lg hover:scale-105 transition-all flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Edit Preferences
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Lifestyle Preferences Card */}
            <div className="card-featured p-6">
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="p-2 rounded-lg"
                  style={{ background: 'var(--gradient-adventure)' }}
                >
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-lg" style={{ color: 'var(--color-warm-brown)' }}>
                  Lifestyle
                </h3>
              </div>
              
              {preferences.lifestyle ? (
                <div className="space-y-3">
                  {preferences.lifestyle.smokingPreference && (
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-sage-green)' }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Smoking</p>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {preferences.lifestyle.smokingPreference}
                        </p>
                      </div>
                    </div>
                  )}
                  {preferences.lifestyle.drinkingPreference && (
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-sage-green)' }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Drinking</p>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {preferences.lifestyle.drinkingPreference}
                        </p>
                      </div>
                    </div>
                  )}
                  {preferences.lifestyle.activityLevel && (
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-sage-green)' }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Activity Level</p>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {preferences.lifestyle.activityLevel}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm mb-3" style={{ color: 'var(--text-tertiary)' }}>
                    No lifestyle preferences set
                  </p>
                  <Link 
                    href="/preferences"
                    className="btn-tertiary px-4 py-2 text-sm inline-flex items-center gap-2"
                  >
                    Set Preferences
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>

            {/* Food Preferences Card */}
            <div className="card-featured p-6">
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="p-2 rounded-lg"
                  style={{ background: 'var(--gradient-adventure)' }}
                >
                  <Utensils className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-lg" style={{ color: 'var(--color-warm-brown)' }}>
                  Food & Dining
                </h3>
              </div>
              
              {preferences.food && (preferences.food.dietaryRestrictions?.length || preferences.food.cuisinePreferences?.length) ? (
                <div className="space-y-3">
                  {preferences.food.dietaryRestrictions && preferences.food.dietaryRestrictions.length > 0 && (
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-sage-green)' }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Dietary</p>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {preferences.food.dietaryRestrictions.join(', ')}
                        </p>
                      </div>
                    </div>
                  )}
                  {preferences.food.cuisinePreferences && preferences.food.cuisinePreferences.length > 0 && (
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-sage-green)' }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Cuisines</p>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {preferences.food.cuisinePreferences.slice(0, 3).join(', ')}
                          {preferences.food.cuisinePreferences.length > 3 && ` +${preferences.food.cuisinePreferences.length - 3} more`}
                        </p>
                      </div>
                    </div>
                  )}
                  {preferences.food.spiceLevel && (
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-sage-green)' }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Spice Level</p>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {preferences.food.spiceLevel}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm mb-3" style={{ color: 'var(--text-tertiary)' }}>
                    No food preferences set
                  </p>
                  <Link 
                    href="/preferences"
                    className="btn-tertiary px-4 py-2 text-sm inline-flex items-center gap-2"
                  >
                    Set Preferences
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link 
            href="/trips"
            className="card p-6 hover:scale-105 transition-all cursor-pointer"
          >
            <h3 className="font-semibold mb-2" style={{ color: 'var(--color-warm-brown)' }}>
              🗺️ My Trips
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              View and manage your upcoming adventures
            </p>
          </Link>
          <Link 
            href="/create"
            className="card p-6 hover:scale-105 transition-all cursor-pointer"
          >
            <h3 className="font-semibold mb-2" style={{ color: 'var(--color-warm-brown)' }}>
              ✨ Create Trip
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Start planning your next adventure
            </p>
          </Link>
        </div>

        {/* Ratings Section */}
        {user && (
          <div>
            <UserProfileRatings userId={user.id} isOwnProfile={true} />
          </div>
        )}
      </div>
    </div>
  );
}
