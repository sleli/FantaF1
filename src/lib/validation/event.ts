import { z } from 'zod';

export const eventValidation = z.object({
  name: z.string()
    .min(1, 'Il nome è obbligatorio')
    .max(100, 'Il nome non può superare i 100 caratteri')
    .regex(/^[a-zA-Z0-9\s\-_'àáâäèéêëìíîïòóôöùúûüñç]+$/,
           'Il nome può contenere solo lettere, numeri, spazi, trattini e apostrofi'),
  
  type: z.enum(['RACE', 'SPRINT'], {
    errorMap: () => ({ message: 'Il tipo deve essere RACE o SPRINT' })
  }),
  
  date: z.string()
    .datetime('Formato data non valido')
    .refine((dateStr) => {
      const date = new Date(dateStr);
      const now = new Date();
      return date > now;
    }, 'La data dell\'evento deve essere futura'),
  
  closingDate: z.string()
    .datetime('Formato data di chiusura non valido'),
    
  status: z.enum(['UPCOMING', 'CLOSED', 'COMPLETED']).optional()
}).refine((data) => {
  const eventDate = new Date(data.date);
  const closingDate = new Date(data.closingDate);
  const now = new Date();
  
  return closingDate < eventDate && closingDate > now;
}, {
  message: 'La data di chiusura deve essere tra ora e la data dell\'evento',
  path: ['closingDate']
});

export const eventResultsValidation = z.object({
  firstPlaceId: z.string().cuid('ID pilota primo posto non valido'),
  secondPlaceId: z.string().cuid('ID pilota secondo posto non valido'),
  thirdPlaceId: z.string().cuid('ID pilota terzo posto non valido')
}).refine((data) => {
  const positions = [data.firstPlaceId, data.secondPlaceId, data.thirdPlaceId];
  return new Set(positions).size === positions.length;
}, {
  message: 'Lo stesso pilota non può occupare più posizioni',
  path: ['thirdPlaceId']
});

export const eventStatusValidation = z.object({
  status: z.enum(['UPCOMING', 'CLOSED', 'COMPLETED'], {
    errorMap: () => ({ message: 'Status non valido' })
  })
});

// Validazione per aggiornamento evento esistente (senza restrizioni di data)
export const eventUpdateValidation = z.object({
  name: z.string()
    .min(1, 'Il nome è obbligatorio')
    .max(100, 'Il nome non può superare i 100 caratteri')
    .regex(/^[a-zA-Z0-9\s\-_'àáâäèéêëìíîïòóôöùúûüñç]+$/,
           'Il nome può contenere solo lettere, numeri, spazi, trattini e apostrofi')
    .optional(),

  type: z.enum(['RACE', 'SPRINT'], {
    errorMap: () => ({ message: 'Il tipo deve essere RACE o SPRINT' })
  }).optional(),

  date: z.string()
    .datetime('Formato data non valido')
    .optional(),

  closingDate: z.string()
    .datetime('Formato data di chiusura non valido')
    .optional(),

  status: z.enum(['UPCOMING', 'CLOSED', 'COMPLETED']).optional(),

  // Campi per risultati
  firstPlaceId: z.string().cuid('ID pilota primo posto non valido').optional(),
  secondPlaceId: z.string().cuid('ID pilota secondo posto non valido').optional(),
  thirdPlaceId: z.string().cuid('ID pilota terzo posto non valido').optional()
});

export type EventValidation = z.infer<typeof eventValidation>;
export type EventResultsValidation = z.infer<typeof eventResultsValidation>;
export type EventStatusValidation = z.infer<typeof eventStatusValidation>;
export type EventUpdateValidation = z.infer<typeof eventUpdateValidation>;
