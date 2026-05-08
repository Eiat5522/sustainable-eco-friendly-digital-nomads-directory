export const WORKDAY_WIDGET_RESOURCE = {
  uri: 'ui://widget/sustainable-workday-itinerary-v1.html',
  mimeType: 'text/html;profile=mcp-app',
  title: 'Sustainable Workday Itinerary',
  meta: {
    'openai/widgetDescription':
      'Renders an ordered sustainable workday itinerary from published directory listings.',
    'openai/widgetPrefersBorder': true,
    ui: {
      prefersBorder: true,
      csp: {
        connectDomains: [],
        resourceDomains: [],
      },
    },
  },
} as const;

export function renderWorkdayWidgetHtml(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root {
        color-scheme: light dark;
        font-family:
          Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      body {
        margin: 0;
        background: #f7faf8;
        color: #17211b;
      }
      .shell {
        padding: 18px;
      }
      .heading {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 16px;
      }
      h1 {
        margin: 0;
        font-size: 20px;
        line-height: 1.2;
      }
      .summary,
      .notice,
      .reason {
        font-size: 13px;
        line-height: 1.5;
      }
      .summary {
        margin: 6px 0 0;
        color: #4d5c52;
      }
      .timeline {
        display: grid;
        gap: 10px;
      }
      .stop {
        border: 1px solid #d7e3dc;
        border-radius: 8px;
        background: #ffffff;
        padding: 12px;
      }
      .stop-header {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 10px;
      }
      .slot {
        color: #2f6f4e;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
      }
      .time {
        color: #65736a;
        font-size: 12px;
      }
      .listing {
        margin: 4px 0 8px;
        font-size: 16px;
        font-weight: 700;
      }
      .badges {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin: 8px 0;
      }
      .badge {
        border-radius: 999px;
        background: #e7f4ec;
        color: #21563a;
        font-size: 12px;
        padding: 3px 8px;
      }
      .notice {
        border-left: 3px solid #c28b22;
        margin: 12px 0 0;
        padding-left: 10px;
        color: #6a4a0c;
      }
      button {
        border: 1px solid #2f6f4e;
        border-radius: 6px;
        background: #2f6f4e;
        color: white;
        cursor: pointer;
        font: inherit;
        font-size: 13px;
        padding: 7px 10px;
      }
      button:focus-visible {
        outline: 2px solid #111827;
        outline-offset: 2px;
      }
      @media (prefers-color-scheme: dark) {
        body {
          background: #101512;
          color: #edf7f0;
        }
        .summary,
        .time {
          color: #aab8af;
        }
        .stop {
          background: #18221d;
          border-color: #33473b;
        }
        .badge {
          background: #244832;
          color: #d7f4df;
        }
      }
    </style>
  </head>
  <body>
    <main id="workday-itinerary-root" class="shell" aria-live="polite">
      <div class="heading">
        <div>
          <h1>Sustainable workday</h1>
          <p class="summary" id="summary">Waiting for itinerary data...</p>
        </div>
      </div>
      <section class="timeline" id="timeline" aria-label="Itinerary timeline">
        <article class="stop" data-slot="morning"></article>
      </section>
      <section id="notices" aria-label="Planning notices"></section>
    </main>
    <script>
      const openExternal = (url) => {
        if (window.openai && typeof window.openai.openExternal === 'function') {
          window.openai.openExternal({ href: url });
          return;
        }
        window.open(url, '_blank', 'noopener,noreferrer');
      };

      const getItinerary = () => {
        const output = window.openai && window.openai.toolOutput;
        return output && output.itinerary ? output.itinerary : output;
      };

      const appendText = (parent, tagName, className, text) => {
        const element = document.createElement(tagName);
        if (className) element.className = className;
        element.textContent = text || '';
        parent.appendChild(element);
        return element;
      };

      const safeListingHref = (href) => {
        if (typeof href !== 'string') return null;
        if (href.startsWith('/listings/')) return href;
        try {
          const parsed = new URL(href);
          return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? href : null;
        } catch {
          return null;
        }
      };

      const render = () => {
        const itinerary = getItinerary();
        if (!itinerary || !Array.isArray(itinerary.stops)) return;

        document.getElementById('summary').textContent = itinerary.summary || 'Sustainable workday';
        const timeline = document.getElementById('timeline');
        timeline.replaceChildren();

        for (const stop of itinerary.stops) {
          const article = document.createElement('article');
          article.className = 'stop';
          article.dataset.slot = stop.slot;
          const badges = [
            ...(stop.listing.ecoFocusTags || []),
            ...(stop.listing.digitalNomadFeatures || []),
          ].slice(0, 5);

          const header = document.createElement('div');
          header.className = 'stop-header';
          appendText(header, 'span', 'slot', stop.slot);
          appendText(header, 'span', 'time', stop.startTime + ' - ' + stop.endTime);
          article.appendChild(header);

          appendText(article, 'div', 'listing', stop.listing.name);

          const badgeGroup = document.createElement('div');
          badgeGroup.className = 'badges';
          for (const badge of badges) {
            appendText(badgeGroup, 'span', 'badge', badge);
          }
          article.appendChild(badgeGroup);
          appendText(article, 'p', 'reason', (stop.reasons || []).join(' '));

          const listingHref = safeListingHref(stop.listing.canonicalUrl);
          if (listingHref) {
            const button = appendText(article, 'button', '', 'Open listing');
            button.type = 'button';
            button.addEventListener('click', () => {
              openExternal(listingHref);
            });
          }
          timeline.appendChild(article);
        }

        const notices = document.getElementById('notices');
        notices.replaceChildren();
        for (const notice of itinerary.notices || []) {
          appendText(notices, 'p', 'notice', notice);
        }
      };

      render();
      window.addEventListener('message', render);
    </script>
  </body>
</html>`;
}
