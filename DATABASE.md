# Database Setup - FantaF1

## Prerequisiti

1. **PostgreSQL installato** sul sistema locale o accesso a un database PostgreSQL remoto
2. **Database FantaF1 creato** (può essere vuoto)

## Setup Rapido

### 1. Configurazione Environment Variables

Copia il file di esempio e configuralo:
```bash
cp .env.example .env.local
```

Modifica `.env.local` con i tuoi dati:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/fantaf1?schema=public"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 2. Push dello Schema

Applica lo schema al database:
```bash
npm run db:push
```

Questo comando:
- Applica lo schema Prisma al database
- Esegue automaticamente il seed con i piloti F1 2025

### 3. Alternative: Migrazioni

Se preferisci usare le migrazioni:
```bash
npx prisma migrate dev --name init
npm run db:seed
```

## Schema Database

### Modelli Principali

- **User**: Utenti con ruoli (ADMIN/PLAYER)
- **Driver**: Piloti F1 con team e numero
- **Event**: Eventi di gara (RACE/SPRINT) con stati
- **Prediction**: Pronostici utente per evento

### Relazioni

- Un User può avere molte Prediction
- Un Event può avere molte Prediction  
- Una Prediction appartiene a un User e un Event
- Driver sono referenziati nei pronostici e risultati

## Comandi Utili

```bash
# Visualizza database in Prisma Studio
npx prisma studio

# Reset completo database + seed
npm run db:reset

# Solo seed (popola piloti)
npm run db:seed

# Genera client Prisma dopo modifiche schema
npx prisma generate

# Applica schema senza migrazioni
npx prisma db push
```

## Struttura Dati Iniziali

Il seed crea automaticamente:
- ✅ 20 piloti F1 2025 con team e numeri
- ✅ Un utente admin (admin@fantaf1.com)

## Prossimi Passi

Dopo il setup database:
1. Configurare NextAuth.js providers
2. Creare API routes per CRUD operations
3. Implementare middleware di autenticazione
4. Sviluppare interfacce per gestione eventi
