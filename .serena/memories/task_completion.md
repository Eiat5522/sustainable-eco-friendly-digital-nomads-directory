# Task Completion Checklist
1. **Sync & install**: Pull latest main/pre-prod, run `pnpm install` if deps changed.
2. **Implement & self-verify**: Keep to coding standards, update docs/tests alongside code.
3. **Schema changes**: Regenerate types (`npm run update-types` in `sanity/`, then `pnpm types:postprocess` and `pnpm types:check`).
4. **Quality gates (Next.js app)**:
   - `npm run lint`
   - `npm run format` (if needed)
   - `npm run types:check`
   - Relevant tests (`npm run test:jest`, targeted `npm run test:e2e -- <spec>`; full suite before major merges).
5. **Build validation**: `pnpm build` (or `npm run build` inside app) to ensure production readiness; follow with `npm run start` smoke test when touching runtime paths.
6. **Env validation**: `npm run validate:env` prior to shipping auth/data changes.
7. **Docs & logs**: Update `docs/` or `memory-bank/` entries affected; note console-error classifications if new issues arise.
8. **Commit & PR**: Conventional commit message, ensure Husky pre-commit passes, include links to relevant tasks/issues and testing evidence in PR template.
