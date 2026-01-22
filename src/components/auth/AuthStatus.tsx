'use client';

import { useSession, signOut, signIn } from 'next-auth/react';
import Link from 'next/link';
import { UserIcon } from '@heroicons/react/24/outline';

export default function AuthStatus() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const isAdmin = session?.user?.role === 'ADMIN';

  // Handle direct Google sign in
  const handleGoogleSignIn = async () => {
    await signIn('google', { callbackUrl: '/' });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse h-10 w-20 sm:w-32 bg-gray-200 rounded"></div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-4">
        {/* Mobile: Avatar Only (Link to Profile) */}
        <Link href="/profile" className="md:hidden">
          {session.user.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || 'Profile'}
              className="w-8 h-8 rounded-full border border-gray-200"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center border border-gray-200">
              <UserIcon className="w-5 h-5 text-gray-600" />
            </div>
          )}
        </Link>

        {/* Desktop: Full Menu */}
        <div className="hidden md:flex items-center gap-4">
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
                className="py-2 px-3 bg-f1-red hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors shadow-sm"
              >
                Admin
              </Link>
            )}

            <Link
              href="/profile"
              className="py-2 px-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-md transition-colors shadow-sm"
            >
              Profilo
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="py-2 px-3 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-md transition-colors shadow-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleGoogleSignIn}
      className="inline-flex items-center gap-2 py-2 px-4 bg-f1-red hover:bg-red-700 text-white font-semibold rounded-lg shadow-sm hover:shadow transition-all duration-200 active:scale-95"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" className="flex-shrink-0">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="currentColor"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="currentColor"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="currentColor"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="currentColor"
        />
      </svg>
      <span className="hidden sm:inline">Accedi con Google</span>
      <span className="sm:hidden">Accedi</span>
    </button>
  );
}
