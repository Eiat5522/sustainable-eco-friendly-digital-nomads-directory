export function FooterYear() {
  const year = new Date().getFullYear();
  return <span>{year}</span>;
}
