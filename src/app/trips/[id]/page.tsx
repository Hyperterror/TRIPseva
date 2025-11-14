"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import {
  Loader2,
  Users,
  Calendar,
  MapPin,
  Heart,
  Send,
  FileText,
  MessageCircle,
  Sparkles,
  CheckCircle,
  XCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import PostTripRatingPrompt from "@/components/ratings/PostTripRatingPrompt";
import JoinRequestsManager from "@/components/trips/JoinRequestsManager";
import '../../../styles/design-system.css';

interface Trip {
  _id: string;
  location: string;
  date_from: string;
  date_to: string;
  interests: string[];
  group_size_pref: { min: number; max: number };
  status: string;
}

interface User {
  _id: string;
  userId: string;
  username?: string;
  name?: string;
  email?: string;
  profileImg?: string;
}

interface TripGroup {
  _id: string;
  members: User[];
  chatRoomId?: string;
}

interface Message {
  _id: string;
  senderId: User;
  messageText: string;
  createdAt: string;
}

interface TripDataResponse {
  trip: Trip;
  group: TripGroup | null;
  isMember: boolean;
  invitation: any;
  isCreator?: boolean;
  currentUserId?: string;
}

export default function TripDetailPage() {
  const { id } = useParams();
  const [tripData, setTripData] = useState<TripDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  const [itinerary, setItinerary] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // 🔹 Fetch trip details
  const fetchTrip = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await axios.post<TripDataResponse>(`/api/trips/get`, { id });
      setTripData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Fetch messages for this trip group
  const fetchMessages = async () => {
    if (!tripData?.group?._id) return;
    try {
      const res = await axios.get(
        `/api/trips/messages?tripGroupId=${tripData.group._id}`
      );
      setMessages(res.data.messages);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  // 🔹 Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !tripData?.group?._id) return;
    setSending(true);
    try {
      const senderId = "USER_ID_HERE"; // replace with actual logged-in userId
      await axios.post("/api/trips/messages", {
        tripGroupId: tripData.group._id,
        senderId,
        messageText: newMessage,
      });
      setNewMessage("");
      await fetchMessages();
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    fetchTrip();
  }, [id]);

  useEffect(() => {
    if (tripData?.isMember) fetchMessages();
  }, [tripData?.isMember, tripData?.group?._id]);

  if (loading)
    return (
      <div 
        className="flex flex-col justify-center items-center h-[70vh]"
        style={{ color: 'var(--text-secondary)' }}
      >
        <Loader2 className="h-12 w-12 animate-spin mb-4" style={{ color: 'var(--color-soft-terracotta)' }} />
        <p className="text-lg">Loading trip details...</p>
      </div>
    );

  if (!tripData) 
    return (
      <div 
        className="flex flex-col justify-center items-center h-[70vh]"
        style={{ color: 'var(--text-secondary)' }}
      >
        <MapPin className="h-16 w-16 mb-4 opacity-50" />
        <p className="text-lg">Trip not found</p>
      </div>
    );

  const { trip, group, isMember, invitation, isCreator, currentUserId } = tripData;

  return (
    <div className="min-h-screen p-6 md:p-10" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-5xl mx-auto">
        {/* Header Card */}
        <div className="card-featured overflow-hidden mb-6">
          <div 
            className="relative p-8 text-white"
            style={{ background: 'var(--gradient-adventure)' }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-3 flex items-center gap-3">
                  <MapPin className="w-8 h-8" /> {trip.location}
                </h1>
                <p className="text-white/90 flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5" />
                  {new Date(trip.date_from).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })} - {new Date(trip.date_to).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <div 
                className="px-4 py-2 rounded-full text-sm font-semibold"
                style={{ 
                  background: isMember ? 'var(--color-sage-green)' : 'rgba(255, 255, 255, 0.2)',
                  color: 'white'
                }}
              >
                {isMember ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Member
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> Not Member
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Trip Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Interests Card */}
            <div className="card p-6">
              <h2 
                className="text-xl font-semibold mb-4 flex items-center gap-2"
                style={{ color: 'var(--color-warm-brown)' }}
              >
                <Sparkles className="w-5 h-5" />
                Interests & Activities
              </h2>
              <div className="flex flex-wrap gap-2">
                {trip.interests.map((interest, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 rounded-full text-sm font-medium"
                    style={{ 
                      background: 'var(--color-warm-gold)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>

            {/* Group Members Card */}
            <div className="card p-6">
              <h2 
                className="text-xl font-semibold mb-4 flex items-center gap-2"
                style={{ color: 'var(--color-warm-brown)' }}
              >
                <Users className="w-5 h-5" />
                Travel Companions
              </h2>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                Group Size: <span className="font-semibold" style={{ color: 'var(--color-warm-brown)' }}>
                  {trip.group_size_pref.min} - {trip.group_size_pref.max} travelers
                </span>
              </p>

              {group && (
                <div className="space-y-3">
                  {group.members.length > 0 ? group.members.map((member, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center gap-3 p-3 rounded-lg"
                      style={{ background: 'var(--bg-secondary)' }}
                    >
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center font-semibold"
                        style={{ background: 'var(--gradient-adventure)', color: 'white' }}
                      >
                        {(member.username || member.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {member.username || member.name || member.email || "Unnamed User"}
                      </span>
                    </div>
                  )) : (
                    <p style={{ color: 'var(--text-tertiary)' }}>
                      No members yet. Be the first to join!
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Join Requests Manager (for trip creator) */}
            {isCreator && (
              <JoinRequestsManager tripId={trip._id} isCreator={isCreator} />
            )}

            {/* Join Request Card */}
            {!isMember && (
              <div className="card-featured p-6">
                <h2 
                  className="text-xl font-semibold mb-3"
                  style={{ color: 'var(--color-warm-brown)' }}
                >
                  Join This Adventure
                </h2>
                <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Interested in this trip? Send a request to join the group!
                </p>
                {invitation && (
                  <div 
                    className="mb-4 p-3 rounded-lg"
                    style={{ background: 'var(--bg-secondary)' }}
                  >
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Invitation Status: <span className="font-semibold capitalize" style={{ color: 'var(--color-soft-terracotta)' }}>
                        {invitation.status}
                      </span>
                      {invitation.invitedBy && ` (by ${invitation.invitedBy})`}
                    </p>
                  </div>
                )}
                <button
                  onClick={async () => {
                    setRequesting(true); setMessage("");
                    try { 
                      await axios.post("/api/trips/invite", { tripId: id }); 
                      setMessage("✅ Request sent successfully!"); 
                      await fetchTrip(); 
                    }
                    catch (err: any) { 
                      setMessage(err.response?.data?.error || "❌ Failed to send request"); 
                    }
                    finally { setRequesting(false); }
                  }}
                  disabled={requesting}
                  className="btn-primary w-full py-3 font-semibold rounded-xl hover:scale-105 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {requesting ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5" />
                      Sending Request...
                    </>
                  ) : (
                    <>
                      <Heart className="w-5 h-5" />
                      Request to Join
                    </>
                  )}
                </button>
                {message && (
                  <p 
                    className={`text-sm mt-3 ${message.includes("✅") ? "" : ""}`}
                    style={{ color: message.includes("✅") ? 'var(--color-sage-green)' : 'var(--color-error)' }}
                  >
                    {message}
                  </p>
                )}
              </div>
            )}

            {/* Group Chat */}
            {isMember && (
              <div className="card p-6">
                <h2 
                  className="text-xl font-semibold mb-4 flex items-center gap-2"
                  style={{ color: 'var(--color-warm-brown)' }}
                >
                  <MessageCircle className="w-5 h-5" />
                  Group Chat
                </h2>
                <div 
                  className="max-h-80 overflow-y-auto rounded-lg p-4 space-y-3 mb-4"
                  style={{ background: 'var(--bg-secondary)' }}
                >
                  {messages.length > 0 ? messages.map(msg => (
                    <div 
                      key={msg._id} 
                      className="p-3 rounded-lg"
                      style={{ background: 'var(--bg-primary)' }}
                    >
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                        <span 
                          className="font-semibold"
                          style={{ color: 'var(--color-soft-terracotta)' }}
                        >
                          {msg.senderId?.name || "Unknown"}
                        </span>: {msg.messageText}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  )) : (
                    <p className="text-sm text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                      No messages yet. Start the conversation!
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder="Type your message..." 
                    value={newMessage} 
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="input-field flex-1"
                  />
                  <button 
                    onClick={handleSendMessage} 
                    disabled={sending || !newMessage.trim()}
                    className="btn-primary px-4 py-2 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <Loader2 className="animate-spin w-4 h-4" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - AI Features */}
          <div className="space-y-6">

            {/* AI Itinerary */}
            {isMember && (
              <div className="card-featured p-6">
                <h2 
                  className="text-xl font-semibold mb-3 flex items-center gap-2"
                  style={{ color: 'var(--color-warm-brown)' }}
                >
                  <Sparkles className="w-5 h-5" />
                  AI Itinerary Generator
                </h2>
                <p className="mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Get a personalized day-by-day itinerary powered by AI
                </p>
                <button
                  onClick={async () => {
                    if (!tripData) return;
                    setGenerating(true); setItinerary(null);
                    try {
                      const res = await axios.post("https://tripsync-backend-14jw.onrender.com/generate-itinerary", { 
                        tripId: tripData.trip._id, 
                        location: tripData.trip.location, 
                        date_from: tripData.trip.date_from, 
                        date_to: tripData.trip.date_to, 
                        interests: tripData.trip.interests, 
                        group_size: tripData.trip.group_size_pref 
                      });
                      setItinerary(res.data.itinerary);
                    } catch (err) { 
                      setItinerary("❌ Failed to generate itinerary. Please try again."); 
                    }
                    finally { setGenerating(false); }
                  }}
                  disabled={generating}
                  className="btn-primary w-full py-3 rounded-xl font-semibold hover:scale-105 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      Generate Itinerary
                    </>
                  )}
                </button>

                {itinerary && (
                  <div 
                    className="mt-4 p-4 rounded-lg space-y-2 prose prose-sm max-w-none"
                    style={{ 
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <ReactMarkdown>{itinerary}</ReactMarkdown>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Post-Trip Rating Section */}
        {isMember && group && new Date(trip.date_to) < new Date() && (
          <div className="mt-6">
            <PostTripRatingPrompt
              tripGroupId={group._id}
              tripName={trip.location}
              members={group.members.map(m => ({
                userId: m.userId,
                name: m.username || m.name || m.email || 'Unknown User',
                profileImg: m.profileImg
              }))}
            />
          </div>
        )}
      </div>
    </div>
  );
}
