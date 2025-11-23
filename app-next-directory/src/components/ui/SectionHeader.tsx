import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  className,
}: SectionHeaderProps): React.JSX.Element {
  return (
    <div className={cn('text-center mb-12', className)}>
      <h2 className="heading-lg mb-4">{title}</h2>
      {description && <p className="body-lg max-w-2xl mx-auto">{description}</p>}
    </div>
  );
}
