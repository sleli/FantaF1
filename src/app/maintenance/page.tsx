export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        {/* Logo/Icon */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        {/* Titolo */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🏎️ FantaF1
        </h1>
        
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          Sito in Manutenzione
        </h2>

        {/* Messaggio */}
        <div className="space-y-4 text-gray-600 mb-8">
          <p className="text-lg">
            Stiamo lavorando per migliorare la tua esperienza!
          </p>
          <p>
            Il sito è temporaneamente non disponibile per manutenzione programmata.
          </p>
          <p className="text-sm">
            Ci scusiamo per l'inconveniente e torneremo online il prima possibile.
          </p>
        </div>

        {/* Informazioni di contatto */}
        <div className="border-t border-gray-200 pt-6">
          <p className="text-sm text-gray-500 mb-2">
            Per informazioni urgenti:
          </p>
          <p className="text-sm text-gray-600">
            📧 Contatta l'amministratore
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-xs text-gray-400">
          <p>© 2024 FantaF1 - Formula 1 Fantasy League</p>
        </div>
      </div>
    </div>
  )
}

// Metadata per la pagina
export const metadata = {
  title: 'Manutenzione - FantaF1',
  description: 'Il sito è temporaneamente in manutenzione',
  robots: 'noindex, nofollow',
}
