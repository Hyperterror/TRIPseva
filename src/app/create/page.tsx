"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { MapPin, Calendar, Users, Sparkles, Loader2, Plus, ArrowRight } from "lucide-react";
import '../../styles/design-system.css';

export default function CreateTripPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    location: "",
    date_from: "",
    date_to: "",
    interests: "",
    group_size_min: 2,
    group_size_max: 8,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate min/max group size
    if (Number(form.group_size_min) > Number(form.group_size_max)) {
      setError("Minimum group size cannot be greater than maximum group size.");
      setLoading(false);
      return;
    }

    try {
      await axios.post("/api/create", {
        ...form,
        interests: form.interests.split(",").map((i) => i.trim()),
        group_size_min: Number(form.group_size_min),
        group_size_max: Number(form.group_size_max),
      });

      router.push("/trips");
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6 md:p-10"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div 
              className="p-3 rounded-full"
              style={{ background: 'var(--gradient-adventure)' }}
            >
              <Plus className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 
            className="text-4xl md:text-5xl font-bold mb-3"
            style={{ 
              fontFamily: 'var(--font-playfair), "Playfair Display", serif',
              color: 'var(--color-warm-brown)' 
            }}
          >
            Create Your <span style={{ color: 'var(--color-soft-terracotta)' }}>Adventure</span>
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Share your travel plans and find compatible companions
          </p>
        </div>

        {/* Form Card */}
        <div className="card-featured p-8">
          {error && (
            <div 
              className="mb-6 p-4 rounded-lg text-sm font-medium"
              style={{ 
                background: 'rgba(183, 75, 75, 0.1)',
                color: 'var(--status-error)',
                border: '1px solid var(--status-error)'
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location */}
            <div>
              <label 
                className="block text-sm font-semibold mb-2"
                style={{ color: 'var(--color-warm-brown)' }}
              >
                <MapPin className="inline h-4 w-4 mr-1" />
                Destination
              </label>
              <input
                type="text"
                name="location"
                placeholder="e.g., Paris, France"
                value={form.location}
                onChange={handleChange}
                className="input-field w-full"
                required
              />
            </div>

            {/* Dates */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label 
                  className="block text-sm font-semibold mb-2"
                  style={{ color: 'var(--color-warm-brown)' }}
                >
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Start Date
                </label>
                <input
                  type="date"
                  name="date_from"
                  value={form.date_from}
                  onChange={handleChange}
                  className="input-field w-full"
                  required
                />
              </div>
              <div>
                <label 
                  className="block text-sm font-semibold mb-2"
                  style={{ color: 'var(--color-warm-brown)' }}
                >
                  <Calendar className="inline h-4 w-4 mr-1" />
                  End Date
                </label>
                <input
                  type="date"
                  name="date_to"
                  value={form.date_to}
                  onChange={handleChange}
                  className="input-field w-full"
                  required
                />
              </div>
            </div>

            {/* Interests */}
            <div>
              <label 
                className="block text-sm font-semibold mb-2"
                style={{ color: 'var(--color-warm-brown)' }}
              >
                <Sparkles className="inline h-4 w-4 mr-1" />
                Interests & Activities
              </label>
              <textarea
                name="interests"
                placeholder="e.g., hiking, food tours, museums, nightlife (comma separated)"
                value={form.interests}
                onChange={handleChange}
                className="input-field w-full resize-none h-24"
                required
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                Separate multiple interests with commas
              </p>
            </div>

            {/* Group Sizes */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label 
                  className="block text-sm font-semibold mb-2"
                  style={{ color: 'var(--color-warm-brown)' }}
                >
                  <Users className="inline h-4 w-4 mr-1" />
                  Min Group Size
                </label>
                <input
                  type="number"
                  name="group_size_min"
                  value={form.group_size_min}
                  onChange={handleChange}
                  min={1}
                  max={50}
                  className="input-field w-full"
                  required
                />
              </div>
              <div>
                <label 
                  className="block text-sm font-semibold mb-2"
                  style={{ color: 'var(--color-warm-brown)' }}
                >
                  <Users className="inline h-4 w-4 mr-1" />
                  Max Group Size
                </label>
                <input
                  type="number"
                  name="group_size_max"
                  value={form.group_size_max}
                  onChange={handleChange}
                  min={1}
                  max={50}
                  className="input-field w-full"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 font-semibold rounded-xl hover:scale-105 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating Trip...
                </>
              ) : (
                <>
                  Create Trip
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Tips Section */}
        <div 
          className="mt-8 p-6 rounded-lg"
          style={{ background: 'var(--bg-secondary)' }}
        >
          <h3 
            className="font-semibold mb-3"
            style={{ color: 'var(--color-warm-brown)' }}
          >
            💡 Tips for Creating a Great Trip
          </h3>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Be specific about your destination and dates</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>List activities you're interested in to attract compatible travelers</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Set realistic group sizes based on your accommodation plans</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Complete your profile and preferences for better matches</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
