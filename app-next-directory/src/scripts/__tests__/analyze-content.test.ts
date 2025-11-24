const mkdirMock = jest.fn();
const writeFileMock = jest.fn();

jest.mock('fs', () => ({
  promises: {
    mkdir: (...args: unknown[]) => mkdirMock(...args),
    writeFile: (...args: unknown[]) => writeFileMock(...args),
  },
}));

jest.mock('node:fs', () => ({
  promises: {
    mkdir: (...args: unknown[]) => mkdirMock(...args),
    writeFile: (...args: unknown[]) => writeFileMock(...args),
  },
}));

const fetchMock = jest.fn();

jest.mock('../../lib/sanity/client', () => ({
  client: { fetch: (...args: unknown[]) => fetchMock(...args) },
}));

const levenshteinMock = jest.fn();

jest.mock('fast-levenshtein', () => ({
  get: (...args: unknown[]) => levenshteinMock(...args),
}));

describe('analyzeContent script', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('evaluates listings and writes a report', async () => {
    fetchMock.mockResolvedValue([
      {
        _id: '1',
        name: 'Listing One',
        shortDescription: 'Tiny',
        longDescription: '',
        primary_image_url: '',
        eco_features: [],
        amenities: [],
        category: 'cafe',
        city: null,
      },
      {
        _id: '2',
        name: 'Listing Two',
        shortDescription:
          'Another listing with detailed description and plenty of words to meet the threshold',
        longDescription: Array.from({ length: 60 }, (_, index) => `detail-${index}`).join(' '),
        primary_image_url: 'https://example.com/image.jpg',
        eco_features: ['Solar'],
        amenities: ['Wifi'],
        category: 'coworking',
        city: 'Lisbon',
      },
    ]);
    levenshteinMock.mockReturnValue(0);

    const analyzeContent = (await import('../analyze-content')).default;
    const result = await analyzeContent();

    expect(result.thinContent).toHaveLength(1);
    expect(result.missingMetadata[0].missingFields).toEqual(
      expect.arrayContaining([
        'longDescription',
        'primary_image_url',
        'eco_features',
        'amenities',
        'city',
      ])
    );
    expect(result.duplicateContent[0]).toMatchObject({ listing1Id: '1', listing2Id: '2' });

    expect(mkdirMock).toHaveBeenCalledWith(expect.stringContaining('reports'), { recursive: true });
    const [outputPath, fileContents] = writeFileMock.mock.calls[0];
    expect(outputPath).toContain('reports/content-analysis-');
    expect(fileContents).toContain('"thinContent"');
  });

  it('flags missing metadata even when descriptions are long enough', async () => {
    fetchMock.mockResolvedValue([
      {
        _id: '10',
        name: 'Verbose Listing',
        shortDescription: 'A '.repeat(30),
        longDescription: 'B '.repeat(40),
        primary_image_url: '',
        eco_features: ['Solar'],
        amenities: ['Wifi'],
        category: 'cafe',
        city: '',
      },
      {
        _id: '11',
        name: 'Different Listing',
        shortDescription: 'C '.repeat(30),
        longDescription: 'D '.repeat(60),
        primary_image_url: 'https://example.com/asset.jpg',
        eco_features: ['Water'],
        amenities: ['Food'],
        category: 'cafe',
        city: 'Lisbon',
      },
    ]);
    levenshteinMock.mockReturnValue(Number.MAX_SAFE_INTEGER);

    const cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue('/tmp/project');
    const analyzeContent = (await import('../analyze-content')).default;
    const result = await analyzeContent();

    expect(result.thinContent).toHaveLength(0);
    expect(result.missingMetadata).toEqual([
      expect.objectContaining({
        listingId: '10',
        missingFields: expect.arrayContaining(['primary_image_url', 'city']),
      }),
    ]);
    expect(result.duplicateContent).toHaveLength(0);
    expect(mkdirMock).toHaveBeenLastCalledWith('/tmp/project/reports', { recursive: true });

    cwdSpy.mockRestore();
  });
});
