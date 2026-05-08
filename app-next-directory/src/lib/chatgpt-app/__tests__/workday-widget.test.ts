import { WORKDAY_WIDGET_RESOURCE, renderWorkdayWidgetHtml } from '../workday-widget';

describe('workday itinerary widget resource', () => {
  it('uses a versioned MCP Apps HTML resource URI', () => {
    expect(WORKDAY_WIDGET_RESOURCE).toMatchObject({
      uri: 'ui://widget/sustainable-workday-itinerary-v1.html',
      mimeType: 'text/html;profile=mcp-app',
    });
  });

  it('renders timeline markup without external script references', () => {
    const html = renderWorkdayWidgetHtml();

    expect(html).toContain('id="workday-itinerary-root"');
    expect(html).toContain('data-slot="morning"');
    expect(html).toContain('window.openai');
    expect(html).not.toMatch(/<script[^>]+src=/i);
  });

  it('renders tool data with DOM text APIs instead of raw HTML injection', () => {
    const html = renderWorkdayWidgetHtml();

    // Listing fields come from tool data, so the widget must render them as text and
    // validate outbound hrefs instead of interpolating them into raw HTML.
    expect(html).toContain('textContent');
    expect(html).toContain('safeListingHref');
    expect(html).not.toContain('innerHTML');
  });
});
