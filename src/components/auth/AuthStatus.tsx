'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function AuthStatus() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const isAdmin = session?.user?.role === 'ADMIN';

  if (isLoading) {
    return (
      <div className="animate-pulse h-10 w-32 bg-gray-200 rounded"></div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {session.user.image && (
            <img 
              src={session.user.image} 
              alt={session.user.name || 'Profile'} 
              className="w-8 h-8 rounded-full"
            />
          )}
          <span className="font-medium text-gray-800">{session.user.name}</span>
        </div>
        
        <div className="flex gap-2">
          {isAdmin && (
            <Link 
              href="/admin"
              className="py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md"
            >
              Admin
            </Link>
          )}
          
          <Link 
            href="/profile"
            className="py-2 px-3 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-md"
          >
            Profilo
          </Link>
          
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="py-2 px-3 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <Link 
      href="/login"
      className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
    >
      Accedi
    </Link>
  );
}
