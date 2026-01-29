import { authOptions } from './auth';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@next-auth/prisma-adapter', () => ({
  PrismaAdapter: jest.fn(() => ({})),
}));

jest.mock('next-auth/providers/google', () => jest.fn(() => ({})));
jest.mock('next-auth/providers/credentials', () => jest.fn(() => ({})));

describe('Auth Options - signIn callback', () => {
  // @ts-ignore
  const signIn = authOptions.callbacks?.signIn;

  if (!signIn) {
    throw new Error('signIn callback not defined');
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow login for existing user with Google provider', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      invitationStatus: 'ACCEPTED',
    });

    const result = await signIn({
      user: { email: 'test@example.com', id: 'user-1' },
      account: { provider: 'google', type: 'oauth', providerAccountId: '123' },
      profile: {},
    } as any);

    expect(result).toBe(true);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
      select: { id: true, invitationStatus: true },
    });
  });

  it('should BLOCK login for non-existing user with Google provider', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await signIn({
      user: { email: 'unknown@example.com', id: 'new-user' },
      account: { provider: 'google', type: 'oauth', providerAccountId: '123' },
      profile: {},
    } as any);

    expect(result).toBe(false);
  });

  it('should accept invitation for PENDING user with Google provider', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'pending-user',
      invitationStatus: 'PENDING',
    });

    const result = await signIn({
      user: { email: 'invited@example.com', id: 'pending-user' },
      account: { provider: 'google', type: 'oauth', providerAccountId: '123' },
      profile: {},
    } as any);

    expect(result).toBe(true);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'pending-user' },
      data: {
        invitationToken: null,
        invitationStatus: 'ACCEPTED',
      },
    });
  });

  it('should always allow Credentials provider', async () => {
    const result = await signIn({
      user: { email: 'test@example.com' },
      account: { provider: 'credentials', type: 'credentials', providerAccountId: '123' },
    } as any);

    expect(result).toBe(true);
    // Should NOT check DB for google specific logic
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});
