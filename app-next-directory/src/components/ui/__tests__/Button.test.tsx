import { describe, it, expect } from '@jest/globals';
import { buttonVariants } from '../button';

describe('Button Component', () => {
  describe('buttonVariants function', () => {
    it('should generate correct classes for default variant and size', () => {
      const classes = buttonVariants();
      expect(classes).toContain('bg-primary');
      expect(classes).toContain('text-primary-foreground');
      expect(classes).toContain('h-9');
      expect(classes).toContain('px-4');
    });

    it('should generate correct classes for destructive variant', () => {
      const classes = buttonVariants({ variant: 'destructive' });
      expect(classes).toContain('bg-destructive');
      expect(classes).toContain('text-destructive-foreground');
    });

    it('should generate correct classes for outline variant', () => {
      const classes = buttonVariants({ variant: 'outline' });
      expect(classes).toContain('border');
      expect(classes).toContain('border-input');
      expect(classes).toContain('bg-background');
    });

    it('should generate correct classes for secondary variant', () => {
      const classes = buttonVariants({ variant: 'secondary' });
      expect(classes).toContain('bg-secondary');
      expect(classes).toContain('text-secondary-foreground');
    });

    it('should generate correct classes for ghost variant', () => {
      const classes = buttonVariants({ variant: 'ghost' });
      expect(classes).toContain('hover:bg-accent');
      expect(classes).toContain('hover:text-accent-foreground');
    });

    it('should generate correct classes for link variant', () => {
      const classes = buttonVariants({ variant: 'link' });
      expect(classes).toContain('text-primary');
      expect(classes).toContain('underline-offset-4');
      expect(classes).toContain('hover:underline');
    });

    it('should generate correct classes for small size', () => {
      const classes = buttonVariants({ size: 'sm' });
      expect(classes).toContain('h-8');
      expect(classes).toContain('px-3');
      expect(classes).toContain('text-xs');
    });

    it('should generate correct classes for large size', () => {
      const classes = buttonVariants({ size: 'lg' });
      expect(classes).toContain('h-10');
      expect(classes).toContain('px-8');
    });

    it('should generate correct classes for icon size', () => {
      const classes = buttonVariants({ size: 'icon' });
      expect(classes).toContain('h-9');
      expect(classes).toContain('w-9');
    });

    it('should combine variant and size correctly', () => {
      const classes = buttonVariants({ variant: 'outline', size: 'lg' });
      expect(classes).toContain('border');
      expect(classes).toContain('border-input');
      expect(classes).toContain('h-10');
      expect(classes).toContain('px-8');
    });

    it('should include custom className when provided', () => {
      const classes = buttonVariants({ className: 'custom-test-class' });
      expect(classes).toContain('custom-test-class');
    });

    it('should include base classes in all variants', () => {
      const classes = buttonVariants({ variant: 'destructive', size: 'sm' });
      expect(classes).toContain('inline-flex');
      expect(classes).toContain('items-center');
      expect(classes).toContain('justify-center');
      expect(classes).toContain('rounded-md');
    });

    it('should handle edge cases with undefined values', () => {
      const classes = buttonVariants({ variant: undefined, size: undefined });
      // Should default to default variant and size
      expect(classes).toContain('bg-primary');
      expect(classes).toContain('h-9');
    });
  });
});
