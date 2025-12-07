// Lightweight shim for `prettier/plugins/html`. Exports an empty plugin
// object to satisfy imports during the build. If more functionality is
// required, replace this shim with the real plugin package.
const htmlPlugin = {};

export default htmlPlugin;
