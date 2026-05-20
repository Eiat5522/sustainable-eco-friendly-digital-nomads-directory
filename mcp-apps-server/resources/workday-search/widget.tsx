import {
  McpUseProvider,
  useCallTool,
  useWidget,
  useWidgetTheme,
  type WidgetMetadata,
} from 'mcp-use/react';
import { useMemo, useState } from 'react';
import {
  fetchResultSchema,
  type WorkdaySearchWidgetProps,
  workdaySearchWidgetPropsSchema,
} from './types';

export const widgetMetadata: WidgetMetadata = {
  description:
    'Browse sustainable directory search matches, inspect a selected listing, and ask the model to use it in a workday plan.',
  props: workdaySearchWidgetPropsSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: true,
    invoking: 'Searching sustainable listings...',
    invoked: 'Search results ready',
  },
};

const safeHref = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string' || value.length === 0) return null;
  if (value.startsWith('/')) return value;

  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? value : null;
  } catch {
    return null;
  }
};

export default function WorkdaySearchWidget() {
  const { props, isPending, sendFollowUpMessage } = useWidget<WorkdaySearchWidgetProps>();
  const theme = useWidgetTheme();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDirectoryPreviewOpen, setIsDirectoryPreviewOpen] = useState(false);
  const { callToolAsync, data, isPending: isFetchingDetails } = useCallTool('fetch');

  const colors = {
    background: theme === 'dark' ? '#0f1712' : '#f8fafc',
    surface: theme === 'dark' ? '#1a2e24' : '#ffffff',
    surfaceActive: theme === 'dark' ? '#2d4d3e' : '#f1f5f9',
    border: '#000000',
    text: theme === 'dark' ? '#f1f5f9' : '#1e293b',
    textMuted: theme === 'dark' ? '#94a3b8' : '#64748b',
    primary: '#10b981', // Emerald
    secondary: '#4f46e5', // Indigo
    shadow: '#000000',
  };

  const fetchResult = useMemo(() => {
    const parsed = fetchResultSchema.safeParse(data?.structuredContent);
    return parsed.success ? parsed.data : null;
  }, [data]);

  if (isPending) {
    return (
      <McpUseProvider autoSize>
        <div
          style={{ padding: 20, fontFamily: 'Inter, system-ui, sans-serif', color: colors.text }}
        >
          Loading results…
        </div>
      </McpUseProvider>
    );
  }

  const selectedListing = fetchResult?.listing ?? null;
  const selectedListingHref = safeHref(
    fetchResult?.url ?? selectedListing?.website ?? selectedListing?.canonicalUrl
  );

  return (
    <McpUseProvider autoSize>
      <div
        style={{
          padding: 24,
          backgroundColor: colors.background,
          color: colors.text,
          fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
        }}
      >
        <header style={{ marginBottom: 24 }}>
          <div
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              backgroundColor: colors.primary,
              border: `2px solid ${colors.border}`,
              boxShadow: `3px 3px 0px 0px ${colors.shadow}`,
              fontSize: 12,
              fontWeight: 800,
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            Sustainable Discovery
          </div>
          <h2 style={{ margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Results for “{props.query}”
          </h2>
        </header>

        <div
          style={{
            display: 'grid',
            gap: 24,
            gridTemplateColumns: 'minmax(0, 0.8fr) minmax(0, 1.2fr)',
          }}
        >
          {/* Results List */}
          <section
            style={{ display: 'grid', gap: 12, alignContent: 'start' }}
            aria-label="Search results"
          >
            {props.results.length === 0 ? (
              <div
                style={{
                  padding: 20,
                  border: `3px solid ${colors.border}`,
                  backgroundColor: colors.surface,
                  boxShadow: `4px 4px 0px 0px ${colors.shadow}`,
                }}
              >
                No listings found. Try a broader search.
              </div>
            ) : (
              props.results.map(result => {
                const isSelected = result.id === selectedId;
                return (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(result.id);
                      void callToolAsync({ id: result.id });
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: 16,
                      border: `3px solid ${colors.border}`,
                      backgroundColor: isSelected ? colors.surfaceActive : colors.surface,
                      color: colors.text,
                      boxShadow: isSelected
                        ? `2px 2px 0px 0px ${colors.shadow}`
                        : `6px 6px 0px 0px ${colors.shadow}`,
                      transform: isSelected ? 'translate(4px, 4px)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.1s ease',
                    }}
                  >
                    <div style={{ display: 'grid', gap: 4 }}>
                      <strong style={{ fontSize: 16, fontWeight: 700 }}>{result.title}</strong>
                      <span style={{ fontSize: 12, color: colors.textMuted }}>{result.id}</span>
                    </div>
                  </button>
                );
              })
            )}
          </section>

          {/* Details Bento */}
          <section
            aria-label="Selected listing details"
            style={{
              minHeight: 400,
              padding: 24,
              border: `4px solid ${colors.border}`,
              backgroundColor: colors.surface,
              boxShadow: `12px 12px 0px 0px ${colors.shadow}`,
              display: 'grid',
              gap: 20,
              alignContent: 'start',
            }}
          >
            {isFetchingDetails ? (
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 12, color: colors.textMuted }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    border: `2px solid ${colors.primary}`,
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                <span>Loading Details...</span>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : selectedListing ? (
              <>
                {selectedListing.imageUrl && (
                  <div
                    style={{
                      width: '100%',
                      height: 180,
                      border: `3px solid ${colors.border}`,
                      overflow: 'hidden',
                      marginBottom: 8,
                    }}
                  >
                    {/* biome-ignore lint/performance/noImgElement: This standalone MCP widget runs on mcp-use, not Next.js, so next/image is unavailable here. */}
                    <img
                      src={selectedListing.imageUrl}
                      alt={selectedListing.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}

                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        backgroundColor: colors.secondary,
                        color: '#ffffff',
                        fontSize: 10,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      {selectedListing.type}
                    </span>
                    {selectedListing.priceRange && (
                      <span style={{ fontSize: 12, fontWeight: 600 }}>
                        {selectedListing.priceRange === 'premium'
                          ? '$$$'
                          : selectedListing.priceRange === 'moderate'
                            ? '$$'
                            : '$'}
                      </span>
                    )}
                  </div>
                  <h3 style={{ margin: 0, fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
                    {selectedListing.name}
                  </h3>
                  <p style={{ margin: 0, fontSize: 14, color: colors.textMuted, fontWeight: 500 }}>
                    {selectedListing.city.name}, {selectedListing.city.country}
                  </p>
                </div>

                <p style={{ margin: 0, lineHeight: 1.6, fontSize: 15 }}>
                  {fetchResult?.text ??
                    selectedListing.shortDescription ??
                    'No additional description available.'}
                </p>

                {selectedListing.ecoFocusTags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {selectedListing.ecoFocusTags.map(tag => (
                      <span
                        key={tag}
                        style={{
                          padding: '4px 12px',
                          backgroundColor: colors.primary + '20',
                          border: `2px solid ${colors.primary}`,
                          fontSize: 11,
                          fontWeight: 700,
                          color: colors.primary,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
                  {selectedListing.address && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ fontWeight: 700 }}>📍</span>
                      <span style={{ color: colors.textMuted }}>{selectedListing.address}</span>
                    </div>
                  )}
                  {selectedListing.planningNotes.length > 0 && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ fontWeight: 700 }}>⚡</span>
                      <span style={{ color: colors.textMuted }}>
                        {selectedListing.planningNotes[0]}
                      </span>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 16,
                    marginTop: 12,
                  }}
                >
                  {selectedListingHref ? (
                    <button
                      type="button"
                      onClick={() => setIsDirectoryPreviewOpen(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '12px',
                        backgroundColor: '#ffffff',
                        color: colors.border,
                        border: `3px solid ${colors.border}`,
                        boxShadow: `4px 4px 0px 0px ${colors.shadow}`,
                        fontWeight: 800,
                        fontSize: 14,
                        textAlign: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      View Directory
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() =>
                      sendFollowUpMessage(
                        `Plan a sustainable workday in ${selectedListing.city.name} and consider ${selectedListing.name} as one of the stops.`
                      )
                    }
                    style={{
                      padding: '12px',
                      backgroundColor: colors.primary,
                      color: colors.border,
                      border: `3px solid ${colors.border}`,
                      boxShadow: `4px 4px 0px 0px ${colors.shadow}`,
                      cursor: 'pointer',
                      fontWeight: 800,
                      fontSize: 14,
                      transition: 'all 0.1s ease',
                    }}
                  >
                    Add to Workday Plan
                  </button>
                </div>
              </>
            ) : (
              <div
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  height: '100%',
                  textAlign: 'center',
                }}
              >
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ fontSize: 48 }}>🌿</div>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: colors.textMuted }}>
                    Select a listing to explore its sustainability impact and remote-work features.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>

        {isDirectoryPreviewOpen && selectedListingHref ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Directory preview"
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'grid',
              placeItems: 'center',
              zIndex: 9999,
              padding: 16,
            }}
          >
            <div
              style={{
                width: 'min(1024px, 100%)',
                height: 'min(80vh, 780px)',
                backgroundColor: colors.surface,
                border: `4px solid ${colors.border}`,
                boxShadow: `12px 12px 0px 0px ${colors.shadow}`,
                display: 'grid',
                gridTemplateRows: 'auto 1fr',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '12px 16px',
                  borderBottom: `3px solid ${colors.border}`,
                  backgroundColor: colors.surfaceActive,
                }}
              >
                <strong style={{ fontSize: 14 }}>Directory Preview</strong>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a
                    href={selectedListingHref}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '8px 10px',
                      border: `2px solid ${colors.border}`,
                      backgroundColor: '#ffffff',
                      color: colors.border,
                      textDecoration: 'none',
                      fontWeight: 700,
                      fontSize: 12,
                    }}
                  >
                    Open in New Tab
                  </a>
                  <button
                    type="button"
                    onClick={() => setIsDirectoryPreviewOpen(false)}
                    style={{
                      padding: '8px 10px',
                      border: `2px solid ${colors.border}`,
                      backgroundColor: colors.primary,
                      color: colors.border,
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: 12,
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
              <iframe
                title="Selected listing website"
                src={selectedListingHref}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  backgroundColor: '#ffffff',
                }}
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        ) : null}
      </div>
    </McpUseProvider>
  );
}
