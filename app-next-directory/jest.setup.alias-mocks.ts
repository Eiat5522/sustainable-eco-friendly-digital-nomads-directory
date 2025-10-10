// Force-register simple alias mocks for modules that Next.js injects
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Module = require('module')
const originalLoad = Module._load
Module._load = function (request: string, parent: any, isMain: boolean) {
  if (request === 'server-only') {
    return {}
  }
  return originalLoad.apply(this, arguments as any)
}
