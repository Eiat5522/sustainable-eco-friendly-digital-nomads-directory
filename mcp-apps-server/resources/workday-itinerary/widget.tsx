import { McpUseProvider, useWidget, useWidgetTheme, type WidgetMetadata } from 'mcp-use/react';
import { workdayItineraryWidgetPropsSchema, type WorkdayItineraryWidgetProps } from './types';

type ItineraryWidgetState = {
  selectedStopId?: string;
};

export const widgetMetadata: WidgetMetadata = {
  description:
    'Browse a sustainable workday itinerary with stop-by-stop details, notices, and quick links back to the selected listings.',
  props: workdayItineraryWidgetPropsSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: true,
    invoking: 'Rendering itinerary...',
    invoked: 'Itinerary ready',
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

export default function WorkdayItineraryWidget() {
  const { props, isPending, state, setState } =
    useWidget<WorkdayItineraryWidgetProps, ItineraryWidgetState>();
  const theme = useWidgetTheme();

  const colors = {
    background: theme === 'dark' ? '#0f1b16' : '#f7fbf8',
    surface: theme === 'dark' ? '#15241d' : '#ffffff',
    surfaceMuted: theme === 'dark' ? '#1d342a' : '#eef6f0',
    border: theme === 'dark' ? '#315043' : '#d7e6db',
    text: theme === 'dark' ? '#edf7f1' : '#16281f',
    textMuted: theme === 'dark' ? '#acc2b5' : '#5f786a',
    accent: theme === 'dark' ? '#88e5a8' : '#2a7d4c',
    notice: theme === 'dark' ? '#f3cd72' : '#8c6112',
  };

  if (isPending) {
    return (
      <McpUseProvider autoSize>
        <div style={{ padding: 20, fontFamily: 'Inter, system-ui, sans-serif' }}>Loading itinerary…</div>
      </McpUseProvider>
    );
  }

  const defaultStop = props.itinerary.stops[0] ?? null;
  const selectedStop =
    props.itinerary.stops.find(stop => stop.id === state?.selectedStopId) ?? defaultStop;

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
            Sustainable workday itinerary
          </span>
          <h2 style={{ margin: 0, fontSize: 22 }}>{props.itinerary.city}</h2>
          <p style={{ margin: 0, fontSize: 14, color: colors.textMuted }}>{props.itinerary.summary}</p>
          <span style={{ fontSize: 12, color: colors.textMuted }}>
            Generated {new Date(props.itinerary.generatedAt).toLocaleString()}
          </span>
        </header>

        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(0, 0.92fr) minmax(0, 1.08fr)' }}>
          <section style={{ display: 'grid', gap: 10 }} aria-label="Itinerary stops">
            {props.itinerary.stops.length === 0 ? (
              <div
                style={{
                  padding: 16,
                  borderRadius: 14,
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.surface,
                  color: colors.textMuted,
                }}
              >
                No stops were available for this itinerary.
              </div>
            ) : (
              props.itinerary.stops.map(stop => {
                const isSelected = stop.id === selectedStop?.id;
                return (
                  <button
                    key={stop.id}
                    type="button"
                    onClick={() => setState({ selectedStopId: stop.id })}
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
                    <div style={{ display: 'grid', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
                        <strong style={{ textTransform: 'capitalize', fontSize: 14 }}>{stop.slot}</strong>
                        <span style={{ fontSize: 12, color: colors.textMuted }}>
                          {stop.startTime} – {stop.endTime}
                        </span>
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{stop.listing.name}</span>
                      <span style={{ fontSize: 13, color: colors.textMuted }}>{stop.title}</span>
                    </div>
                  </button>
                );
              })
            )}
          </section>

          <section
            aria-label="Selected stop details"
            style={{
              minHeight: 260,
              padding: 16,
              borderRadius: 16,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.surface,
              display: 'grid',
              gap: 12,
              alignContent: 'start',
            }}
          >
            {selectedStop ? (
              <>
                <div style={{ display: 'grid', gap: 4 }}>
                  <span style={{ fontSize: 12, color: colors.accent, fontWeight: 700, textTransform: 'uppercase' }}>
                    {selectedStop.slot}
                  </span>
                  <h3 style={{ margin: 0, fontSize: 20 }}>{selectedStop.listing.name}</h3>
                  <p style={{ margin: 0, fontSize: 13, color: colors.textMuted }}>
                    {selectedStop.startTime} – {selectedStop.endTime} · {selectedStop.listing.city.name}, {selectedStop.listing.city.country}
                  </p>
                </div>

                <p style={{ margin: 0, lineHeight: 1.5 }}>
                  {selectedStop.listing.longDescription ?? selectedStop.listing.shortDescription ?? selectedStop.title}
                </p>

                <div style={{ display: 'grid', gap: 6 }}>
                  {selectedStop.reasons.map(reason => (
                    <div
                      key={reason}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 10,
                        backgroundColor: colors.surfaceMuted,
                        fontSize: 13,
                      }}
                    >
                      {reason}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[...selectedStop.listing.ecoFocusTags, ...selectedStop.listing.digitalNomadFeatures]
                    .slice(0, 6)
                    .map(tag => (
                      <span
                        key={tag}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 999,
                          backgroundColor: colors.surfaceMuted,
                          color: colors.accent,
                          fontSize: 12,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                </div>

                <div style={{ display: 'grid', gap: 6, fontSize: 13, color: colors.textMuted }}>
                  {selectedStop.listing.address ? <span>Address: {selectedStop.listing.address}</span> : null}
                  {selectedStop.listing.priceRange ? <span>Budget band: {selectedStop.listing.priceRange}</span> : null}
                  {selectedStop.listing.planningNotes.slice(0, 3).map(note => (
                    <span key={note}>{note}</span>
                  ))}
                </div>

                {safeHref(selectedStop.listing.canonicalUrl) ? (
                  <a
                    href={safeHref(selectedStop.listing.canonicalUrl) ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      justifySelf: 'start',
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
              </>
            ) : (
              <div style={{ color: colors.textMuted }}>Select a stop to inspect it in more detail.</div>
            )}
          </section>
        </div>

        {props.itinerary.notices.length > 0 ? (
          <section
            aria-label="Planning notices"
            style={{
              display: 'grid',
              gap: 8,
              padding: 14,
              borderRadius: 14,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.surface,
            }}
          >
            <strong style={{ color: colors.notice }}>Planning notices</strong>
            {props.itinerary.notices.map(notice => (
              <span key={notice} style={{ color: colors.textMuted, fontSize: 13, lineHeight: 1.5 }}>
                {notice}
              </span>
            ))}
          </section>
        ) : null}
      </div>
    </McpUseProvider>
  );
}
