'use client';

import { useState } from 'react';

export default function ScoringTestComponent() {
  const [eventId, setEventId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCalculateScores = async () => {
    if (!eventId.trim()) {
      setError('Inserisci un ID evento');
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      console.log(`Calculating scores for event ${eventId}`);
      
      const response = await fetch(`/api/admin/events/${eventId}/calculate-scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
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
        throw new Error(responseData.error || 'Errore nel calcolo dei punteggi');
      }
      
      setResult(responseData);
    } catch (err) {
      console.error('Scoring error:', err);
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">🏆 Scoring System Test</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Event ID
          </label>
          <input
            type="text"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            placeholder="Inserisci l'ID dell'evento"
            className="w-full p-2 border rounded-md"
          />
        </div>
        
        <button
          onClick={handleCalculateScores}
          disabled={loading || !eventId.trim()}
          className="bg-green-500 text-white px-4 py-2 rounded-md disabled:opacity-50"
        >
          {loading ? 'Calculating...' : 'Calculate Scores'}
        </button>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-md text-red-800">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      {result && (
        <div className="mt-4">
          <p className="font-semibold mb-2">Scoring Result:</p>
          <pre className="bg-gray-100 p-3 rounded-md overflow-auto max-h-80 text-xs">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
