import {
  ReadableStream as PolyfillReadableStream,
  TransformStream as PolyfillTransformStream,
} from 'web-streams-polyfill';

if (typeof globalThis.ReadableStream === 'undefined') {
  globalThis.ReadableStream = PolyfillReadableStream as typeof globalThis.ReadableStream;
}

if (typeof globalThis.TransformStream === 'undefined') {
  globalThis.TransformStream = PolyfillTransformStream as typeof globalThis.TransformStream;
}

if (typeof globalThis.BroadcastChannel === 'undefined') {
  // Minimal stub for environments without BroadcastChannel (e.g., JSDOM)
  globalThis.BroadcastChannel = class BroadcastChannel {
    name: string;
    constructor(name: string) {
      this.name = name;
    }
    postMessage(_message: unknown) {}
    close() {}
  } as unknown as typeof BroadcastChannel;
}

export {};
