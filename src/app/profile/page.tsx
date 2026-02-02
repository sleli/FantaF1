'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { withAuth } from '@/components/auth/withAuth';
import PublicLayout from '@/components/layout/PublicLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useEffect, useState } from 'react';

function ProfilePage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <PublicLayout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6 text-foreground">Il tuo profilo</h1>
        
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex items-center mb-6">
              {session?.user?.image && (
                <img 
                  src={session.user.image} 
                  alt={session.user.name || 'Profile picture'} 
                  className="w-16 h-16 rounded-full mr-4 border-2 border-primary p-0.5"
                />
              )}
              
              <div>
                <h2 className="text-xl font-semibold text-foreground">{session?.user?.name}</h2>
                <p className="text-muted-foreground">{session?.user?.email}</p>
                <div className="mt-2">
                  <Badge variant={isAdmin ? 'success' : 'neutral'}>
                    {isAdmin ? 'ADMIN' : 'GIOCATORE'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              {isAdmin && (
                <Link href="/admin" className="w-full">
                  <Button variant="outline" className="w-full">
                    Pannello Admin
                  </Button>
                </Link>
              )}
              
              <Button 
                variant="secondary" 
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full"
              >
                Esci
              </Button>
            </div>
          </div>
        </Card>

        {/* Theme Settings */}
        <Card className="mb-6">
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4 text-foreground">Aspetto</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setTheme('dark')}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  theme === 'dark' 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border hover:border-muted-foreground text-muted-foreground'
                }`}
              >
                <div className="w-full h-20 rounded border border-border relative overflow-hidden mb-2" style={{ backgroundColor: '#0b0b0d' }}>
                  <div className="absolute top-0 left-0 right-0 h-4 border-b border-border" style={{ backgroundColor: '#101014' }}></div>
                  <div className="absolute top-8 left-2 right-2 h-2 rounded-full w-1/2" style={{ backgroundColor: '#1a1a24' }}></div>
                </div>
                <span className="font-bold">Tema Scuro</span>
              </button>

              <button
                onClick={() => setTheme('light')}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  theme === 'light' 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border hover:border-muted-foreground text-muted-foreground'
                }`}
              >
                <div className="w-full h-20 rounded border border-border relative overflow-hidden mb-2" style={{ backgroundColor: '#f3f4f6' }}>
                  <div className="absolute top-0 left-0 right-0 h-4 border-b border-border" style={{ backgroundColor: '#ffffff' }}></div>
                  <div className="absolute top-8 left-2 right-2 h-2 rounded-full w-1/2" style={{ backgroundColor: '#d1d5db' }}></div>
                </div>
                <span className="font-bold">Tema Chiaro</span>
              </button>
            </div>
          </div>
        </Card>


      </div>
    </PublicLayout>
  );
}

// Export the component wrapped with auth protection
export default withAuth(ProfilePage);
