import {
  fetchModerationQueue,
  fetchAdminAnalytics,
  performModerationAction,
  runBulkOperation,
  analyzeContent,
  summarizeModerationQueue,
} from '../analytics';
import { client } from '@/lib/sanity/client';

jest.mock('@/lib/sanity/client', () => {
  const fetch = jest.fn();
  const patch = jest.fn();
  const transaction = jest.fn();
  return { client: { fetch, patch, transaction } };
});

describe('admin analytics helpers', () => {
  const fetchMock = client.fetch as jest.Mock;
  const patchMock = client.patch as jest.Mock;
  const transactionMock = client.transaction as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.mockReset();
  });

  it('normalizes moderation queue entries', async () => {
    fetchMock.mockResolvedValueOnce([
      {
        _id: 'mod-1',
        _createdAt: '2024-01-01T00:00:00.000Z',
        status: 'pending',
        itemType: 'listing',
        itemName: 'Eco Hub',
        itemId: 'listing-1',
        userReports: [{}, {}],
      },
      {
        _id: 'mod-2',
        _createdAt: 'invalid-date',
        status: undefined,
        userReports: null,
      },
    ]);

    const result = await fetchModerationQueue(2);
    expect(result).toEqual([
      {
        id: 'mod-1',
        itemType: 'listing',
        itemName: 'Eco Hub',
        itemId: 'listing-1',
        reports: 2,
        lastActivity: '2024-01-01T00:00:00.000Z',
        status: 'pending',
      },
      {
        id: 'mod-2',
        itemType: 'unknown',
        itemName: 'Unnamed Item',
        itemId: 'unknown',
        reports: 0,
        lastActivity: 'invalid-date',
        status: 'pending',
      },
    ]);

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('*[_type == "moderationStatus"'), { limit: 2 });
  });

  it('returns aggregated analytics snapshot', async () => {
    const fetchSequence: Array<any> = [
      10,
      undefined,
      2,
      3,
      [
        {
          _id: 'mod-1',
          _createdAt: '2024-01-01T00:00:00.000Z',
          status: 'pending',
          itemType: 'listing',
          itemName: 'Eco',
          itemId: '1',
          userReports: [{}],
        },
      ],
      1,
      undefined,
      3,
      4,
      5,
      6,
      7,
      8,
      undefined,
    ];
    fetchMock.mockImplementation(() => Promise.resolve(fetchSequence.shift()));

    const snapshot = await fetchAdminAnalytics();

    expect(snapshot.overview).toEqual({
      totalUsers: 10,
      totalListings: 0,
      totalReviews: 2,
      weeklySignups: 0,
      pendingModeration: 3,
    });
    expect(snapshot.userRoles).toMatchObject({
      admin: 1,
      user: 0,
      moderator: 3,
    });
    expect(snapshot.moderationQueue).toHaveLength(1);
    expect(typeof snapshot.generatedAt).toBe('string');
  });

  it('handles missing analytics values gracefully', async () => {
    const emptyQueue: any[] = [];
    const fetchSequence: Array<any> = [
      undefined,
      undefined,
      undefined,
      undefined,
      emptyQueue,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ];
    fetchMock.mockImplementation(() => Promise.resolve(fetchSequence.shift()));

    const snapshot = await fetchAdminAnalytics();

    expect(snapshot.overview).toEqual({
      totalUsers: 0,
      totalListings: 0,
      totalReviews: 0,
      weeklySignups: 0,
      pendingModeration: 0,
    });
    expect(snapshot.moderationQueue).toEqual([]);
    expect(Object.values(snapshot.userRoles).every((value) => value === 0)).toBe(true);
  });

  it('throws on unsupported moderation action', async () => {
    await expect(
      performModerationAction({ moderationId: 'mod-1', actorId: 'user-1', action: 'invalid' as any })
    ).rejects.toThrow('Unsupported moderation action');
  });

  it('commits moderation action updates and returns latest entry', async () => {
    fetchMock.mockResolvedValueOnce([
      {
        _id: 'mod-1',
        _createdAt: '2024-01-01T00:00:00.000Z',
        status: 'approved',
        itemType: 'listing',
        itemName: 'Eco',
        itemId: 'listing-1',
        userReports: [],
      },
    ]);

    const patchChain = {
      set: jest.fn().mockReturnThis(),
      setIfMissing: jest.fn().mockReturnThis(),
      append: jest.fn().mockReturnThis(),
      commit: jest.fn().mockResolvedValue(undefined),
    };
    patchMock.mockReturnValue(patchChain);

    const result = await performModerationAction({
      moderationId: 'mod-1',
      actorId: 'admin-1',
      action: 'approve',
      notes: 'looks good',
    });

    expect(patchMock).toHaveBeenCalledWith('mod-1');
    expect(patchChain.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'approved', lastActionAt: expect.any(String) })
    );
    expect(patchChain.append).toHaveBeenCalledWith(
      'moderationHistory',
      expect.arrayContaining([
        expect.objectContaining({ action: 'approve', actor: 'admin-1', notes: 'looks good' }),
      ])
    );
    expect(result).toMatchObject({ status: 'approved' });
  });

  it('adds notes without changing status when saving notes', async () => {
    fetchMock.mockResolvedValueOnce([
      {
        _id: 'mod-1',
        _createdAt: '2024-01-01T00:00:00.000Z',
        status: 'pending',
        itemType: 'listing',
        itemName: 'Eco',
        itemId: 'listing-1',
        userReports: [],
      },
    ]);

    const patchChain = {
      set: jest.fn().mockReturnThis(),
      setIfMissing: jest.fn().mockReturnThis(),
      append: jest.fn().mockReturnThis(),
      commit: jest.fn().mockResolvedValue(undefined),
    };
    patchMock.mockReturnValue(patchChain);

    await performModerationAction({
      moderationId: 'mod-1',
      actorId: 'admin-1',
      action: 'saveNote',
      notes: 'follow up later',
    });

    const calls = patchChain.set.mock.calls.map(([arg]) => arg);
    expect(calls[0]).toMatchObject({ lastActionAt: expect.any(String) });
    expect(calls).toContainEqual({ resolutionNotes: 'follow up later' });
  });

  it('skips resolution notes when none are provided', async () => {
    fetchMock.mockResolvedValueOnce([
      {
        _id: 'mod-1',
        _createdAt: '2024-01-01T00:00:00.000Z',
        status: 'pending',
        itemType: 'listing',
        itemName: 'Eco',
        itemId: 'listing-1',
        userReports: [],
      },
    ]);

    const patchChain = {
      set: jest.fn().mockReturnThis(),
      setIfMissing: jest.fn().mockReturnThis(),
      append: jest.fn().mockReturnThis(),
      commit: jest.fn().mockResolvedValue(undefined),
    };
    patchMock.mockReturnValue(patchChain);

    await performModerationAction({ moderationId: 'mod-1', actorId: 'admin-1', action: 'approve' });

    const setArgs = patchChain.set.mock.calls.map(([payload]) => payload);
    expect(setArgs).toHaveLength(1);
    expect(setArgs[0]).toMatchObject({ status: 'approved', lastActionAt: expect.any(String) });
  });

  it('returns null moderation entry when queue is empty after action', async () => {
    fetchMock.mockResolvedValueOnce([]);

    const patchChain = {
      set: jest.fn().mockReturnThis(),
      setIfMissing: jest.fn().mockReturnThis(),
      append: jest.fn().mockReturnThis(),
      commit: jest.fn().mockResolvedValue(undefined),
    };
    patchMock.mockReturnValue(patchChain);

    const result = await performModerationAction({ moderationId: 'mod-1', actorId: 'admin-1', action: 'approve' });

    expect(result).toBeNull();
  });

  it('runs bulk operations across all ids', async () => {
    const commit = jest.fn().mockResolvedValue(undefined);
    const setCalls: Record<string, unknown>[] = [];
    const transactionInstance = {
      patch: jest.fn().mockImplementation((_id: string, updater: (patch: any) => any) => {
        const patchApi = {
          set: jest.fn().mockImplementation((data) => {
            setCalls.push(data);
            return patchApi;
          }),
        };
        updater(patchApi);
        return transactionInstance;
      }),
      commit,
    };
    transactionMock.mockReturnValue(transactionInstance);

    const result = await runBulkOperation({ operation: 'publishListings', ids: ['a', 'b'] });

    expect(transactionInstance.patch).toHaveBeenCalledTimes(2);
    expect(setCalls).toHaveLength(2);
    expect(result).toEqual({ operation: 'publishListings', total: 2, succeeded: 2, failed: [] });
  });

  it('applies unpublish patches when requested', async () => {
    const commit = jest.fn().mockResolvedValue(undefined);
    const patchSets: Record<string, unknown>[] = [];
    const transactionInstance = {
      patch: jest.fn().mockImplementation((_id: string, updater: (patch: any) => any) => {
        const patchApi = {
          set: jest.fn().mockImplementation((payload) => {
            patchSets.push(payload);
            return patchApi;
          }),
        };
        updater(patchApi);
        return transactionInstance;
      }),
      commit,
    };
    transactionMock.mockReturnValue(transactionInstance);

    await runBulkOperation({ operation: 'unpublishListings', ids: ['listing-1'] });

    expect(patchSets[0]).toEqual({
      'adminWorkflow.status': 'unpublished',
      'adminWorkflow.lastChangedAt': expect.any(String),
    });
  });

  it('marks listings as featured during feature bulk operations', async () => {
    const commit = jest.fn().mockResolvedValue(undefined);
    const featurePayloads: Record<string, unknown>[] = [];
    const transactionInstance = {
      patch: jest.fn().mockImplementation((_id: string, updater: (patch: any) => any) => {
        const patchApi = {
          set: jest.fn().mockImplementation((payload) => {
            featurePayloads.push(payload);
            return patchApi;
          }),
        };
        updater(patchApi);
        return transactionInstance;
      }),
      commit,
    };
    transactionMock.mockReturnValue(transactionInstance);

    await runBulkOperation({ operation: 'featureListings', ids: ['listing-2'] });

    expect(featurePayloads[0]).toEqual({
      'adminWorkflow.isFeatured': true,
      'adminWorkflow.lastChangedAt': expect.any(String),
    });
    expect(commit).toHaveBeenCalled();
  });

  it('returns failure details when bulk operations fail', async () => {
    const commit = jest.fn().mockRejectedValue(new Error('boom'));
    const transactionInstance = {
      patch: jest.fn().mockReturnThis(),
      commit,
    };
    transactionMock.mockReturnValue(transactionInstance);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const result = await runBulkOperation({ operation: 'featureListings', ids: ['a'] });

    expect(result).toEqual({ operation: 'featureListings', total: 1, succeeded: 0, failed: ['a'] });

    consoleSpy.mockRestore();
  });

  it('gracefully handles empty bulk operation requests and unsupported operations', async () => {
    await expect(runBulkOperation({ operation: 'publishListings', ids: [] })).resolves.toEqual({
      operation: 'publishListings',
      total: 0,
      succeeded: 0,
      failed: [],
    });

    await expect(
      runBulkOperation({ operation: 'not-supported' as any, ids: ['1'] })
    ).rejects.toThrow('Unsupported bulk operation');
  });

  it('summarizes moderation queue statistics', async () => {
    const oldest = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    fetchMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          _id: '1',
          _createdAt: oldest,
          status: 'pending',
          itemType: 'listing',
          itemName: 'Eco',
          itemId: '1',
          userReports: [],
        },
      ]);

    await expect(summarizeModerationQueue()).resolves.toEqual({ queueSize: 0, oldestItemAgeHours: null });
    const stats = await summarizeModerationQueue();

    expect(stats.queueSize).toBe(1);
    expect(typeof stats.oldestItemAgeHours).toBe('number');
  });

  it('ignores invalid timestamps when summarizing moderation queue', async () => {
    fetchMock.mockResolvedValue([
      { _id: '1', _createdAt: 'not-a-date', status: 'pending', itemType: 'listing', itemName: 'Eco', itemId: '1' },
      { _id: '2', _createdAt: new Date().toISOString(), status: 'pending', itemType: 'listing', itemName: 'Eco', itemId: '2' },
    ]);

    const summary = await summarizeModerationQueue();

    expect(summary.queueSize).toBe(2);
    expect(summary.oldestItemAgeHours).toBe(0);
  });

  it('analyzes content totals and averages', async () => {
    fetchMock
      .mockResolvedValueOnce({ all: 4, flagged: 1, pendingModeration: 2, recent: 3 })
      .mockResolvedValueOnce(6);

    const result = await analyzeContent({ type: 'listing', windowDays: 10 });

    expect(fetchMock).toHaveBeenNthCalledWith(1, expect.stringContaining('count(*[_type == $type])'), {
      type: 'listing',
      windowStart: expect.any(String),
    });
    expect(result).toEqual({
      type: 'listing',
      totals: {
        all: 4,
        flagged: 1,
        pendingModeration: 2,
        publishedLastWindow: 3,
      },
      averages: {
        reportsPerItem: 1.5,
      },
    });
  });

  it('handles content analysis when no documents are returned', async () => {
    fetchMock
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    const result = await analyzeContent({ type: 'listing' });

    expect(result.averages.reportsPerItem).toBe(0);
    expect(result.totals).toEqual({
      all: 0,
      flagged: 0,
      pendingModeration: 0,
      publishedLastWindow: 0,
    });
  });
});
