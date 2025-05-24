export default function TestTailwind() {
  return (
    <div className="bg-f1-red text-white p-4 m-4 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-2">Tailwind CSS Test</h2>
      <p className="text-sm">
        Se vedi questo componente con sfondo rosso F1, Tailwind CSS è configurato correttamente!
      </p>
      <button className="btn-primary mt-4">
        Pulsante di Test
      </button>
    </div>
  );
}
