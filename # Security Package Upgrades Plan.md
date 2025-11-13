# Security Package Upgrades Plan

## Executive Summary

Four packages with security vulnerabilities have been identified in the repository:
1. **prismjs** (v1.27.0) - CVE-2024-53382 (DOM Clobbering XSS)
2. **nodemailer** (v6.10.1) - GHSA-mm7p-fcc7-pg87 (email domain misrouting)
3. **validator** (v13.15.15) - CVE-2025-56200 (URL validation bypass)
4. **next-auth** (v5.0.0-beta.26) - Beta package in production

## Impact Analysis

### 1. prismjs (Indirect Dependency)
- **Current Version**: 1.27.0
- **Patched Version**: 1.30.0
- **Usage**: Indirect dependency via `@sanity/code-input@6.0.0` → dependency chain
- **Vulnerability**: CVE-2024-53382 - DOM Clobbering XSS (fixed in 1.30.0)
- **Impact Level**: Low (only used in Sanity Studio, not end-user facing)
- **Location**: `sanity/package.json` via `@sanity/code-input`

**Action Required**:
- Update `@sanity/code-input` to latest (6.0.3) which should pull in patched prismjs
- Verify transitive dependency resolution with `pnpm why prismjs`
- If still vulnerable, add pnpm override: `"prismjs": "^1.30.0"`

### 2. nodemailer (Direct Dependency)
- **Current Version**: 6.10.1
- **Patched Version**: 7.0.10 (major version bump)
- **Usage**: Direct import in `app-next-directory/app/api/contact/route.ts`
- **Vulnerability**: GHSA-mm7p-fcc7-pg87 - Email to unintended domain (fixed in 7.0.7)
- **Impact Level**: High (production contact form)
- **Breaking Changes**: v7 has API changes (MIT-0 license, streamlined API)

**Migration Path**:
```typescript
// Current usage pattern (v6):
import nodemailer from 'nodemailer';
const transporter = nodemailer.createTransport({ ... });
await transporter.sendMail({ ... });

// v7 Compatible (no breaking changes for basic usage)
// Same API, but internal improvements
```

**Action Required**:
1. Update to `nodemailer@^7.0.10` in `app-next-directory/package.json`
2. Run existing tests for `app/api/contact/route.ts`
3. Verify email sending in development/staging
4. ESM compatibility: nodemailer v7 fully supports ESM (already using `"type": "module"`)

### 3. validator (Direct Dependency)
- **Current Version**: 13.15.15
- **Patched Version**: 13.15.23 (patch version)
- **Usage**: Listed in dependencies but NO direct imports found in codebase
- **Vulnerability**: CVE-2025-56200 - URL validation bypass (fixed in 13.15.20)
- **Impact Level**: Low-Medium (not actively used but available)

**Investigation Required**:
- Confirm validator is actually unused (grep shows no imports)
- If unused, consider removing from dependencies
- If needed by dev/test utilities, update to 13.15.23

**Action Required**:
1. Search for validator usage: `grep -r "from 'validator'" app-next-directory/`
2. If unused: Remove from `app-next-directory/package.json`
3. If used: Update to `validator@^13.15.23`

### 4. next-auth (Direct Dependency - Beta in Production)
- **Current Version**: 5.0.0-beta.26
- **Stable Version Available**: 4.24.13 (stable v4) OR migrate to Auth.js v5 stable when released
- **Usage**: Auth configuration throughout codebase
  - `src/lib/auth/config.ts`
  - `src/lib/auth/adapter.ts`
  - `src/lib/auth/serverAuth.ts`
  - Type definitions in `src/types/next-auth.d.ts`
- **Vulnerability**: Multiple issues in beta, including GHSA-5jpx-9hw9-2fx4 (fixed in 5.0.0-beta.30)
- **Impact Level**: Critical (authentication system)

**Migration Options**:

**Option A: Downgrade to Stable v4.24.13** (Recommended Short-Term)
- Pros: Stable, well-tested, security patches included
- Cons: Older API, eventual migration to v5 needed
- Effort: High (API differences between v4 and v5 beta)

**Option B: Upgrade to v5 Beta.30+** (Quickest Fix)
- Pros: Minimal code changes, security fixes included
- Cons: Still beta, potential future breaking changes
- Effort: Low (increment version, test)

**Option C: Migrate to Auth.js v5 Stable** (When Available)
- Pros: Latest stable, long-term support
- Cons: Not yet released as stable
- Effort: Medium (wait for stable release + migration)

**Recommended Action**:
1. **Immediate**: Upgrade to `next-auth@5.0.0-beta.30` (security fixes)
2. **Short-term**: Monitor Auth.js v5 stable release
3. **Long-term**: Plan migration to stable v5 when available

**Beta.30 Breaking Changes to Review**:
- Email misdelivery fix (GHSA-5jpx-9hw9-2fx4)
- Enhanced OAuth state/nonce validation
- MongoDB adapter compatibility (already using `@auth/mongodb-adapter@3.11.1`)

## Implementation Plan

### Phase 1: Low-Risk Updates (Immediate)
```bash
# Update indirect prismjs via @sanity/code-input
cd sanity
pnpm update @sanity/code-input@^6.0.3

# Update validator (or remove if unused)
cd ../app-next-directory
pnpm remove validator  # IF UNUSED

# Verify prismjs resolution
pnpm why prismjs
```

### Phase 2: Medium-Risk Updates (This Week)
```bash
cd app-next-directory

# Update nodemailer to v7
pnpm update nodemailer@^7.0.10

# Update next-auth beta
pnpm update next-auth@5.0.0-beta.30

# Run tests
pnpm test:unit
pnpm test:integration
```

### Phase 3: Verification (Before Merge)
1. Test contact form email sending (development + staging)
2. Test authentication flows (login, logout, session)
3. Run full test suite including E2E
4. Manual QA of auth-protected routes
5. Verify Sanity Studio code highlighting still works

### Phase 4: Post-Deployment Monitoring
- Monitor error logs for email delivery issues
- Monitor auth session creation/validation
- Check Sentry/logging for new errors

## ESM & Jest Compatibility Notes

### Current Setup
- ✅ `"type": "module"` in `app-next-directory/package.json`
- ✅ Jest configured with `@swc/jest` for ESM support
- ✅ MSW v2 configured for API mocking

### Package ESM Status
- ✅ **prismjs**: ESM compatible (via @sanity/code-input bundle)
- ✅ **nodemailer v7**: Full ESM support (exports field, dual package)
- ✅ **validator**: ESM compatible (exports field)
- ✅ **next-auth v5**: ESM compatible (Next.js 15 requirement)

### Test Adjustments Needed
```javascript
// jest.config.cjs - May need to add to transformIgnorePatterns
transformIgnorePatterns: [
  'node_modules/(?!(nodemailer|@auth)/)',
]
```

## Dependency Version Matrix

| Package | Current | Target | Type | Breaking |
|---------|---------|--------|------|----------|
| prismjs | 1.27.0 | 1.30.0 | indirect | No |
| @sanity/code-input | 6.0.0 | 6.0.3 | direct | No |
| nodemailer | 6.10.1 | 7.0.10 | direct | Minor |
| validator | 13.15.15 | 13.15.23 or remove | direct | No |
| next-auth | 5.0.0-beta.26 | 5.0.0-beta.30 | direct | Patch |

## Risk Assessment

| Package | Risk Level | Mitigation |
|---------|-----------|------------|
| prismjs | Low | Sanity Studio only, not user-facing |
| nodemailer | Medium | Comprehensive test suite exists |
| validator | Low | Not actively used (verify first) |
| next-auth | High | Auth is critical; thorough testing required |

## Rollback Plan

```bash
# Git tag before upgrade
git tag -a pre-security-upgrade -m "Before security package upgrades"

# If issues detected post-deployment
git revert <commit-hash>
# OR
git reset --hard pre-security-upgrade
pnpm install
```

## Testing Checklist

### Unit Tests
- [ ] `pnpm test:unit` passes
- [ ] Contact form validation tests pass
- [ ] Auth configuration tests pass

### Integration Tests
- [ ] `pnpm test:integration` passes
- [ ] Email sending integration tests pass
- [ ] Auth flow integration tests pass

### E2E Tests
- [ ] `pnpm test:e2e` passes
- [ ] Contact form submission E2E test
- [ ] Login/logout E2E tests
- [ ] Protected route access tests

### Manual QA
- [ ] Contact form sends emails successfully
- [ ] Email auto-replies work
- [ ] Admin notifications received
- [ ] Login with credentials works
- [ ] OAuth providers work (if configured)
- [ ] Session persistence works
- [ ] Sanity Studio code editor works
- [ ] Protected API routes authenticate correctly

## Additional Security Recommendations

1. **Add Security Headers** (if not already present):
```typescript
// next.config.mjs
headers: [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'none'",
  },
]
```

2. **Monitor Dependencies**:
```bash
# Add to CI/CD
pnpm audit --audit-level=moderate
```

3. **Automated Dependency Updates**:
- Configure Renovate or Dependabot
- Weekly security patch reviews
- Monthly minor version updates

## File Changes Required

### app-next-directory/package.json
```json
{
  "dependencies": {
    "nodemailer": "^7.0.10",
    "next-auth": "5.0.0-beta.30",
    "validator": "^13.15.23"  // OR remove if unused
  }
}
```

### sanity/package.json
```json
{
  "dependencies": {
    "@sanity/code-input": "^6.0.3"
  }
}
```

### pnpm-workspace.yaml (If prismjs override needed)
```yaml
pnpm:
  overrides:
    prismjs: "^1.30.0"
```

## Success Criteria

- [ ] All security vulnerabilities resolved (pnpm audit clean)
- [ ] All tests passing
- [ ] Contact form emails delivering correctly
- [ ] Authentication working in all environments
- [ ] No new errors in production logs
- [ ] Sanity Studio functioning normally

## Timeline

- **Phase 1**: 1 hour (dependency updates)
- **Phase 2**: 2-3 hours (testing, fixes)
- **Phase 3**: 1 hour (QA, verification)
- **Total**: 4-5 hours of development time

## Notes

- This is ESM-compatible throughout (all packages support ESM)
- Jest configuration already handles ESM via @swc/jest
- MSW handlers may need review for nodemailer v7 if mocking SMTP
- Consider adding integration test for nodemailer v7 email sending
- next-auth beta.30 is backwards compatible with beta.26 for basic usage
