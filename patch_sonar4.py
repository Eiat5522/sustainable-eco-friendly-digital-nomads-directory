import re

with open('app-next-directory/src/app/listings/[slug]/page.tsx', 'r') as f:
    content = f.read()

# In Next.js 15, `params` is a Promise. Let's fix that.
content = re.sub(
    r"type Props = {\n  params: { slug: string };\n};",
    "type Props = {\n  params: Promise<{ slug: string }>;\n};",
    content
)

content = re.sub(
    r"export async function generateMetadata\(\n  { params }: Props,\n  parent: ResolvingMetadata\n\): Promise<Metadata> {\n  try {",
    "export async function generateMetadata(\n  { params }: Props,\n  parent: ResolvingMetadata\n): Promise<Metadata> {\n  try {\n    const { slug } = await params;",
    content
)

content = re.sub(
    r"\{ slug: params\.slug \}",
    "{ slug }",
    content
)

content = re.sub(
    r"export default async function ListingPage\(\{ params \}: Props\) {\n  try {",
    "export default async function ListingPage({ params }: Props) {\n  try {\n    const { slug } = await params;",
    content
)

content = re.sub(
    r"params\.slug",
    "slug",
    content
)


with open('app-next-directory/src/app/listings/[slug]/page.tsx', 'w') as f:
    f.write(content)
