'use client';

import { useSession, signIn } from 'next-auth/react';
import UserMenu from './UserMenu';

export default function AuthStatus() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';

  // Handle direct Google sign in
  const handleGoogleSignIn = async () => {
    await signIn('google', { callbackUrl: '/' });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse h-10 w-10 sm:w-32 bg-gray-200 rounded-full sm:rounded-lg"></div>
    );
  }

  if (isAuthenticated && session?.user) {
    return <UserMenu user={session.user} />;
  }

  return (
    <button
      onClick={handleGoogleSignIn}
      className="inline-flex items-center gap-2 py-2 px-4 bg-f1-red hover:bg-red-700 text-white font-semibold rounded-full shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 text-sm"
    >
      <span className="hidden sm:inline">Accedi</span>
      <span className="sm:hidden">Login</span>
    </button>
  );
}
