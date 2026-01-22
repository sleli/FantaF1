'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { withAuth } from '@/components/auth/withAuth';
import PublicLayout from '@/components/layout/PublicLayout';

function ProfilePage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';
  
  return (
    <PublicLayout>
      <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Il tuo profilo</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex items-center mb-6">
            {session?.user?.image && (
              <img 
                src={session.user.image} 
                alt={session.user.name || 'Profile picture'} 
                className="w-16 h-16 rounded-full mr-4 border-2 border-f1-red p-0.5"
              />
            )}
            
            <div>
              <h2 className="text-xl font-semibold">{session?.user?.name}</h2>
              <p className="text-gray-600">{session?.user?.email}</p>
              <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full ${
                isAdmin ? 'bg-f1-red text-white' : 'bg-gray-100 text-gray-800'
              }`}>
                {isAdmin ? 'ADMIN' : 'GIOCATORE'}
              </span>
            </div>
          </div>

          <div className="grid gap-3">
            {isAdmin && (
              <Link 
                href="/admin" 
                className="w-full text-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Pannello Admin
              </Link>
            )}
            
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full text-center px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 transition-colors"
            >
              Esci
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-medium mb-4">Statistiche</h3>
          <p className="text-gray-500">Funzionalità in arrivo...</p>
        </div>
      </div>
      </div>
    </PublicLayout>
  );
}

// Export the component wrapped with auth protection
// This requires the user to be authenticated but doesn't check for a specific role
export default withAuth(ProfilePage);
