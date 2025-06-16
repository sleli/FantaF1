'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // Customize the error message based on the error code
    switch (error) {
      case 'AccessDenied':
        setErrorMessage('Accesso negato. Non hai i permessi necessari.');
        break;
      case 'Verification':
        setErrorMessage('Il link di verifica è scaduto o è già stato utilizzato.');
        break;
      case 'Configuration':
        setErrorMessage('Si è verificato un errore di configurazione. Contatta l\'amministratore.');
        break;
      case 'OAuthSignin':
      case 'OAuthCallback':
      case 'OAuthAccountNotLinked':
        setErrorMessage('Si è verificato un errore durante l\'autenticazione con Google.');
        break;
      default:
        setErrorMessage('Si è verificato un errore di autenticazione. Riprova più tardi.');
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Errore di Autenticazione</h1>
          <div className="mb-6 text-gray-600">
            <p>{errorMessage}</p>
          </div>
          
          <div className="flex flex-col space-y-4">
            <Link 
              href="/login"
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md text-center"
            >
              Torna al login
            </Link>
            
            <Link 
              href="/"
              className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md text-center"
            >
              Vai alla Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
