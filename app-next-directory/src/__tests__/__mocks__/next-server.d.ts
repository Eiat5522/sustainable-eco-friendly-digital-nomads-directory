// TypeScript module declaration to silence errors for 'next/server' in test context
declare module 'next/server' {
  // Add only what is needed for your tests, or leave empty for type silence
  const mod: any;
  export = mod;
}