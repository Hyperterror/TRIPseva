'use client';

import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

export default function DeletePreferencesButton() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      const response = await fetch('/api/preferences/delete', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete preferences');
      }

      const data = await response.json();
      
      // Show success message
      alert('✓ ' + data.message);
      
      // Reload page to reflect changes
      window.location.reload();
    } catch (err) {
      console.error('Error deleting preferences:', err);
      setError('Failed to delete preferences. Please try again.');
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  if (!showConfirm) {
    return (
      <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--color-light-gray)' }}>
        <h3 
          className="text-lg font-semibold mb-2"
          style={{ color: 'var(--color-warm-brown)' }}
        >
          Delete Preferences
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Permanently delete all your lifestyle and food preferences. This action cannot be undone.
        </p>
        <button
          onClick={() => setShowConfirm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all"
          style={{
            background: 'rgba(183, 75, 75, 0.1)',
            color: 'var(--status-error)',
            border: '1px solid var(--status-error)',
          }}
        >
          <Trash2 className="h-4 w-4" />
          Delete My Preferences
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--color-light-gray)' }}>
      <div 
        className="p-4 rounded-lg mb-4"
        style={{
          background: 'rgba(183, 75, 75, 0.1)',
          border: '1px solid var(--status-error)',
        }}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--status-error)' }} />
          <div>
            <h4 className="font-semibold mb-1" style={{ color: 'var(--status-error)' }}>
              Confirm Deletion
            </h4>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
              Are you sure you want to delete all your preferences? This will remove:
            </p>
            <ul className="text-sm mt-2 space-y-1" style={{ color: 'var(--text-secondary)' }}>
              <li>• All lifestyle preferences</li>
              <li>• All food preferences and dietary restrictions</li>
              <li>• Cuisine preferences and allergies</li>
            </ul>
            <p className="text-sm mt-2 font-semibold" style={{ color: 'var(--status-error)' }}>
              This action cannot be undone.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div 
          className="p-3 rounded-lg mb-4 text-sm"
          style={{
            background: 'rgba(183, 75, 75, 0.1)',
            color: 'var(--status-error)',
            border: '1px solid var(--status-error)',
          }}
        >
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50"
          style={{
            background: 'var(--status-error)',
            color: 'white',
          }}
        >
          {deleting ? 'Deleting...' : 'Yes, Delete Everything'}
        </button>
        <button
          onClick={() => {
            setShowConfirm(false);
            setError(null);
          }}
          disabled={deleting}
          className="px-4 py-2 rounded-lg font-semibold transition-all"
          style={{
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--color-light-gray)',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
