import { McpUseProvider, useCallTool, useWidget, useWidgetTheme, type WidgetMetadata } from 'mcp-use/react';
import { useMemo, useState } from 'react';
import { fetchResultSchema, workdaySearchWidgetPropsSchema, type WorkdaySearchWidgetProps } from './types';

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
  const { callToolAsync, data, isPending: isFetchingDetails } = useCallTool('fetch');

  const colors = {
    background: theme === 'dark' ? '#102018' : '#f6fbf7',
    surface: theme === 'dark' ? '#163026' : '#ffffff',
    surfaceMuted: theme === 'dark' ? '#1c3b2f' : '#edf6ef',
    border: theme === 'dark' ? '#2d5b47' : '#cfe1d4',
    text: theme === 'dark' ? '#eff9f1' : '#173323',
    textMuted: theme === 'dark' ? '#b5cabb' : '#547260',
    accent: theme === 'dark' ? '#7fe2a2' : '#217a46',
  };

  const fetchResult = useMemo(() => {
    const parsed = fetchResultSchema.safeParse(data?.structuredContent);
    return parsed.success ? parsed.data : null;
  }, [data]);

  if (isPending) {
    return (
      <McpUseProvider autoSize>
        <div style={{ padding: 20, fontFamily: 'Inter, system-ui, sans-serif' }}>Loading results…</div>
      </McpUseProvider>
    );
  }

  const selectedListing = fetchResult?.listing ?? null;
  const selectedListingHref = safeHref(fetchResult?.url ?? selectedListing?.website ?? selectedListing?.canonicalUrl);

  return (
    <McpUseProvider autoSize>
      <div
        style={{
          display: 'grid',
          gap: 16,
          padding: 18,
          backgroundColor: colors.background,
          color: colors.text,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <header style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.accent }}>
            Sustainable directory search
          </span>
          <h2 style={{ margin: 0, fontSize: 22 }}>Results for “{props.query}”</h2>
          <p style={{ margin: 0, fontSize: 14, color: colors.textMuted }}>
            {props.results.length === 0
              ? 'No published listings matched this query.'
              : `Select a listing to inspect richer details and reuse it in a plan.`}
          </p>
        </header>

        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(0, 0.95fr) minmax(0, 1.05fr)' }}>
          <section style={{ display: 'grid', gap: 10 }} aria-label="Search results">
            {props.results.length === 0 ? (
              <div
                style={{
                  padding: 16,
                  borderRadius: 14,
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.surface,
                  color: colors.textMuted,
                }}
              >
                Try a different search term or broader city/category keyword.
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
                      padding: 14,
                      borderRadius: 14,
                      border: `1px solid ${isSelected ? colors.accent : colors.border}`,
                      backgroundColor: isSelected ? colors.surfaceMuted : colors.surface,
                      color: colors.text,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'grid', gap: 6 }}>
                      <strong style={{ fontSize: 15 }}>{result.title}</strong>
                      <span style={{ fontSize: 12, color: colors.textMuted }}>{result.id}</span>
                      <span style={{ fontSize: 12, color: colors.accent }}>{result.url}</span>
                    </div>
                  </button>
                );
              })
            )}
          </section>

          <section
            aria-label="Selected listing details"
            style={{
              minHeight: 220,
              padding: 16,
              borderRadius: 16,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.surface,
              display: 'grid',
              gap: 12,
              alignContent: 'start',
            }}
          >
            {isFetchingDetails ? (
              <div style={{ color: colors.textMuted }}>Loading listing details…</div>
            ) : selectedListing ? (
              <>
                <div style={{ display: 'grid', gap: 4 }}>
                  <span style={{ fontSize: 12, color: colors.accent, fontWeight: 700, textTransform: 'uppercase' }}>
                    {selectedListing.type}
                  </span>
                  <h3 style={{ margin: 0, fontSize: 20 }}>{selectedListing.name}</h3>
                  <p style={{ margin: 0, fontSize: 13, color: colors.textMuted }}>
                    {selectedListing.city.name}, {selectedListing.city.country}
                  </p>
                </div>

                <p style={{ margin: 0, lineHeight: 1.5 }}>{fetchResult?.text ?? selectedListing.shortDescription ?? 'No additional description available.'}</p>

                {selectedListing.ecoFocusTags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {selectedListing.ecoFocusTags.map(tag => (
                      <span
                        key={tag}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 999,
                          backgroundColor: colors.surfaceMuted,
                          fontSize: 12,
                          color: colors.accent,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'grid', gap: 6, fontSize: 13, color: colors.textMuted }}>
                  {selectedListing.address ? <span>Address: {selectedListing.address}</span> : null}
                  {selectedListing.priceRange ? <span>Budget band: {selectedListing.priceRange}</span> : null}
                  {selectedListing.planningNotes.slice(0, 3).map(note => (
                    <span key={note}>{note}</span>
                  ))}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {selectedListingHref ? (
                    <a
                      href={selectedListingHref}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: '8px 12px',
                        borderRadius: 10,
                        backgroundColor: colors.accent,
                        color: theme === 'dark' ? '#082012' : '#ffffff',
                        textDecoration: 'none',
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      Open listing
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() =>
                      sendFollowUpMessage(
                        `Plan a sustainable workday in ${selectedListing.city.name} and consider ${selectedListing.name} as one of the stops.`
                      )
                    }
                    style={{
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: `1px solid ${colors.border}`,
                      backgroundColor: 'transparent',
                      color: colors.text,
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    Ask AI to use this listing
                  </button>
                </div>
              </>
            ) : (
              <div style={{ color: colors.textMuted, lineHeight: 1.5 }}>
                Select a result to inspect its workday-planning details.
              </div>
            )}
          </section>
        </div>
      </div>
    </McpUseProvider>
  );
}
