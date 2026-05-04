with open('app-next-directory/src/app/listings/[slug]/page.tsx', 'r') as f:
    content = f.read()

import re

# Fix string literal formatting issues
content = re.sub(r',\s*\\n\s*featured\\n\s*', '', content)

with open('app-next-directory/src/app/listings/[slug]/page.tsx', 'w') as f:
    f.write(content)
