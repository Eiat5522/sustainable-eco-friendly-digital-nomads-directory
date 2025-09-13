import { setupWorker } from 'msw/browser';
import { handlers } from '../../__mocks__/handlers';

export const worker = setupWorker(...handlers);

