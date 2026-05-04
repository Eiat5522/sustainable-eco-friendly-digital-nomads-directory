import re

with open('app-next-directory/src/app/api/listings/route.ts', 'r') as f:
    content = f.read()

# SonarCloud also complains about `.toArray()` type casting issue sometimes if it's not strictly checked, but `any` to `Record<string, unknown>` and `parseInt` radix should resolve the core issues.
