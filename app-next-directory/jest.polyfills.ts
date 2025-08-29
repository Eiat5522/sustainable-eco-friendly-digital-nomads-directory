if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = require('web-streams-polyfill').ReadableStream;
}
if (typeof global.TransformStream === 'undefined') {
  global.TransformStream = require('web-streams-polyfill').TransformStream;
}
if (typeof global.BroadcastChannel === 'undefined') {
  global.BroadcastChannel = class BroadcastChannel {
    constructor(name) {
      this.name = name;
    }
    postMessage(message) {}
    close() {}
  };
}