import re

with open('app-next-directory/src/app/api/listings/route.ts', 'r') as f:
    content = f.read()

# SonarCloud doesn't like parseInt with || '1' inside, it prefers an explicit radix and clear logic
# Let's fix the parseInt warnings (Line 23, 24)
content = re.sub(r"const page = parseInt\(searchParams\.get\('page'\) \|\| '1'\);", "const page = parseInt(searchParams.get('page') || '1', 10);", content)
content = re.sub(r"const limit = parseInt\(searchParams\.get\('limit'\) \|\| '10'\);", "const limit = parseInt(searchParams.get('limit') || '10', 10);", content)

with open('app-next-directory/src/app/api/listings/route.ts', 'w') as f:
    f.write(content)
