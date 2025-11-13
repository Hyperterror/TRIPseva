"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Search, Plus, MapPin, Calendar, Users, Compass, Loader2, Filter } from "lucide-react";
import '../../styles/design-system.css';

interface Trip {
  _id: string;
  location: string;
  date_from: string;
  date_to: string;
  interests: string[];
  group_size_pref: { min: number; max: number };
  status: string;
}

export default function TripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [interestsInput, setInterestsInput] = useState("");

  const fetchTrips = async (interests?: string) => {
    setLoading(true);
    try {
      const query = interests ? `?interests=${encodeURIComponent(interests)}` : "";
      const res = await axios.get(`/api/trips${query}`);
      setTrips(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleFilter = () => {
    const formattedInterests = interestsInput.trim().toLowerCase();
    fetchTrips(formattedInterests);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFilter();
    }
  };

  if (loading)
    return (
      <div 
        className="flex flex-col justify-center items-center h-[70vh]"
        style={{ color: 'var(--text-secondary)' }}
      >
        <Loader2 className="h-12 w-12 animate-spin mb-4" style={{ color: 'var(--color-soft-terracotta)' }} />
        <p className="text-lg">Discovering amazing trips...</p>
      </div>
    );

  return (
    <div className="min-h-screen p-6 md:p-10" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div 
              className="p-3 rounded-full"
              style={{ background: 'var(--gradient-adventure)' }}
            >
              <Compass className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ color: 'var(--color-warm-brown)' }}
          >
            Explore <span style={{ color: 'var(--color-soft-terracotta)' }}>Adventures</span>
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Find your next travel experience and connect with fellow adventurers
          </p>
        </div>

        {/* Search and Create Section */}
        <div className="card-featured p-6 mb-12">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search 
                className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5"
                style={{ color: 'var(--text-tertiary)' }}
              />
              <input
                type="text"
                placeholder="Search by interests (e.g., hiking, food, culture)"
                value={interestsInput}
                onChange={(e) => setInterestsInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="input-field w-full pl-12"
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleFilter}
                className="btn-secondary px-6 py-3 font-semibold rounded-xl hover:scale-105 transition-all flex items-center"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </button>
              <button
                onClick={() => router.push("/create")}
                className="btn-primary px-6 py-3 font-semibold rounded-xl hover:scale-105 transition-all flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Trip
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {trips.length === 0 ? (
          <div 
            className="text-center py-16"
            style={{ color: 'var(--text-secondary)' }}
          >
            <MapPin className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-warm-brown)' }}>
              No trips found
            </h3>
            <p className="mb-6">
              {interestsInput 
                ? "Try adjusting your search filters or create a new trip!"
                : "Be the first to create an adventure!"}
            </p>
            <button
              onClick={() => router.push("/create")}
              className="btn-primary px-6 py-3 rounded-xl"
            >
              🌟 Create First Trip
            </button>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-6">
              <p style={{ color: 'var(--text-secondary)' }}>
                Found <span className="font-semibold" style={{ color: 'var(--color-warm-brown)' }}>
                  {trips.length}
                </span> {trips.length === 1 ? 'trip' : 'trips'}
              </p>
            </div>

            {/* Trips Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip) => (
                <div
                  key={trip._id}
                  className="card-featured p-6 hover:scale-105 transition-all cursor-pointer"
                  onClick={() => router.push(`/trips/${trip._id}`)}
                >
                  {/* Location */}
                  <div className="flex items-start justify-between mb-4">
                    <h2 
                      className="text-2xl font-bold"
                      style={{ color: 'var(--color-warm-brown)' }}
                    >
                      {trip.location}
                    </h2>
                    <div 
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ 
                        background: trip.status === 'open' ? 'var(--color-sage-green)' : 'var(--color-light-gray)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {trip.status}
                    </div>
                  </div>

                  {/* Dates */}
                  <div 
                    className="flex items-center mb-3 text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>
                      {new Date(trip.date_from).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })} - {new Date(trip.date_to).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Group Size */}
                  <div 
                    className="flex items-center mb-4 text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    <span>
                      {trip.group_size_pref.min} - {trip.group_size_pref.max} travelers
                    </span>
                  </div>

                  {/* Interests */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {trip.interests.slice(0, 3).map((interest, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-3 py-1 rounded-full font-medium"
                        style={{ 
                          background: 'var(--color-warm-gold)',
                          color: 'var(--text-primary)'
                        }}
                      >
                        {interest}
                      </span>
                    ))}
                    {trip.interests.length > 3 && (
                      <span
                        className="text-xs px-3 py-1 rounded-full font-medium"
                        style={{ 
                          background: 'var(--color-light-gray)',
                          color: 'var(--text-tertiary)'
                        }}
                      >
                        +{trip.interests.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* View Button */}
                  <button
                    className="btn-primary w-full py-2 font-semibold rounded-lg hover:scale-105 transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/trips/${trip._id}`);
                    }}
                  >
                    View Details →
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
