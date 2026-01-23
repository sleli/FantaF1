'use client';

import { useState, useRef, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { 
  UserIcon, 
  Cog6ToothIcon, 
  ArrowRightOnRectangleIcon, 
  CommandLineIcon,
  ChevronDownIcon 
} from '@heroicons/react/24/outline';

interface UserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isAdmin = user.role === 'ADMIN';

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-f1-red/20"
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || 'User'}
            className="w-9 h-9 rounded-full border border-gray-200 object-cover"
          />
        ) : (
          <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200 text-gray-600">
            <UserIcon className="w-5 h-5" />
          </div>
        )}
        <span className="hidden md:block font-medium text-sm text-gray-700 max-w-[100px] truncate">
          {user.name}
        </span>
        <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform duration-200 hidden md:block ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
          {/* User Header */}
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>

          {/* Menu Items */}
          <div className="p-1">
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-f1-red font-medium rounded-lg hover:bg-red-50 transition-colors"
              >
                <CommandLineIcon className="w-4 h-4" />
                Admin Dashboard
              </Link>
            )}

            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <UserIcon className="w-4 h-4" />
              Il mio Profilo
            </Link>

            <button
              onClick={() => console.log('Settings clicked')} // Placeholder
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <Cog6ToothIcon className="w-4 h-4" />
              Impostazioni
            </button>
          </div>

          {/* Footer */}
          <div className="p-1 border-t border-gray-50">
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors text-left"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              Esci
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
