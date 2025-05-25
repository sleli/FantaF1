'use client';
import { useSession } from 'next-auth/react';
import TestTailwind from '../components/TestTailwind';
import AuthStatus from '@/components/auth/AuthStatus';

export default function Home() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-f1-red to-red-800">
        <div className="card max-w-md mx-auto text-center">
          <h1 className="text-4xl font-bold text-f1-dark mb-4">FantaF1</h1>
          <p className="text-gray-600 mb-6">Benvenuto nella piattaforma Fantasy Formula 1</p>
          <AuthStatus />
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-f1-red">FantaF1</h1>
            <AuthStatus />
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="card mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Dashboard FantaF1</h2>
          <p className="text-gray-600 mb-6">
            Benvenuto nella tua dashboard! Qui potrai gestire i tuoi pronostici per le gare di Formula 1.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card bg-blue-50 border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Prossima Gara</h3>
              <p className="text-blue-700">Configura il database per vedere i prossimi eventi</p>
            </div>
            
            <div className="card bg-green-50 border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-2">I Tuoi Punti</h3>
              <p className="text-green-700">Completa il setup per iniziare a raccogliere punti</p>
            </div>
            
            <div className="card bg-yellow-50 border-yellow-200">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">Classifica</h3>
              <p className="text-yellow-700">Vedi come stai andando rispetto agli altri</p>
            </div>
          </div>
        </div>
        
        <TestTailwind />
      </main>
    </div>
  );
}
