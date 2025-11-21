import { render, screen } from '@testing-library/react';
import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
} from '../select';

// Mock Radix UI Select components
jest.mock('@radix-ui/react-select', () => ({
  Root: jest.fn(({ children, ...props }) => (
    <div data-testid="select-root" {...props}>
      {children}
    </div>
  )),
  Group: jest.fn(({ children, ...props }) => (
    <div data-testid="select-group" {...props}>
      {children}
    </div>
  )),
  Value: jest.fn(({ children, ...props }) => (
    <span data-testid="select-value" {...props}>
      {children}
    </span>
  )),
  Trigger: jest.fn(({ children, ...props }) => (
    <button data-testid="select-trigger" {...props}>
      {children}
    </button>
  )),
  Portal: jest.fn(({ children }) => <>{children}</>),
  Content: jest.fn(({ children, ...props }) => (
    <div data-testid="select-content" {...props}>
      {children}
    </div>
  )),
  Viewport: jest.fn(({ children, ...props }) => (
    <div data-testid="select-viewport" {...props}>
      {children}
    </div>
  )),
  Label: jest.fn(({ children, ...props }) => (
    <div data-testid="select-label" {...props}>
      {children}
    </div>
  )),
  Item: jest.fn(({ children, ...props }) => (
    <div data-testid="select-item" {...props}>
      {children}
    </div>
  )),
  ItemText: jest.fn(({ children, ...props }) => (
    <span data-testid="select-item-text" {...props}>
      {children}
    </span>
  )),
  ItemIndicator: jest.fn(({ children, ...props }) => (
    <span data-testid="select-item-indicator" {...props}>
      {children}
    </span>
  )),
  Icon: jest.fn(({ children, asChild, ...props }) => (
    <span data-testid="select-icon" {...props}>
      {children}
    </span>
  )),
  Separator: jest.fn(({ ...props }) => <hr data-testid="select-separator" {...props} />),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Check: jest.fn(() => <svg data-testid="check-icon" />),
  ChevronDown: jest.fn(() => <svg data-testid="chevron-down-icon" />),
}));

describe('Select Components', () => {
  describe('Select (Root)', () => {
    it('renders as the root component', () => {
      render(
        <Select>
          <div>Select content</div>
        </Select>
      );

      const root = screen.getByTestId('select-root');
      expect(root).toBeInTheDocument();
      expect(root).toHaveTextContent('Select content');
    });

    it('forwards props to root component', () => {
      render(
        <Select defaultValue="test">
          <div>Content</div>
        </Select>
      );

      const root = screen.getByTestId('select-root');
      expect(root).toBeInTheDocument();
    });
  });

  describe('SelectGroup', () => {
    it('renders group component', () => {
      render(
        <SelectGroup>
          <div>Group content</div>
        </SelectGroup>
      );

      const group = screen.getByTestId('select-group');
      expect(group).toBeInTheDocument();
      expect(group).toHaveTextContent('Group content');
    });
  });

  describe('SelectValue', () => {
    it('renders value component', () => {
      render(<SelectValue placeholder="Select an option" />);

      const value = screen.getByTestId('select-value');
      expect(value).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      render(<SelectValue placeholder="Choose one" />);

      const value = screen.getByTestId('select-value');
      expect(value).toBeInTheDocument();
    });
  });

  describe('SelectTrigger', () => {
    it('renders trigger button with default styling', () => {
      render(
        <SelectTrigger>
          <span>Trigger content</span>
        </SelectTrigger>
      );

      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveTextContent('Trigger content');
    });

    it('applies default neo-brutalism classes', () => {
      const { container } = render(
        <SelectTrigger>
          <span>Select</span>
        </SelectTrigger>
      );

      const trigger = container.querySelector('[data-testid="select-trigger"]');
      expect(trigger).toHaveClass('flex');
      expect(trigger).toHaveClass('h-10');
      expect(trigger).toHaveClass('border-2');
      expect(trigger).toHaveClass('border-neo-border');
      expect(trigger).toHaveClass('shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]');
    });

    it('renders ChevronDown icon', () => {
      render(
        <SelectTrigger>
          <span>Select</span>
        </SelectTrigger>
      );

      expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <SelectTrigger className="custom-trigger">
          <span>Select</span>
        </SelectTrigger>
      );

      const trigger = container.querySelector('[data-testid="select-trigger"]');
      expect(trigger).toHaveClass('custom-trigger');
      expect(trigger).toHaveClass('flex'); // Still has base classes
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <SelectTrigger ref={ref as React.RefObject<HTMLButtonElement>}>
          <span>Select</span>
        </SelectTrigger>
      );

      expect(ref.current).not.toBeNull();
    });

    it('forwards additional props', () => {
      render(
        <SelectTrigger disabled aria-label="Select option">
          <span>Select</span>
        </SelectTrigger>
      );

      const trigger = screen.getByTestId('select-trigger');
      expect(trigger).toHaveAttribute('disabled');
      expect(trigger).toHaveAttribute('aria-label', 'Select option');
    });
  });

  describe('SelectContent', () => {
    it('renders content with default styling', () => {
      render(
        <SelectContent>
          <div>Options</div>
        </SelectContent>
      );

      expect(screen.getByTestId('select-content')).toBeInTheDocument();
      expect(screen.getByTestId('select-viewport')).toBeInTheDocument();
    });

    it('applies default position styling', () => {
      const { container } = render(
        <SelectContent>
          <div>Options</div>
        </SelectContent>
      );

      const content = container.querySelector('[data-testid="select-content"]');
      expect(content).toHaveClass('relative');
      expect(content).toHaveClass('z-50');
      expect(content).toHaveClass('border-2');
      expect(content).toHaveClass('border-neo-border');
      expect(content).toHaveClass('translate-y-1'); // default popper position
    });

    it('applies popper position classes when position="popper"', () => {
      const { container } = render(
        <SelectContent position="popper">
          <div>Options</div>
        </SelectContent>
      );

      const content = container.querySelector('[data-testid="select-content"]');
      expect(content).toHaveClass('translate-y-1');
    });

    it('applies custom className', () => {
      const { container } = render(
        <SelectContent className="custom-content">
          <div>Options</div>
        </SelectContent>
      );

      const content = container.querySelector('[data-testid="select-content"]');
      expect(content).toHaveClass('custom-content');
      expect(content).toHaveClass('relative'); // Still has base classes
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <SelectContent ref={ref as React.RefObject<HTMLDivElement>}>
          <div>Options</div>
        </SelectContent>
      );

      expect(ref.current).not.toBeNull();
    });

    it('renders viewport with correct classes for popper position', () => {
      const { container } = render(
        <SelectContent position="popper">
          <div>Options</div>
        </SelectContent>
      );

      const viewport = container.querySelector('[data-testid="select-viewport"]');
      expect(viewport).toHaveClass('p-1');
    });
  });

  describe('SelectLabel', () => {
    it('renders label with default styling', () => {
      render(<SelectLabel>Category</SelectLabel>);

      const label = screen.getByTestId('select-label');
      expect(label).toBeInTheDocument();
      expect(label).toHaveTextContent('Category');
    });

    it('applies default classes', () => {
      const { container } = render(<SelectLabel>Label</SelectLabel>);

      const label = container.querySelector('[data-testid="select-label"]');
      expect(label).toHaveClass('py-1.5');
      expect(label).toHaveClass('pl-8');
      expect(label).toHaveClass('pr-2');
      expect(label).toHaveClass('text-sm');
      expect(label).toHaveClass('font-semibold');
    });

    it('applies custom className', () => {
      const { container } = render(<SelectLabel className="custom-label">Label</SelectLabel>);

      const label = container.querySelector('[data-testid="select-label"]');
      expect(label).toHaveClass('custom-label');
      expect(label).toHaveClass('font-semibold'); // Still has base classes
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<SelectLabel ref={ref as React.RefObject<HTMLDivElement>}>Label</SelectLabel>);

      expect(ref.current).not.toBeNull();
    });
  });

  describe('SelectItem', () => {
    it('renders item with default styling', () => {
      render(<SelectItem value="option1">Option 1</SelectItem>);

      expect(screen.getByTestId('select-item')).toBeInTheDocument();
      expect(screen.getByTestId('select-item-text')).toHaveTextContent('Option 1');
    });

    it('applies default classes', () => {
      const { container } = render(<SelectItem value="option1">Option 1</SelectItem>);

      const item = container.querySelector('[data-testid="select-item"]');
      expect(item).toHaveClass('relative');
      expect(item).toHaveClass('flex');
      expect(item).toHaveClass('w-full');
      expect(item).toHaveClass('cursor-default');
      expect(item).toHaveClass('select-none');
      expect(item).toHaveClass('items-center');
      expect(item).toHaveClass('rounded-sm');
      expect(item).toHaveClass('py-1.5');
      expect(item).toHaveClass('pl-8');
      expect(item).toHaveClass('pr-2');
      expect(item).toHaveClass('text-sm');
    });

    it('renders Check icon indicator', () => {
      render(<SelectItem value="option1">Option 1</SelectItem>);

      expect(screen.getByTestId('select-item-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <SelectItem value="option1" className="custom-item">
          Option 1
        </SelectItem>
      );

      const item = container.querySelector('[data-testid="select-item"]');
      expect(item).toHaveClass('custom-item');
      expect(item).toHaveClass('relative'); // Still has base classes
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <SelectItem value="option1" ref={ref as React.RefObject<HTMLDivElement>}>
          Option 1
        </SelectItem>
      );

      expect(ref.current).not.toBeNull();
    });

    it('forwards additional props', () => {
      render(
        <SelectItem value="option1" disabled>
          Option 1
        </SelectItem>
      );

      const item = screen.getByTestId('select-item');
      expect(item).toHaveAttribute('disabled');
    });
  });

  describe('SelectSeparator', () => {
    it('renders separator', () => {
      render(<SelectSeparator />);

      expect(screen.getByTestId('select-separator')).toBeInTheDocument();
    });

    it('applies default classes', () => {
      const { container } = render(<SelectSeparator />);

      const separator = container.querySelector('[data-testid="select-separator"]');
      expect(separator).toHaveClass('-mx-1');
      expect(separator).toHaveClass('my-1');
      expect(separator).toHaveClass('h-px');
      expect(separator).toHaveClass('bg-muted');
    });

    it('applies custom className', () => {
      const { container } = render(<SelectSeparator className="custom-separator" />);

      const separator = container.querySelector('[data-testid="select-separator"]');
      expect(separator).toHaveClass('custom-separator');
      expect(separator).toHaveClass('bg-muted'); // Still has base classes
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<SelectSeparator ref={ref as React.RefObject<HTMLDivElement>} />);

      expect(ref.current).not.toBeNull();
    });
  });

  describe('Complete Select Integration', () => {
    it('renders a complete select with all components', () => {
      render(
        <Select defaultValue="option1">
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectLabel>Category</SelectLabel>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectSeparator />
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      );

      expect(screen.getByTestId('select-root')).toBeInTheDocument();
      expect(screen.getByTestId('select-trigger')).toBeInTheDocument();
      expect(screen.getByTestId('select-value')).toBeInTheDocument();
      expect(screen.getByTestId('select-content')).toBeInTheDocument();
      expect(screen.getByTestId('select-label')).toBeInTheDocument();
      expect(screen.getAllByTestId('select-item')).toHaveLength(2);
      expect(screen.getByTestId('select-separator')).toBeInTheDocument();
    });

    it('renders select with groups', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Group 1</SelectLabel>
              <SelectItem value="g1-opt1">Group 1 Option 1</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Group 2</SelectLabel>
              <SelectItem value="g2-opt1">Group 2 Option 1</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      );

      expect(screen.getAllByTestId('select-group')).toHaveLength(2);
      expect(screen.getAllByTestId('select-label')).toHaveLength(2);
    });
  });
});
