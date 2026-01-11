export function FooterYear() {
  // Initialize state directly with the current year to avoid useEffect and extra renders
  const [year] = useState(new Date().getFullYear());
  return <span>{year}</span>;
}
