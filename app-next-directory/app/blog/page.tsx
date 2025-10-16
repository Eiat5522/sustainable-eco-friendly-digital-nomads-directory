// Re-export the canonical implementation from the `src/` folder to avoid
// circular self-references when both `app/` and `src/app/` exist.
export { metadata } from '@/app/blog/page'
export { default } from '@/app/blog/page'