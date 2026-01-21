
import { NextRequest } from 'next/server';
import { withAuthAPI, apiResponse } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';
import { ScoringType } from '@prisma/client';
import { revalidateTag } from 'next/cache';

// PATCH: Update season (e.g., set active)
async function patchHandler(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: seasonId } = await params;
    const body = await req.json();
    const { isActive, name, startDate, endDate, driverCount, scoringType, driverIds } = body;

    // If setting to active, validate and deactivate all other seasons first
    if (isActive === true) {
      const currentSeason = await prisma.season.findUnique({ where: { id: seasonId } });
      if (!currentSeason) {
        return apiResponse({ error: 'Season not found' }, 404);
      }

      const effectiveStartDate = startDate ? new Date(startDate) : currentSeason.startDate;
      const effectiveEndDate = endDate ? new Date(endDate) : currentSeason.endDate;

      if (!effectiveStartDate || !effectiveEndDate) {
        return apiResponse({ error: 'Cannot activate a season without start and end dates' }, 400);
      }

      if (effectiveStartDate > effectiveEndDate) {
        return apiResponse({ error: 'Start date must be before end date' }, 400);
      }

      await prisma.season.updateMany({
        where: { id: { not: seasonId } },
        data: { isActive: false }
      });
    }

    const updateData: any = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (name) updateData.name = name;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (driverCount) updateData.driverCount = parseInt(driverCount);
    if (scoringType) updateData.scoringType = scoringType as ScoringType;

    // Handle drivers update
    if (driverIds && Array.isArray(driverIds)) {
        updateData.drivers = {
            set: driverIds.map((id: string) => ({ id }))
        };
    }

    const season = await prisma.season.update({
      where: { id: seasonId },
      data: updateData
    });

    if (isActive !== undefined) {
      revalidateTag('active-season', { expire: 0 });
    }

    return apiResponse({ season }, 200);
  } catch (error) {
    console.error('Error updating season:', error);
    return apiResponse({ error: 'Failed to update season' }, 500);
  }
}

// DELETE: Delete season
async function deleteHandler(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: seasonId } = await params;
        
        // Check if season has events or predictions before deleting?
        // For now, let's allow deleting but maybe handle cascade in schema or here.
        // Schema has relation events Event[], but no cascade delete on Event side for seasonId usually unless specified.
        // Let's just try to delete.

        await prisma.season.delete({
            where: { id: seasonId }
        });

        return apiResponse({ success: true }, 200);
    } catch (error) {
        console.error('Error deleting season:', error);
        return apiResponse({ error: 'Failed to delete season' }, 500);
    }
}

export const PATCH = withAuthAPI(patchHandler, { requiredRole: 'ADMIN' });
export const DELETE = withAuthAPI(deleteHandler, { requiredRole: 'ADMIN' });
