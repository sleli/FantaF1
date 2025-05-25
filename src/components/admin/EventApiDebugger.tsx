'use client';

import { useState } from 'react';

export default function EventApiDebugger() {
  const [eventId, setEventId] = useState('');
  const [status, setStatus] = useState('UPCOMING');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDebug = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      console.log(`Sending status update to event ${eventId}:`, { status });
      
      // Effettua la chiamata API con solo lo status
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      let responseData;
      try {
        responseData = await response.json();
        console.log('Response received:', { 
          status: response.status,
          ok: response.ok,
          data: responseData
        });
      } catch (error) {
        console.error('Error parsing response JSON:', error);
        throw new Error('Error parsing response from server');
      }
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Errore nella chiamata API');
      }
      
      setResult(responseData);
    } catch (err) {
      console.error('Debug error:', err);
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Event API Debugger</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Event ID
          </label>
          <input
            type="text"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            placeholder="cmb423tzg0002pfix7hyam6p4"
            className="w-full p-2 border rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="UPCOMING">UPCOMING</option>
            <option value="CLOSED">CLOSED</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
        </div>
        
        <button
          onClick={handleDebug}
          disabled={loading || !eventId}
          className="bg-blue-500 text-white px-4 py-2 rounded-md disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Status Update'}
        </button>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-md text-red-800">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
          <p className="text-xs mt-1 text-gray-600">
            Check the console for more details about the error.
          </p>
        </div>
      )}
      
      {result && (
        <div className="mt-4">
          <p className="font-semibold mb-2">API Response:</p>
          <pre className="bg-gray-100 p-3 rounded-md overflow-auto max-h-80 text-xs">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
