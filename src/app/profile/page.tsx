'use client';

import { useSession } from 'next-auth/react';
import { withAuth } from '@/components/auth/withAuth';

function ProfilePage() {
  const { data: session } = useSession();
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Il tuo profilo</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center">
            {session?.user?.image && (
              <img 
                src={session.user.image} 
                alt={session.user.name || 'Profile picture'} 
                className="w-16 h-16 rounded-full mr-4"
              />
            )}
            
            <div>
              <h2 className="text-xl font-semibold">{session?.user?.name}</h2>
              <p className="text-gray-600">{session?.user?.email}</p>
              <p className="text-sm text-gray-500 mt-1">
                Ruolo: {session?.user?.role === 'ADMIN' ? 'Amministratore' : 'Giocatore'}
              </p>
            </div>
          </div>
          
          <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-medium mb-4">I tuoi pronostici</h3>
            <p className="text-gray-500">Nessun pronostico effettuato.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export the component wrapped with auth protection
// This requires the user to be authenticated but doesn't check for a specific role
export default withAuth(ProfilePage);
