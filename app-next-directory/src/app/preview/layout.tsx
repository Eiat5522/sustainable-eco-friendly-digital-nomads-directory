export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Sustainable Digital Nomads</title>
        <meta name="description" content="Find eco-friendly spaces for digital nomads" />
      </head>
      <body>{children}</body>
    </html>
  );
}
