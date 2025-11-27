'use client';

import { useEffect, useState } from 'react';

export function ClientDateFormatter({
  dateString,
  formatOptions,
}: {
  dateString: string;
  formatOptions?: Intl.DateTimeFormatOptions;
}) {
  const [formattedDate, setFormattedDate] = useState<string | null>(null);

  useEffect(() => {
    try {
      setFormattedDate(new Date(dateString).toLocaleString(undefined, formatOptions));
    } catch (e) {
      setFormattedDate('Invalid Date');
    }
  }, [dateString, formatOptions]);

  if (!formattedDate) {
    return <span>...</span>; // Fallback during hydration
  }

  return <span>{formattedDate}</span>;
}
