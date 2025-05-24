# FantaF1 - Piattaforma Fanta Formula 1

Piattaforma web per gestire un gioco personalizzato di Fanta Formula 1, pensato per piccoli gruppi di amici.

## Tecnologie utilizzate

- Next.js (App Router, `src/` structure)
- NextAuth.js per autenticazione e gestione ruoli
- PostgreSQL database (connessione diretta)
- Prisma ORM
- TypeScript e Tailwind CSS

## Funzionalità

- **Autenticazione e Ruoli**: Sistema di login con ruoli Admin e Giocatore
- **Gestione Eventi**: Creazione e gestione di eventi F1 (Race/Sprint)
- **Sistema Pronostici**: Invio pronostici sui primi 3 classificati
- **Calcolo Punteggi**: Sistema automatico di calcolo punteggi
- **Classifiche**: Dashboard con classifiche generale e per evento

## Setup

1. Installa le dipendenze:
   ```bash
   npm install
   ```

2. Configura le variabili d'ambiente:
   ```bash
   cp .env.example .env.local
   ```
   Modifica `.env.local` con i tuoi dati PostgreSQL.

3. Configura database e schema:
   ```bash
   # Opzione 1: Push schema diretto (raccomandato per sviluppo)
   npm run db:push
   
   # Opzione 2: Migrazioni (per production)
   npx prisma migrate dev --name init
   npm run db:seed
   ```

4. Testa la configurazione database:
   ```bash
   npx tsx scripts/test-db.ts
   ```

5. Avvia il server di sviluppo:
   ```bash
   npm run dev
   ```

## Variabili d'Ambiente

Modifica `.env.local` e imposta:

```env
# Database PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/fantaf1?schema=public"

# NextAuth.js Authentication
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (obbligatorio)
GOOGLE_ID="your-google-client-id"
GOOGLE_SECRET="your-google-client-secret"
```

## Comandi Database

```bash
# Push dello schema (per sviluppo)
npm run db:push

# Seed del database (piloti F1 2025)
npm run db:seed

# Reset completo database
npm run db:reset

# Test connessione database
npx tsx scripts/test-db.ts

# Visualizza database in Prisma Studio
npx prisma studio
```

## Struttura Progetto

```
src/
├── app/                 # Next.js App Router
│   ├── api/auth/       # NextAuth.js API routes
│   ├── globals.css     # Stili globali + Tailwind
│   └── layout.tsx      # Layout principale
├── components/         # Componenti React riutilizzabili
└── lib/               # Utility e configurazioni
    ├── prisma.ts      # Client Prisma
    ├── types.ts       # Tipi TypeScript
    └── scoring.ts     # Logiche calcolo punteggi

prisma/
├── schema.prisma      # Schema database
└── seed.ts           # Dati iniziali (piloti F1)
```

## Prossimi Passi

- ✅ Task 001: Setup Next.js + TypeScript + Tailwind
- ✅ Task 002: NextAuth.js integration  
- ✅ Task 003: PostgreSQL + Prisma setup
- 🔄 Task 004: Route protection e middleware
- 📋 Task 005: Gestione piloti CRUD
- 📋 Task 006: Sistema eventi (Admin)
- 📋 Task 007: Sistema pronostici
- 📋 Task 008: Inserimento risultati
- 📋 Task 009: Calcolo punteggi automatico
- 📋 Task 010: Dashboard classifiche  
- 📋 Task 011: UI/UX ottimizzazione

## Contribuire

1. Fork del progetto
2. Crea feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit modifiche (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri Pull Request

