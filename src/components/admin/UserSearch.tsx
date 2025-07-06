'use client';

import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface UserSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  totalUsers: number;
  filteredUsers: number;
}

export default function UserSearch({
  searchTerm,
  onSearchChange,
  totalUsers,
  filteredUsers
}: UserSearchProps) {
  const handleClear = () => {
    onSearchChange('');
  };

  return (
    <div className="flex-1 max-w-md">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cerca utenti per nome o email..."
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-red-500 focus:border-red-500 text-sm"
        />
        
        {searchTerm && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
              title="Cancella ricerca"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
      
      {/* Search Results Info */}
      <div className="mt-2 text-sm text-gray-600">
        {searchTerm ? (
          <span>
            Mostrando {filteredUsers} di {totalUsers} utenti
            {filteredUsers !== totalUsers && (
              <span className="ml-2 text-blue-600">
                (filtrati per "{searchTerm}")
              </span>
            )}
          </span>
        ) : (
          <span>
            {totalUsers} utenti totali
          </span>
        )}
      </div>
    </div>
  );
}
