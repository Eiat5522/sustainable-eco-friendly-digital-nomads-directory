import re

with open('app-next-directory/src/app/api/listings/route.ts', 'r') as f:
    content = f.read()

# SonarCloud also complains about `filter: any`
content = content.replace("const filter: any = { status: 'active' };", "const filter: Record<string, unknown> = { status: 'active' };")

with open('app-next-directory/src/app/api/listings/route.ts', 'w') as f:
    f.write(content)
