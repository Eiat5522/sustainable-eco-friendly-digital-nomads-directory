import {
  fetchModerationQueue,
  fetchAdminAnalytics,
  performModerationAction,
  runBulkOperation,
  analyzeContent,
  summarizeModerationQueue,
} from '../analytics';
import type {
  BulkOperationType,
  ListingWorkflowPatch,
  ModerationAction,
  ModerationHistoryEntry,
} from '../analytics';
import { client } from '@/lib/sanity/client';

jest.mock('@/lib/sanity/client', () => {
  const fetch = jest.fn();
  const patch = jest.fn();
  const transaction = jest.fn();
  return { client: { fetch, patch, transaction } };
});

type MockPatchChain = {
  set: jest.MockedFunction<(payload: Record<string, unknown>) => MockPatchChain>;
  setIfMissing: jest.MockedFunction<(value: { moderationHistory: ModerationHistoryEntry[] }) => MockPatchChain>;
  append: jest.MockedFunction<(field: string, value: ModerationHistoryEntry[]) => MockPatchChain>;
  commit: jest.MockedFunction<(options?: { autoGenerateArrayKeys?: boolean }) => Promise<void>>;
};

const createMockPatchChain = (): MockPatchChain => {
  const chain: MockPatchChain = {
    set: jest.fn<MockPatchChain, [Record<string, unknown>]>(),
    setIfMissing: jest.fn<MockPatchChain, [{ moderationHistory: ModerationHistoryEntry[] }]>(),
    append: jest.fn<MockPatchChain, [string, ModerationHistoryEntry[]]>(),
    commit: jest.fn<Promise<void>, [{ autoGenerateArrayKeys?: boolean }?]>(),
  };

  chain.set.mockImplementation(() => chain);
  chain.setIfMissing.mockImplementation(() => chain);
  chain.append.mockImplementation(() => chain);
  chain.commit.mockResolvedValue(undefined);

  return chain;
};

type MockPatchApi = {
  set: jest.MockedFunction<(payload: ListingWorkflowPatch) => MockPatchApi>;
};

type PatchUpdater = (patch: MockPatchApi) => unknown;

type MockTransaction = {
  patch: jest.MockedFunction<(id: string, updater: PatchUpdater) => MockTransaction>;
  commit: jest.MockedFunction<() => Promise<void>>;
};

const createMockTransaction = ({
  onSet,
  commitImplementation,
}: {
  onSet?: (payload: ListingWorkflowPatch) => void;
  commitImplementation?: () => Promise<void>;
} = {}): MockTransaction => {
  const transaction: MockTransaction = {
    patch: jest.fn<MockTransaction, [string, PatchUpdater]>(),
    commit: jest.fn<Promise<void>, []>(),
  };

  transaction.patch.mockImplementation((_id, updater) => {
    const patchApi: MockPatchApi = {
      set: jest.fn<MockPatchApi, [ListingWorkflowPatch]>(),
    };

    patchApi.set.mockImplementation((payload) => {
      onSet?.(payload);
      return patchApi;
    });

    updater(patchApi);
    return transaction;
  });

  if (commitImplementation) {
    transaction.commit.mockImplementation(commitImplementation);
  } else {
    transaction.commit.mockResolvedValue(undefined);
  }

  return transaction;
};

describe('admin analytics helpers', () => {
  const mockedClient = jest.mocked(client);
  const fetchMock = mockedClient.fetch;
  const patchMock = mockedClient.patch;
  const transactionMock = mockedClient.transaction;

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.mockReset();
    patchMock.mockReset();
    transactionMock.mockReset();
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
        userReports: [
          { _key: 'report-1' },
          { _key: 'report-2' },
        ],
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
    const fetchSequence: unknown[] = [
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
          userReports: [{ _key: 'report-3' }],
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
    const emptyQueue: unknown[] = [];
    const fetchSequence: unknown[] = [
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
      performModerationAction({
        moderationId: 'mod-1',
        actorId: 'user-1',
        action: 'invalid' as unknown as ModerationAction,
      })
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

    const patchChain = createMockPatchChain();
    patchMock.mockReturnValue(patchChain as unknown as ReturnType<typeof client.patch>);

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

    const patchChain = createMockPatchChain();
    patchMock.mockReturnValue(patchChain as unknown as ReturnType<typeof client.patch>);

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

    const patchChain = createMockPatchChain();
    patchMock.mockReturnValue(patchChain as unknown as ReturnType<typeof client.patch>);

    await performModerationAction({ moderationId: 'mod-1', actorId: 'admin-1', action: 'approve' });

    const setArgs = patchChain.set.mock.calls.map(([payload]) => payload);
    expect(setArgs).toHaveLength(1);
    expect(setArgs[0]).toMatchObject({ status: 'approved', lastActionAt: expect.any(String) });
  });

  it('returns null moderation entry when queue is empty after action', async () => {
    fetchMock.mockResolvedValueOnce([]);

    const patchChain = createMockPatchChain();
    patchMock.mockReturnValue(patchChain as unknown as ReturnType<typeof client.patch>);

    const result = await performModerationAction({ moderationId: 'mod-1', actorId: 'admin-1', action: 'approve' });

    expect(result).toBeNull();
  });

  it('runs bulk operations across all ids', async () => {
    const setCalls: ListingWorkflowPatch[] = [];
    const transactionInstance = createMockTransaction({ onSet: (payload) => setCalls.push(payload) });
    transactionMock.mockReturnValue(transactionInstance as unknown as ReturnType<typeof client.transaction>);

    const result = await runBulkOperation({ operation: 'publishListings', ids: ['a', 'b'] });

    expect(transactionInstance.patch).toHaveBeenCalledTimes(2);
    expect(setCalls).toHaveLength(2);
    expect(result).toEqual({ operation: 'publishListings', total: 2, succeeded: 2, failed: [] });
  });

  it('applies unpublish patches when requested', async () => {
    const patchSets: ListingWorkflowPatch[] = [];
    const transactionInstance = createMockTransaction({ onSet: (payload) => patchSets.push(payload) });
    transactionMock.mockReturnValue(transactionInstance as unknown as ReturnType<typeof client.transaction>);

    await runBulkOperation({ operation: 'unpublishListings', ids: ['listing-1'] });

    expect(patchSets[0]).toEqual({
      'adminWorkflow.status': 'unpublished',
      'adminWorkflow.lastChangedAt': expect.any(String),
    });
  });

  it('marks listings as featured during feature bulk operations', async () => {
    const featurePayloads: ListingWorkflowPatch[] = [];
    const transactionInstance = createMockTransaction({ onSet: (payload) => featurePayloads.push(payload) });
    transactionMock.mockReturnValue(transactionInstance as unknown as ReturnType<typeof client.transaction>);

    await runBulkOperation({ operation: 'featureListings', ids: ['listing-2'] });

    expect(featurePayloads[0]).toEqual({
      'adminWorkflow.isFeatured': true,
      'adminWorkflow.lastChangedAt': expect.any(String),
    });
    expect(transactionInstance.commit).toHaveBeenCalled();
  });

  it('returns failure details when bulk operations fail', async () => {
    const transactionInstance = createMockTransaction({
      commitImplementation: () => Promise.reject(new Error('boom')),
    });
    transactionMock.mockReturnValue(transactionInstance as unknown as ReturnType<typeof client.transaction>);

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
      runBulkOperation({ operation: 'not-supported' as unknown as BulkOperationType, ids: ['1'] })
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
