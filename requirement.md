# Overview

Questo prodotto è una piattaforma web per gestire un gioco personalizzato di Fanta Formula 1, pensato per piccoli gruppi di amici. Ogni utente può fare un pronostico sui primi tre classificati di una gara (sia principale che sprint), ottenendo punti in base alla correttezza delle previsioni. La piattaforma automatizza il processo di inserimento pronostici, gestione eventi e calcolo punteggi, offrendo una dashboard di classifica aggiornata.

# Core Features

### Autenticazione e gestione utenti

* Login/logout per utenti registrati
* Due ruoli: "Admin" (gestione eventi e risultati) e "Giocatore" (solo pronostici)
* Importante per tracciare le azioni, garantire la sicurezza e offrire funzionalità diversificate

### Gestione Eventi (solo Admin)

* Creazione evento: tipo (Race o Sprint), nome, data, data di chiusura invio pronostici
* Impostazione ordine di arrivo reale post-gara
* Modifica evento finché non concluso

### Invio Pronostici (Giocatori e Admin)

* Selezione dei primi 3 piloti da una lista predefinita
* Invio pronostico solo prima della data di chiusura
* Possibilità di modifica fino alla chiusura
* Blocchi logici per evitare errori (duplicati, fuori tempo)

### Calcolo Punteggi automatico

* Confronto tra pronostico e risultato reale
* Regole:

  * 25 punti per il 1° corretto
  * 15 punti per il 2° corretto
  * 10 punti per il 3° corretto
  * 5 punti per ogni pilota presente nei primi 3 ma fuori ordine
  * Tutti i valori dimezzati per eventi Sprint

### Dashboard Classifiche

* Classifica generale aggiornata in tempo reale
* Classifica per evento
* Dettaglio dei punteggi ottenuti da ciascun utente per ogni evento

# User Experience

### User Personas

* **Giocatore**: accede alla piattaforma per fare pronostici e consultare le classifiche
* **Admin**: gestisce il calendario eventi, inserisce i risultati ufficiali e monitora il sistema

### Key User Flows

* Login → Scelta evento → Invio/modifica pronostico → Visualizzazione classifica
* Login (Admin) → Creazione evento → Chiusura evento → Inserimento risultati → Classifica aggiornata

### UI/UX Considerations

* Interfaccia responsive (mobile-friendly)
* Dropdown per selezione piloti
* Notifiche per conferme/avvisi
* Stato eventi ben visibile (attivo, chiuso, completato)

# Technical Architecture

### System Components

* Frontend: Next.js + Tailwind CSS
* Autenticazione: NextAuth.js (componenti UI predefiniti, gestione ruoli via database)
* Backend/API: API Routes integrate in Next.js
* Database: PostgreSQL (connessione diretta)
* ORM: Prisma per accesso dati e gestione migrazioni
* Stato client: Zustand o React Context
* Deploy: Vercel (hosting frontend + backend)

### Data Models

* Utente: id, nome, email, password, ruolo
* Evento: id, nome, tipo, data, chiusura, stato, ordine\_arrivo
* Pronostico: id, utente\_id, evento\_id, posizioni (array piloti)
* Pilota: id, nome

### APIs

* Autenticazione (login, logout, verifica ruoli)
* CRUD eventi (solo admin)
* Invio/modifica pronostici
* Calcolo e fetch punteggi
* Classifiche

### Infrastructure Requirements

* Hosting su Vercel (frontend + backend API)
* Database PostgreSQL (connessione diretta tramite Prisma)
* NextAuth.js per gestione utenti, login, ruoli e sessioni
* Sicurezza integrata via NextAuth.js (token, ruoli, protezione route) (frontend + backend API)
* Backup database gestito dal provider PostgreSQL
* Sicurezza: bcrypt per password, JWT per sessioni

# Development Roadmap

### AI Task Breakdown (Step-by-Step Sviluppo)

#### Fase 1 – Setup base

1. Inizializzare progetto Next.js con TypeScript e Tailwind CSS
2. Integrare NextAuth.js per autenticazione (registrazione, login, gestione sessioni)
3. Configurare connessione PostgreSQL e configurare Prisma ORM
4. Definire schema iniziale del database: utenti, piloti, eventi, pronostici

#### Fase 2 – Autenticazione e ruoli

5. Aggiungere logica per distinguere ruoli (admin/giocatore) via database utenti con NextAuth.js
6. Proteggere le route (pagina admin, invio pronostico) in base al ruolo

#### Fase 3 – Gestione dati base

7. Creare CRUD per piloti (solo admin, oppure popolamento statico)
8. Creare interfaccia e backend per CRUD eventi (admin): nome, tipo, data, chiusura
9. Creare form per invio/modifica pronostici (utente), solo eventi attivi

#### Fase 4 – Funzionalità core

10. Implementare logica di blocco pronostici oltre data di chiusura
11. Interfaccia admin per inserimento risultato ufficiale dell’evento
12. Scrivere funzione di calcolo punteggio secondo le regole definite (Race vs Sprint)
13. Salvataggio punteggi nel database associati ad ogni utente e evento

#### Fase 5 – Dashboard e classifica

14. Creare dashboard utente con i propri pronostici e punteggi
15. Creare classifica evento (confronto tra punteggi giocatori)
16. Creare classifica generale cumulativa (somma dei punteggi)

#### Fase 6 – Rifiniture e UX

17. Mostrare stato evento (attivo, chiuso, concluso)
18. Aggiungere notifiche (es. conferma invio/modifica, errore su date)
19. Ottimizzare UI responsive mobile e migliorare l’aspetto grafico

#### Fase 7 – Extra

20. Implementare esportazione dati (CSV/JSON)
21. Aggiungere componenti di statistiche avanzate giocatore (media, tendenze)
22. Integrazione Telegram/Discord per alert
23. Modalità torneo multi-stagione (future season logic)

### MVP Requirements

* Login e gestione ruoli
* Creazione/modifica eventi
* Selezione piloti e invio pronostici
* Calcolo punteggi post-risultato
* Dashboard classifica

### Future Enhancements

* Notifiche email
* Statistiche giocatore avanzate
* Integrazione Telegram o Discord
* Modalità tornei a più stagioni

# Logical Dependency Chain

1. Sistema di autenticazione e ruoli
2. CRUD eventi + gestione piloti
3. Interfaccia invio/modifica pronostico
4. Meccanismo di chiusura evento e blocco pronostici
5. Inserimento risultati + calcolo punteggi
6. Visualizzazione classifica evento e generale

# Risks and Mitigations

* **Rischio**: Conflitti nei ruoli o accessi non autorizzati

  * *Mitigazione*: sistema di autorizzazione e validazione robusta
* **Rischio**: Complessità nel calcolo punteggi

  * *Mitigazione*: testing approfondito del motore di scoring
* **Rischio**: Risorse limitate per evoluzioni future

  * *Mitigazione*: architettura modulare facilmente estensibile

# Appendix

* Lista piloti aggiornata manualmente a inizio stagione
* Possibilità di import/export pronostici e risultati via CSV/JSON
