import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Ensure a single MSW server instance across module systems and repeated imports.
// This avoids subtle issues where multiple server instances cause `server.use`
// overrides to be applied to a different instance than the one listening.
declare global {
	// eslint-disable-next-line no-var
	var __MSW_SERVER__:
		| ReturnType<typeof setupServer>
		| undefined;
}

if (!globalThis.__MSW_SERVER__) {
	// Create and cache the server on the global object
	// so that repeated imports share the same instance.
	// Cast to unknown then to the server type to avoid `any` lint rules
	(globalThis as unknown as { __MSW_SERVER__?: ReturnType<typeof setupServer> }).__MSW_SERVER__ =
		setupServer(...handlers);
}

export const server = globalThis.__MSW_SERVER__ as ReturnType<typeof setupServer>;

// Default export for CommonJS consumers/tests that do `require('./server')`
export default server;
