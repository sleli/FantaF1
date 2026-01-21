
import { GET } from '@/app/api/events/route';
import { prisma } from '@/lib/prisma';
import { getActiveSeason } from '@/lib/season';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    event: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/season', () => ({
  getActiveSeason: jest.fn(),
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => Promise.resolve({ user: { id: 'test-user', role: 'PLAYER' } })),
}));

describe('GET /api/events', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 204 if no active season exists', async () => {
    (getActiveSeason as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/events');
    const res = await GET(req);

    expect(res.status).toBe(204);
  });

  it('should return events for active season', async () => {
    const mockSeason = { id: 'season-1', scoringType: 'LEGACY_TOP3' };
    (getActiveSeason as jest.Mock).mockResolvedValue(mockSeason);
    (prisma.event.findMany as jest.Mock).mockResolvedValue([
      { id: 'event-1', seasonId: 'season-1', status: 'UPCOMING' }
    ]);

    const req = new NextRequest('http://localhost:3000/api/events');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.events).toHaveLength(1);
    expect(prisma.event.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ seasonId: 'season-1' })
    }));
  });

  it('should ignore unsupported parameters and log warning', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const mockSeason = { id: 'season-1' };
    (getActiveSeason as jest.Mock).mockResolvedValue(mockSeason);
    (prisma.event.findMany as jest.Mock).mockResolvedValue([]);

    const req = new NextRequest('http://localhost:3000/api/events?invalidParam=123');
    await GET(req);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Parametri non supportati ignorati'));
    consoleSpy.mockRestore();
  });
});
