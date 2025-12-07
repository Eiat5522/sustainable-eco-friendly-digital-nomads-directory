// Lightweight shim for `prettier/standalone` imports used by some libraries.
// This provides minimal exports so bundlers won't fail on resolution.
const prettierStandalone = {
  format: (code: string) => code,
};

export default prettierStandalone;
