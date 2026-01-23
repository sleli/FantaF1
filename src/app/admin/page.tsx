'use client'

import { useEffect, useState } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import Card from '@/components/ui/Card';

interface AdminStats {
  totalUsers: number;
  totalDrivers: number;
  activeDrivers: number;
  totalEvents: number;
  totalPredictions: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalDrivers: 0,
    activeDrivers: 0,
    totalEvents: 0,
    totalPredictions: 0
  });
  const [isLoading, setIsLoading] = useState(true);



  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch drivers stats
      const driversResponse = await fetch('/api/admin/drivers');
      if (driversResponse.ok) {
        const driversData = await driversResponse.json();
        const drivers = driversData.drivers || [];
        setStats(prev => ({
          ...prev,
          totalDrivers: drivers.length,
          activeDrivers: drivers.filter((d: any) => d.active).length
        }));
      }

      // Fetch users stats
      const usersResponse = await fetch('/api/admin/users?activeEvent=true');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        const users = usersData.users || [];
        setStats(prev => ({
          ...prev,
          totalUsers: users.length,
          totalPredictions: users.reduce((sum: number, user: any) => sum + (user._count?.predictions || 0), 0)
        }));
      }

      // Fetch events stats
      const eventsResponse = await fetch('/api/admin/events?active=true');
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        const events = eventsData.events || [];

        setStats(prev => ({
          ...prev,
          totalEvents: events.length
        }));
      }
      
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div>
      <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Amministrativa</h1>
      <p className="text-muted-foreground mb-8">Panoramica generale del sistema FantaF1</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Stats cards */}
        <Card>
          <div className="p-6">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Utenti Totali</h2>
          <p className="text-3xl font-bold mt-2 text-primary">
            {isLoading ? '...' : stats.totalUsers}
          </p>
          </div>
        </Card>
        
        <Card>
          <div className="p-6">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Piloti Attivi</h2>
          <p className="text-3xl font-bold mt-2 text-green-500">
            {isLoading ? '...' : stats.activeDrivers}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            su {stats.totalDrivers} totali
          </p>
          </div>
        </Card>
        
        <Card>
          <div className="p-6">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Evento Attivo</h2>
          <p className="text-3xl font-bold mt-2 text-purple-500">
            {isLoading ? '...' : stats.totalEvents}
          </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pronostici (Attivo)</h2>
          <p className="text-3xl font-bold mt-2 text-orange-500">
            {isLoading ? '...' : stats.totalPredictions}
          </p>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-foreground mb-4">Azioni Rapide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link 
            href="/admin/drivers" 
            className="p-4 bg-card border border-border rounded-lg hover:border-primary/50 hover:bg-foreground/5 transition-colors"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🏎️</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-foreground">Gestisci Piloti</h3>
                <p className="text-xs text-muted-foreground">Aggiungi o modifica piloti</p>
              </div>
            </div>
          </Link>

          <Link 
            href="/admin/events" 
            className="p-4 bg-card border border-border rounded-lg hover:border-primary/50 hover:bg-foreground/5 transition-colors"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📅</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-foreground">Eventi</h3>
                <p className="text-xs text-muted-foreground">Crea nuovi eventi</p>
              </div>
            </div>
          </Link>

          <Link 
            href="/admin/users" 
            className="p-4 bg-card border border-border rounded-lg hover:border-primary/50 hover:bg-foreground/5 transition-colors"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">👥</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-foreground">Utenti</h3>
                <p className="text-xs text-muted-foreground">Gestisci utenti</p>
              </div>
            </div>
          </Link>

          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📊</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-foreground">Statistiche</h3>
                <p className="text-xs text-muted-foreground">Prossimamente</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      

    </div>
  );
}
