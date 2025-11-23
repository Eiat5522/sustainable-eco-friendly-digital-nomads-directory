import Link from 'next/link';

interface BreadcrumbsProps {
  segments: { name: string; href?: string }[];
}

export function Breadcrumbs({ segments }: BreadcrumbsProps) {
  return (
    <nav className="text-sm mb-6" aria-label="Breadcrumb">
      <ol className="list-none p-0 inline-flex">
        {segments.map((seg, idx) => (
          <li key={seg.name} className="flex items-center">
            {seg.href ? (
              <Link href={seg.href} className="text-emerald-700 dark:text-emerald-300 hover:underline">
                {seg.name}
              </Link>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">{seg.name}</span>
            )}
            {idx < segments.length - 1 && <span className="mx-2">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
