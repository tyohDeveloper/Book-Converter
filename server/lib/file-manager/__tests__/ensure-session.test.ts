import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockTouchSession = vi.fn();

vi.mock('../../../db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  }
}));

vi.mock('@shared/schema', () => ({
  sessions: { id: 'id' }
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((field, value) => ({ field, value }))
}));

vi.mock('../touch-session', () => ({
  touchSession: mockTouchSession
}));

describe('ensureSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTouchSession.mockResolvedValue(undefined);
  });

  it('should create new session when none exists', async () => {
    const { db } = await import('../../../db');
    
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([])
        })
      })
    } as any);

    const { ensureSession } = await import('../ensure-session');
    const session = await ensureSession('new-session-id');

    expect(session.id).toBe('new-session-id');
    expect(db.insert).toHaveBeenCalled();
  });

  it('should call touchSession for existing session', async () => {
    const { db } = await import('../../../db');
    const existingSession = {
      id: 'existing-session',
      createdAt: new Date('2024-01-01'),
      lastAccessedAt: new Date('2024-01-01')
    };

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([existingSession])
        })
      })
    } as any);

    const { ensureSession } = await import('../ensure-session');
    const session = await ensureSession('existing-session');

    expect(session.id).toBe('existing-session');
    expect(mockTouchSession).toHaveBeenCalledWith('existing-session');
    expect(mockTouchSession).toHaveBeenCalledTimes(1);
  });

  it('should NOT call touchSession for new session', async () => {
    const { db } = await import('../../../db');
    
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([])
        })
      })
    } as any);

    const { ensureSession } = await import('../ensure-session');
    await ensureSession('brand-new-session');

    expect(mockTouchSession).not.toHaveBeenCalled();
  });

  it('should not call insert for existing session', async () => {
    const { db } = await import('../../../db');
    const existingSession = {
      id: 'existing-session',
      createdAt: new Date(),
      lastAccessedAt: new Date()
    };

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([existingSession])
        })
      })
    } as any);

    vi.mocked(db.update).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined)
      })
    } as any);

    vi.resetModules();
    const { ensureSession } = await import('../ensure-session');
    await ensureSession('existing-session');

    expect(db.insert).not.toHaveBeenCalled();
  });
});
