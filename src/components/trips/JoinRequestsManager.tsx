"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Users, Check, X, Loader2, UserPlus, Clock } from "lucide-react";
import '../../styles/design-system.css';

interface JoinRequest {
  _id: string;
  tripId: string;
  status: string;
  createdAt: string;
  user: {
    userId: string;
    username?: string;
    name?: string;
    email?: string;
    profileImg?: string;
  } | null;
}

interface JoinRequestsManagerProps {
  tripId: string;
  isCreator: boolean;
}

export default function JoinRequestsManager({ tripId, isCreator }: JoinRequestsManagerProps) {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchRequests = async () => {
    if (!isCreator) return;
    
    setLoading(true);
    try {
      const res = await axios.get(`/api/trips/${tripId}/requests`);
      setRequests(res.data.requests);
    } catch (err) {
      console.error("Error fetching join requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (requestId: string, action: 'accept' | 'reject') => {
    setProcessing(requestId);
    try {
      await axios.post(`/api/trips/${tripId}/requests`, {
        requestId,
        action,
      });
      
      // Refresh requests list
      await fetchRequests();
    } catch (err: any) {
      console.error(`Error ${action}ing request:`, err);
      alert(err.response?.data?.error || `Failed to ${action} request`);
    } finally {
      setProcessing(null);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [tripId, isCreator]);

  if (!isCreator) return null;

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--color-soft-terracotta)' }} />
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="card p-6">
        <h2 
          className="text-xl font-semibold mb-3 flex items-center gap-2"
          style={{ color: 'var(--color-warm-brown)' }}
        >
          <UserPlus className="w-5 h-5" />
          Join Requests
        </h2>
        <div 
          className="text-center py-8"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No pending join requests</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-featured p-6">
      <h2 
        className="text-xl font-semibold mb-4 flex items-center gap-2"
        style={{ color: 'var(--color-warm-brown)' }}
      >
        <UserPlus className="w-5 h-5" />
        Join Requests
        <span 
          className="ml-auto text-sm px-3 py-1 rounded-full font-semibold"
          style={{ 
            background: 'var(--color-soft-terracotta)',
            color: 'white'
          }}
        >
          {requests.length}
        </span>
      </h2>

      <div className="space-y-3">
        {requests.map((request) => (
          <div 
            key={request._id}
            className="p-4 rounded-lg"
            style={{ background: 'var(--bg-secondary)' }}
          >
            <div className="flex items-center justify-between">
              {/* User Info */}
              <div className="flex items-center gap-3 flex-1">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg"
                  style={{ 
                    background: 'var(--gradient-adventure)',
                    color: 'white'
                  }}
                >
                  {(request.user?.username || request.user?.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p 
                    className="font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {request.user?.username || request.user?.name || request.user?.email || 'Unknown User'}
                  </p>
                  <p 
                    className="text-sm flex items-center gap-1"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    <Clock className="w-3 h-3" />
                    {new Date(request.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRequest(request._id, 'accept')}
                  disabled={processing === request._id}
                  className="px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-1 hover:scale-105 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ 
                    background: 'var(--color-sage-green)',
                    color: 'white'
                  }}
                >
                  {processing === request._id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Accept
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleRequest(request._id, 'reject')}
                  disabled={processing === request._id}
                  className="px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-1 hover:scale-105 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ 
                    background: 'var(--status-error)',
                    color: 'white'
                  }}
                >
                  {processing === request._id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      Reject
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
