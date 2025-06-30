'use client';

import { signIn, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Handle Google sign in with direct redirect
  const handleGoogleSignIn = async () => {
    await signIn('google', {
      callbackUrl: '/',
      redirect: true
    });
  };

  // If loading, show loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-f1-red via-red-600 to-red-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">Caricamento...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show login page
  return (
    <div className="min-h-screen bg-gradient-to-br from-f1-red via-red-600 to-red-800 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="relative bg-white/95 backdrop-blur-sm p-8 md:p-12 rounded-2xl shadow-2xl max-w-md w-full border border-white/20">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-f1-red to-red-700 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl font-bold">F1</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">FantaF1</h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            Entra nel mondo del <span className="font-semibold text-f1-red">Fantasy Formula 1</span>
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Sfida i tuoi amici e diventa il campione!
          </p>
        </div>

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full group relative overflow-hidden bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 rounded-xl py-4 px-6 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          <div className="flex items-center justify-center gap-4">
            <svg width="24" height="24" viewBox="0 0 24 24" className="flex-shrink-0">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span className="text-gray-700 font-semibold text-lg">Accedi con Google</span>
          </div>

          {/* Hover effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>

        {/* Features */}
        <div className="mt-8 space-y-3">
          <div className="flex items-center gap-3 text-gray-600">
            <div className="w-2 h-2 bg-f1-red rounded-full"></div>
            <span className="text-sm">Pronostici sui podi delle gare</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <div className="w-2 h-2 bg-f1-red rounded-full"></div>
            <span className="text-sm">Classifica in tempo reale</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <div className="w-2 h-2 bg-f1-red rounded-full"></div>
            <span className="text-sm">Sfide con i tuoi amici</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500 leading-relaxed">
            Accedendo accetti i nostri{' '}
            <span className="text-f1-red font-medium">termini di servizio</span>{' '}
            e la{' '}
            <span className="text-f1-red font-medium">privacy policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}
