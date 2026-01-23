import React, { useState } from 'react';
import { 
  PencilIcon, 
  TrashIcon, 
  UserIcon, 
  ShieldCheckIcon,
  UserGroupIcon,
  ChartBarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

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

interface UserListProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  onRefresh: () => void;
}

export default function UserList({ users, onEdit, onDelete, onRefresh }: UserListProps) {
  const [filters, setFilters] = useState({
    role: 'all',
    search: ''
  });
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'role' | 'predictions' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const formatDate = (dateString: string) => {
    // Mostra la data UTC esattamente come salvata nel DB
    return new Date(dateString).toISOString().slice(0, 16).replace('T', ' ');
  };

  const getRoleIcon = (role: UserRole) => {
    return role === 'ADMIN' 
      ? <ShieldCheckIcon className="h-5 w-5 text-red-500" />
      : <UserIcon className="h-5 w-5 text-blue-500" />;
  };

  const getRoleText = (role: UserRole) => {
    return role === 'ADMIN' ? 'Amministratore' : 'Giocatore';
  };

  const getRoleColor = (role: UserRole) => {
    return role === 'ADMIN' 
      ? 'bg-destructive/10 text-destructive border border-destructive/20'
      : 'bg-primary/10 text-primary border border-primary/20';
  };

  const canDelete = (user: User) => {
    return user._count.predictions === 0;
  };

  // Filtra utenti
  const filteredUsers = users.filter(user => {
    const matchesRole = filters.role === 'all' || user.role === filters.role;
    const matchesSearch = filters.search === '' || 
      user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.email.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesRole && matchesSearch;
  });

  // Ordina utenti
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    if (sortBy === 'predictions') {
      aValue = a._count.predictions;
      bValue = b._count.predictions;
    } else {
      aValue = a[sortBy];
      bValue = b[sortBy];
    }

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: typeof sortBy) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  // Statistiche
  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'ADMIN').length,
    users: users.filter(u => u.role === 'PLAYER').length,
    withPredictions: users.filter(u => u._count.predictions > 0).length,
    totalPredictions: users.reduce((sum, u) => sum + u._count.predictions, 0)
  };

  if (users.length === 0) {
    return (
      <div className="bg-card text-card-foreground border border-border rounded-lg shadow p-8 text-center">
        <UserGroupIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          Nessun utente trovato
        </h3>
        <p className="text-muted-foreground">
          Gli utenti registrati appariranno qui
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-card border border-border p-4 rounded-lg shadow">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-muted-foreground">Totale Utenti</p>
              <p className="text-2xl font-semibold text-foreground">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card border border-border p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-muted-foreground">Amministratori</p>
              <p className="text-2xl font-semibold text-foreground">{stats.admins}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card border border-border p-4 rounded-lg shadow">
          <div className="flex items-center">
            <UserIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-muted-foreground">Giocatori</p>
              <p className="text-2xl font-semibold text-foreground">{stats.users}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card border border-border p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-muted-foreground">Con Pronostici</p>
              <p className="text-2xl font-semibold text-foreground">{stats.withPredictions}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card border border-border p-4 rounded-lg shadow">
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-muted-foreground">Tot. Pronostici</p>
              <p className="text-2xl font-semibold text-foreground">{stats.totalPredictions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtri */}
      <div className="bg-card border border-border p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-muted-foreground mb-1">
              Cerca utenti
            </label>
            <input
              type="text"
              id="search"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Nome o email..."
              className="w-full px-3 py-2 border border-border bg-input text-foreground rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div>
            <label htmlFor="role-filter" className="block text-sm font-medium text-muted-foreground mb-1">
              Filtra per ruolo
            </label>
            <select
              id="role-filter"
              value={filters.role}
              onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
              className="px-3 py-2 border border-border bg-input text-foreground rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Tutti i ruoli</option>
              <option value="PLAYER">Solo Giocatori</option>
              <option value="ADMIN">Solo Admin</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="block lg:hidden space-y-4">
        {sortedUsers.map((user) => (
          <div key={user.id} className="bg-card text-card-foreground rounded-lg shadow border border-border overflow-hidden">
            {/* Card Header */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getRoleIcon(user.role)}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-foreground truncate">{user.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(user)}
                    className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-primary touch-target"
                    aria-label="Edit user"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onDelete(user.id)}
                    className="p-2 rounded-md text-destructive hover:bg-destructive/10 focus:outline-none focus:ring-2 focus:ring-destructive touch-target"
                    aria-label="Delete user"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Card Content */}
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Ruolo:</span>
                  <p className="font-medium">
                    {user.role === 'ADMIN' ? 'Amministratore' : 'Giocatore'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Pronostici:</span>
                  <p className="font-medium">{user._count.predictions}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Registrato il:</span>
                  <p className="font-medium">{formatDate(user.createdAt)}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">ID:</span>
                  <p className="font-medium text-xs">{user.id.slice(-8)}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden lg:block bg-card text-card-foreground border border-border rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="f1-table min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-foreground/5"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Nome {getSortIcon('name')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-foreground/5"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center">
                    Email {getSortIcon('email')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-foreground/5"
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center">
                    Ruolo {getSortIcon('role')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-foreground/5"
                  onClick={() => handleSort('predictions')}
                >
                  <div className="flex items-center">
                    Pronostici {getSortIcon('predictions')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-foreground/5"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center">
                    Registrato {getSortIcon('createdAt')}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {sortedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-foreground/5">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getRoleIcon(user.role)}
                      <div className="ml-3">
                        <div className="text-sm font-medium text-foreground">
                          {user.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ID: {user.id.slice(-8)}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">{user.email}</div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {getRoleText(user.role)}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    <div className="flex items-center">
                      <span className="font-medium">{user._count.predictions}</span>
                      {user._count.predictions > 0 && (
                        <span className="ml-1 text-muted-foreground">pronostici</span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {formatDate(user.createdAt)}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {/* Edit */}
                      <button
                        onClick={() => onEdit(user)}
                        className="text-primary hover:text-primary/90 p-1"
                        title="Modifica utente"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      
                      {/* Delete */}
                      {canDelete(user) && (
                        <button
                          onClick={() => onDelete(user.id)}
                          className="text-destructive hover:text-destructive/90 p-1"
                          title="Elimina utente"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                      
                      {!canDelete(user) && (
                        <span className="text-muted-foreground text-xs" title="Non eliminabile: utente con pronostici">
                          🔒
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {sortedUsers.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nessun utente trovato con i filtri applicati</p>
          </div>
        )}
      </div>
    </div>
  );
}
