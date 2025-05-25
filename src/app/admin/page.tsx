import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard | FantaF1',
  description: 'Dashboard amministrativa di FantaF1',
};

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard Amministrativa</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Stats cards */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-medium text-gray-700">Utenti Totali</h2>
          <p className="text-3xl font-bold mt-2">--</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-medium text-gray-700">Eventi Attivi</h2>
          <p className="text-3xl font-bold mt-2">--</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-medium text-gray-700">Pronostici Totali</h2>
          <p className="text-3xl font-bold mt-2">--</p>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Prossimi Eventi</h2>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 text-center text-gray-500">
            Nessun evento in programma
          </div>
        </div>
      </div>
    </div>
  );
}
