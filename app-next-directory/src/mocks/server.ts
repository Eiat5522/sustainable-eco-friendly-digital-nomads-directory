import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// Default export for CommonJS consumers/tests that do `require('./server')`
export default server;
