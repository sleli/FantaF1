export default function DatabaseStatusPage() {
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-foreground mb-6">📊 FantaF1 System Status</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Links */}
        <div className="bg-card text-card-foreground border border-border p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-foreground mb-4">🔗 Quick Links</h2>
          <div className="space-y-2">
            <a href="/admin/events" className="block text-primary hover:underline">
              📅 Admin Events Management
            </a>
            <a href="/admin/events/scoring-test" className="block text-primary hover:underline">
              🏆 Scoring System Test
            </a>
            <a href="/leaderboard" className="block text-primary hover:underline">
              🏁 Leaderboard
            </a>
            <a href="/predictions" className="block text-primary hover:underline">
              🎯 Predictions
            </a>
            <a href="http://localhost:5556" target="_blank" className="block text-primary hover:underline">
              🗄️ Prisma Studio (5556)
            </a>
            <a href="http://localhost:5557" target="_blank" className="block text-primary hover:underline">
              🗄️ Prisma Studio (5557)
            </a>
          </div>
        </div>
        
        {/* Test Credentials */}
        <div className="bg-card text-card-foreground border border-border p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-foreground mb-4">🔑 Test Credentials</h2>
          <div className="space-y-3">
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded">
              <strong className="text-destructive">Admin User:</strong>
              <div className="text-sm text-destructive">
                📧 admin@fantaf1.com<br/>
                👤 Admin FantaF1
              </div>
            </div>
            <div className="p-3 bg-primary/10 border border-primary/20 rounded">
              <strong className="text-primary">Test Players:</strong>
              <div className="text-sm text-muted-foreground">
                📧 user1@test.com (Mario Rossi)<br/>
                📧 user2@test.com (Luigi Bianchi)
              </div>
            </div>
          </div>
        </div>
        
        {/* Test Scenario */}
        <div className="bg-card text-card-foreground border border-border p-6 rounded-lg shadow-md md:col-span-2">
          <h2 className="text-lg font-semibold text-foreground mb-4">🧪 Test Scenario</h2>
          <div className="bg-muted p-4 rounded-lg border border-border">
            <h3 className="font-medium text-foreground mb-2">Complete Workflow Test:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li><strong>Database:</strong> 30 F1 2025 events seeded with realistic dates and status</li>
              <li><strong>Results:</strong> Australia GP and China GP have complete podium results</li>
              <li><strong>Predictions:</strong> Test users have predictions for completed events</li>
              <li><strong>Admin Access:</strong> Login as admin to manage events and insert results</li>
              <li><strong>Scoring:</strong> Use scoring test page to calculate points automatically</li>
              <li><strong>Leaderboard:</strong> Check general and event-specific classifications</li>
            </ol>
          </div>
        </div>
        
        {/* Features Status */}
        <div className="bg-card text-card-foreground border border-border p-6 rounded-lg shadow-md md:col-span-2">
          <h2 className="text-lg font-semibold text-foreground mb-4">✅ Implemented Features Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-green-500 mb-2">✅ Tasks 007-010 Completed:</h4>
              <ul className="text-sm space-y-1">
                <li>🎯 <strong>Task 007:</strong> Prediction System (CRUD + validation)</li>
                <li>⚙️ <strong>Task 008:</strong> Admin Results Insertion</li>
                <li>🏆 <strong>Task 009:</strong> Scoring Calculation Engine</li>
                <li>📊 <strong>Task 010:</strong> Dashboard/Leaderboards</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-primary mb-2">🔧 Technical Features:</h4>
              <ul className="text-sm space-y-1">
                <li>🛡️ Authentication & Authorization</li>
                <li>📱 Responsive UI/UX</li>
                <li>🔄 Real-time data updates</li>
                <li>🎨 Modern Tailwind CSS design</li>
                <li>⚡ Automatic scoring triggers</li>
                <li>📋 Complete F1 2025 calendar</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
