'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { UserGroupIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import UserList from '@/components/admin/UserList';
import UserForm from '@/components/admin/UserForm';

type UserRole = 'PLAYER' | 'ADMIN';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  _count: {
    predictions: number;
  };
}

export default function UsersAdminPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Redirect se non admin
  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user || session.user.role !== 'ADMIN') {
      redirect('/');
    }
  }, [session, status]);

  // Carica utenti
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching users...', { session: !!session, role: session?.user?.role });
      
      const response = await fetch('/api/admin/users');
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', { status: response.status, data: errorData });
        
        if (response.status === 401) {
          throw new Error('Sessione scaduta. Ricarica la pagina per effettuare nuovamente il login.');
        }
        
        throw new Error(errorData.error || 'Errore nel caricamento degli utenti');
      }
      
      const data = await response.json();
      console.log('Users fetched successfully:', { count: data.users?.length });
      
      setUsers(data.users || []);
      
    } catch (err) {
      console.error('Fetch users error:', err);
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  };

  // Refresh utenti
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  // Elimina utente
  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (!confirm(`Eliminare definitivamente l'utente "${user.name}"?\n\nQuesta azione non può essere annullata.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Errore nell\'eliminazione');
      }

      // Rimuovi utente dall'elenco locale
      setUsers(prev => prev.filter(u => u.id !== userId));
      
      console.log('User deleted successfully:', userId);
    } catch (err) {
      console.error('Delete user error:', err);
      alert(err instanceof Error ? err.message : 'Errore nell\'eliminazione');
    }
  };

  // Gestione form
  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  const handleSaveUser = () => {
    setEditingUser(null);
    fetchUsers(); // Ricarica la lista
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  // Carica dati iniziali
  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [session]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento utenti...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Errore nel Caricamento
            </h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {refreshing ? 'Ricaricamento...' : 'Riprova'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Gestione Utenti
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Gestisci gli utenti registrati, i loro ruoli e le statistiche
                </p>
              </div>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Aggiornamento...' : 'Aggiorna'}
            </button>
          </div>
        </div>

        {/* Content */}
        <UserList
          users={users}
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
          onRefresh={handleRefresh}
        />

        {/* Form di modifica */}
        {editingUser && (
          <UserForm
            user={editingUser}
            onSave={handleSaveUser}
            onCancel={handleCancelEdit}
          />
        )}
      </div>
    </div>
  );
}
