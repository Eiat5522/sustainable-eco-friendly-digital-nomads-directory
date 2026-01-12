export function FooterYear() {
  const year = new Date().getFullYear();
  return <span data-testid="footer-year">{year}</span>;
}
