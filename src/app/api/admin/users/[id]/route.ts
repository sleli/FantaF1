import { NextRequest } from 'next/server';
import { withAuthAPI, apiResponse } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { UserRole } from '@prisma/client';

const updateUserSchema = z.object({
  role: z.enum(['PLAYER', 'ADMIN']).optional(),
  name: z.string().min(1).max(100).optional(),
});

// Admin-only API route to update a user
async function putHandler(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return apiResponse({ error: 'ID utente mancante' }, 400);
    }

    const body = await req.json();
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return apiResponse({ 
        error: 'Dati non validi',
        details: validation.error.errors 
      }, 400);
    }

    const { role, name } = validation.data;

    // Verifica che l'utente esista
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true }
    });

    if (!existingUser) {
      return apiResponse({ error: 'Utente non trovato' }, 404);
    }

    // Aggiorna l'utente
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(role && { role: role as UserRole }),
        ...(name && { name }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            predictions: true
          }
        }
      }
    });

    return apiResponse({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    return apiResponse({ error: 'Errore nell\'aggiornamento dell\'utente' }, 500);
  }
}

async function deleteHandler(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return apiResponse({ error: 'ID utente mancante' }, 400);
    }

    // Verifica che l'utente esista
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { 
        id: true, 
        email: true, 
        _count: { 
          select: { predictions: true } 
        } 
      }
    });

    if (!existingUser) {
      return apiResponse({ error: 'Utente non trovato' }, 404);
    }

    // Non permettere l'eliminazione se ha pronostici
    if (existingUser._count.predictions > 0) {
      return apiResponse({ 
        error: 'Impossibile eliminare utente con pronostici esistenti' 
      }, 400);
    }

    await prisma.user.delete({
      where: { id }
    });

    return apiResponse({ message: 'Utente eliminato con successo' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return apiResponse({ error: 'Errore nell\'eliminazione dell\'utente' }, 500);
  }
}

// Wrap the handlers with auth protection requiring ADMIN role
export const PUT = withAuthAPI(putHandler, { requiredRole: 'ADMIN' });
export const DELETE = withAuthAPI(deleteHandler, { requiredRole: 'ADMIN' });
