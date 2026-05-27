const validatePlannedItinerary = itinerary => {
  if (!itinerary || typeof itinerary !== 'object' || Array.isArray(itinerary)) {
    throw new Error('plan_sustainable_workday did not return structuredContent.itinerary');
  }

  if (typeof itinerary.summary !== 'string' || itinerary.summary.length === 0) {
    throw new Error('itinerary.summary missing');
  }

  if (!Array.isArray(itinerary.stops)) {
    throw new Error('itinerary.stops missing');
  }

  if (!Array.isArray(itinerary.notices)) {
    throw new Error('itinerary.notices missing');
  }

  const explainsMissingListingData = itinerary.notices.some(notice => {
    const normalizedNotice = String(notice).toLowerCase();
    return (
      normalizedNotice.includes('published listings') ||
      normalizedNotice.includes('listing data') ||
      normalizedNotice.includes('no listings')
    );
  });

  if (itinerary.stops.length === 0 && !explainsMissingListingData) {
    throw new Error('Empty itineraries should explain why no stops were returned');
  }
};

const isRecord = value => value && typeof value === 'object' && !Array.isArray(value);

const validateSearchStructuredContent = content => {
  if (!isRecord(content) || !Array.isArray(content.results)) {
    throw new Error('search did not return results');
  }

  content.results.forEach((result, index) => {
    if (
      !isRecord(result) ||
      typeof result.id !== 'string' ||
      result.id.length === 0 ||
      typeof result.title !== 'string' ||
      result.title.length === 0 ||
      typeof result.url !== 'string' ||
      result.url.length === 0
    ) {
      throw new Error(`search returned malformed result at index ${index}`);
    }
  });
};

const validateToolWidgetMetadata = (tools, widgetToolNames) => {
  for (const toolName of widgetToolNames) {
    const tool = tools.find(candidate => candidate && candidate.name === toolName);
    if (!tool) {
      throw new Error(`Missing required tool: ${toolName}`);
    }

    const meta = isRecord(tool._meta) ? tool._meta : {};
    const ui = isRecord(meta.ui) ? meta.ui : {};
    const resourceUri = ui.resourceUri ?? meta['ui/resourceUri'] ?? meta['openai/outputTemplate'];

    if (typeof resourceUri !== 'string' || resourceUri.length === 0) {
      throw new Error(`${toolName} is missing _meta.ui.resourceUri`);
    }
  }
};

const validateWidgetResource = resource => {
  if (!isRecord(resource)) {
    throw new Error('widget resource missing');
  }

  if (typeof resource.uri !== 'string' || !resource.uri.startsWith('ui://widget/')) {
    throw new Error('widget resource URI must use ui://widget/');
  }

  if (resource.mimeType !== 'text/html;profile=mcp-app') {
    throw new Error('widget resource must use text/html;profile=mcp-app');
  }

  if (typeof resource.text !== 'string' || !resource.text.toLowerCase().includes('<!doctype html>')) {
    throw new Error('widget resource did not include HTML');
  }

  const meta = isRecord(resource._meta) ? resource._meta : {};
  const ui = isRecord(meta.ui) ? meta.ui : {};
  const csp = isRecord(ui.csp) ? ui.csp : {};

  if (!Array.isArray(csp.connectDomains) || !Array.isArray(csp.resourceDomains)) {
    throw new Error('widget resource is missing _meta.ui.csp domains');
  }
};

module.exports = {
  validatePlannedItinerary,
  validateSearchStructuredContent,
  validateToolWidgetMetadata,
  validateWidgetResource,
};
