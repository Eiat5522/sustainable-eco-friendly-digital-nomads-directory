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
});
