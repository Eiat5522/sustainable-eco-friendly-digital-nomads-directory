## 1. Implementation
- [ ] 1.1 Add `use cache` directives and cache lifetime/tagging to the homepage server component.
- [ ] 1.2 Remove legacy dynamic segment exports or dynamic API usage that would prevent static caching.
- [ ] 1.3 Add a server action or API route that handles CMS webhook calls and invokes `revalidateTag('home')`.
- [ ] 1.4 Update tests or add coverage for the revalidation handler as needed.
