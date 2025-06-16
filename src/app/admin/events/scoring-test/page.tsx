import ScoringTestComponent from '@/components/admin/ScoringTestComponent';

export default function ScoringTestPage() {
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Scoring System Test</h1>
      <ScoringTestComponent />
      
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">📝 Come usare:</h3>
        <ol className="list-decimal list-inside text-blue-800 space-y-1">
          <li>Vai su Prisma Studio (localhost:5556 o 5557)</li>
          <li>Copia l'ID di un evento con risultati (Australia o China GP)</li>
          <li>Incolla l'ID qui sopra e clicca "Calculate Scores"</li>
          <li>Verifica che i punteggi vengano calcolati correttamente</li>
        </ol>
      </div>
    </main>
  );
}
