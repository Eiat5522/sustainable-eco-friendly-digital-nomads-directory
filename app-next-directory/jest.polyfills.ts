if (typeof globalThis.ReadableStream === 'undefined') {
  globalThis.ReadableStream = require('web-streams-polyfill').ReadableStream;
}

if (typeof globalThis.TransformStream === 'undefined') {
  globalThis.TransformStream = require('web-streams-polyfill').TransformStream;
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
