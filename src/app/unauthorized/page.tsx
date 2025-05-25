'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Accesso Negato</h1>
          <div className="mb-6 text-gray-600">
            <p>Non hai i permessi necessari per accedere a questa pagina.</p>
            <p className="mt-2">Questa sezione è riservata agli amministratori.</p>
          </div>
          
          <div className="flex flex-col space-y-4">
            <Link 
              href="/"
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md text-center"
            >
              Torna alla Home
            </Link>
            
            <button
              onClick={() => signIn('google')}
              className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md"
            >
              Accedi con un altro account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
