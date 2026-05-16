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
    background: theme === 'dark' ? '#0f1712' : '#f8fafc',
    surface: theme === 'dark' ? '#1a2e24' : '#ffffff',
    surfaceActive: theme === 'dark' ? '#2d4d3e' : '#f1f5f9',
    border: '#000000',
    text: theme === 'dark' ? '#f1f5f9' : '#1e293b',
    textMuted: theme === 'dark' ? '#94a3b8' : '#64748b',
    primary: '#10b981', // Emerald
    secondary: '#4f46e5', // Indigo
    accent: '#f59e0b', // Amber
    shadow: '#000000',
  };

  if (isPending) {
    return (
      <McpUseProvider autoSize>
        <div style={{ padding: 20, fontFamily: 'Inter, system-ui, sans-serif', color: colors.text }}>
          Loading itinerary…
        </div>
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
            Sustainable Workday
          </div>
          <h2 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>{props.itinerary.city}</h2>
          <p style={{ margin: '8px 0 0', fontSize: 16, color: colors.textMuted, fontWeight: 500 }}>
            {props.itinerary.summary}
          </p>
        </header>

        <div
          style={{
            display: 'grid',
            gap: 24,
            gridTemplateColumns: 'minmax(0, 0.9fr) minmax(0, 1.1fr)',
          }}
        >
          {/* Stops List */}
          <section style={{ display: 'grid', gap: 12, alignContent: 'start' }} aria-label="Itinerary stops">
            {props.itinerary.stops.length === 0 ? (
              <div
                style={{
                  padding: 20,
                  border: `3px solid ${colors.border}`,
                  backgroundColor: colors.surface,
                  boxShadow: `4px 4px 0px 0px ${colors.shadow}`,
                }}
              >
                No stops scheduled.
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            backgroundColor: colors.secondary,
                            color: '#ffffff',
                            padding: '2px 6px',
                            border: `1px solid ${colors.border}`,
                          }}
                        >
                          {stop.slot}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted }}>
                          {stop.startTime} – {stop.endTime}
                        </span>
                      </div>
                      <strong style={{ fontSize: 17, fontWeight: 800 }}>{stop.listing.name}</strong>
                    </div>
                  </button>
                );
              })
            )}
          </section>

          {/* Stop Details */}
          <section
            aria-label="Selected stop details"
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
            {selectedStop ? (
              <>
                <div style={{ display: 'grid', gap: 8 }}>
                  <span style={{ fontSize: 12, color: colors.primary, fontWeight: 800, textTransform: 'uppercase' }}>
                    {selectedStop.slot} Profile
                  </span>
                  <h3 style={{ margin: 0, fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
                    {selectedStop.listing.name}
                  </h3>
                  <p style={{ margin: 0, fontSize: 14, color: colors.textMuted, fontWeight: 500 }}>
                    {selectedStop.startTime} – {selectedStop.endTime} · {selectedStop.listing.city.name}
                  </p>
                </div>

                <div style={{ padding: 16, backgroundColor: colors.surfaceActive, border: `2px solid ${colors.border}`, fontStyle: 'italic', fontSize: 14 }}>
                   "{selectedStop.title}"
                </div>

                <p style={{ margin: 0, lineHeight: 1.6, fontSize: 15 }}>
                  {selectedStop.listing.longDescription ?? selectedStop.listing.shortDescription}
                </p>

                <div style={{ display: 'grid', gap: 8 }}>
                  <h4 style={{ margin: 0, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: colors.textMuted }}>Selection Rationale</h4>
                  {selectedStop.reasons.map(reason => (
                    <div
                      key={reason}
                      style={{
                        padding: '8px 12px',
                        border: `2px solid ${colors.border}`,
                        backgroundColor: colors.surface,
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      • {reason}
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
                          border: `1px solid ${colors.border}`,
                          backgroundColor: colors.primary + '15',
                          color: colors.primary,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                </div>

                {safeHref(selectedStop.listing.canonicalUrl) && (
                  <a
                    href={safeHref(selectedStop.listing.canonicalUrl) ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      justifySelf: 'start',
                      padding: '12px 20px',
                      backgroundColor: colors.primary,
                      color: colors.border,
                      border: `3px solid ${colors.border}`,
                      boxShadow: `4px 4px 0px 0px ${colors.shadow}`,
                      textDecoration: 'none',
                      fontWeight: 800,
                      fontSize: 14,
                    }}
                  >
                    View Venue Details
                  </a>
                )}
              </>
            ) : (
              <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: colors.textMuted }}>
                Select a stop to view details.
              </div>
            )}
          </section>
        </div>

        {props.itinerary.notices.length > 0 && (
          <section
            aria-label="Planning notices"
            style={{
              marginTop: 24,
              padding: 20,
              border: `3px solid ${colors.border}`,
              backgroundColor: colors.accent + '20',
              boxShadow: `4px 4px 0px 0px ${colors.shadow}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <strong style={{ textTransform: 'uppercase', fontSize: 14, fontWeight: 800 }}>Planning Notices</strong>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {props.itinerary.notices.map(notice => (
                <div key={notice} style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.5 }}>
                  • {notice}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </McpUseProvider>
  );
}
