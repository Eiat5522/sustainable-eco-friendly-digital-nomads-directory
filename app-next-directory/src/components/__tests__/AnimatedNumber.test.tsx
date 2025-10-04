import { render, screen } from '@testing-library/react';
import { AnimatedNumber } from '../AnimatedNumber';
import { useCounter } from '@/hooks/useCounter';

jest.mock('@/hooks/useCounter');

const mockUseCounter = useCounter as jest.MockedFunction<typeof useCounter>;

describe('AnimatedNumber', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCounter.mockReturnValue({ formatted: '100' });
  });

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      mockUseCounter.mockReturnValue({ formatted: '50' });
      render(<AnimatedNumber value={50} />);

      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('calls useCounter with correct default values', () => {
      render(<AnimatedNumber value={100} />);

      expect(mockUseCounter).toHaveBeenCalledWith({
        start: 0,
        end: 100,
        duration: 2000,
        decimals: 0,
      });
    });

    it('renders formatted value from useCounter', () => {
      mockUseCounter.mockReturnValue({ formatted: '1,234' });
      render(<AnimatedNumber value={1234} />);

      expect(screen.getByText('1,234')).toBeInTheDocument();
    });
  });

  describe('Custom Start Value', () => {
    it('uses custom start value', () => {
      render(<AnimatedNumber value={100} start={50} />);

      expect(mockUseCounter).toHaveBeenCalledWith({
        start: 50,
        end: 100,
        duration: 2000,
        decimals: 0,
      });
    });

    it('handles negative start value', () => {
      render(<AnimatedNumber value={10} start={-10} />);

      expect(mockUseCounter).toHaveBeenCalledWith({
        start: -10,
        end: 10,
        duration: 2000,
        decimals: 0,
      });
    });
  });

  describe('Custom Duration', () => {
    it('uses custom duration', () => {
      render(<AnimatedNumber value={100} duration={5000} />);

      expect(mockUseCounter).toHaveBeenCalledWith({
        start: 0,
        end: 100,
        duration: 5000,
        decimals: 0,
      });
    });

    it('handles short duration', () => {
      render(<AnimatedNumber value={100} duration={500} />);

      expect(mockUseCounter).toHaveBeenCalledWith({
        start: 0,
        end: 100,
        duration: 500,
        decimals: 0,
      });
    });
  });

  describe('Decimal Places', () => {
    it('uses custom decimal places', () => {
      mockUseCounter.mockReturnValue({ formatted: '99.99' });
      render(<AnimatedNumber value={99.99} decimals={2} />);

      expect(mockUseCounter).toHaveBeenCalledWith({
        start: 0,
        end: 99.99,
        duration: 2000,
        decimals: 2,
      });
      expect(screen.getByText('99.99')).toBeInTheDocument();
    });

    it('handles zero decimals', () => {
      mockUseCounter.mockReturnValue({ formatted: '100' });
      render(<AnimatedNumber value={100} decimals={0} />);

      expect(mockUseCounter).toHaveBeenCalledWith({
        start: 0,
        end: 100,
        duration: 2000,
        decimals: 0,
      });
    });

    it('handles many decimal places', () => {
      mockUseCounter.mockReturnValue({ formatted: '3.14159' });
      render(<AnimatedNumber value={3.14159} decimals={5} />);

      expect(screen.getByText('3.14159')).toBeInTheDocument();
    });
  });

  describe('Prefix and Suffix', () => {
    it('renders with prefix', () => {
      mockUseCounter.mockReturnValue({ formatted: '100' });
      render(<AnimatedNumber value={100} prefix="$" />);

      expect(screen.getByText('$100')).toBeInTheDocument();
    });

    it('renders with suffix', () => {
      mockUseCounter.mockReturnValue({ formatted: '50' });
      render(<AnimatedNumber value={50} suffix="%" />);

      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('renders with both prefix and suffix', () => {
      mockUseCounter.mockReturnValue({ formatted: '1,234' });
      render(<AnimatedNumber value={1234} prefix="$" suffix=" USD" />);

      expect(screen.getByText('$1,234 USD')).toBeInTheDocument();
    });

    it('renders with empty prefix and suffix', () => {
      mockUseCounter.mockReturnValue({ formatted: '42' });
      render(<AnimatedNumber value={42} prefix="" suffix="" />);

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders with multi-character prefix and suffix', () => {
      mockUseCounter.mockReturnValue({ formatted: '999' });
      render(<AnimatedNumber value={999} prefix="Total: " suffix=" items" />);

      expect(screen.getByText('Total: 999 items')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      mockUseCounter.mockReturnValue({ formatted: '100' });
      const { container } = render(
        <AnimatedNumber value={100} className="text-lg font-bold" />
      );

      const span = container.querySelector('span');
      expect(span).toHaveClass('text-lg');
      expect(span).toHaveClass('font-bold');
    });

    it('applies multiple custom classes', () => {
      mockUseCounter.mockReturnValue({ formatted: '100' });
      const { container } = render(
        <AnimatedNumber value={100} className="text-2xl text-blue-500 font-semibold" />
      );

      const span = container.querySelector('span');
      expect(span).toHaveClass('text-2xl');
      expect(span).toHaveClass('text-blue-500');
      expect(span).toHaveClass('font-semibold');
    });

    it('renders as span element', () => {
      mockUseCounter.mockReturnValue({ formatted: '100' });
      const { container } = render(<AnimatedNumber value={100} />);

      const span = container.querySelector('span');
      expect(span).toBeInTheDocument();
      expect(span?.tagName).toBe('SPAN');
    });
  });

  describe('Complex Scenarios', () => {
    it('handles all props together', () => {
      mockUseCounter.mockReturnValue({ formatted: '1,234.56' });
      render(
        <AnimatedNumber
          value={1234.56}
          start={100}
          duration={3000}
          decimals={2}
          prefix="$"
          suffix=" USD"
          className="text-green-600 font-bold"
        />
      );

      expect(mockUseCounter).toHaveBeenCalledWith({
        start: 100,
        end: 1234.56,
        duration: 3000,
        decimals: 2,
      });
      expect(screen.getByText('$1,234.56 USD')).toBeInTheDocument();
    });

    it('handles zero value', () => {
      mockUseCounter.mockReturnValue({ formatted: '0' });
      render(<AnimatedNumber value={0} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('handles negative value', () => {
      mockUseCounter.mockReturnValue({ formatted: '-50' });
      render(<AnimatedNumber value={-50} />);

      expect(screen.getByText('-50')).toBeInTheDocument();
    });

    it('handles large numbers', () => {
      mockUseCounter.mockReturnValue({ formatted: '1,000,000' });
      render(<AnimatedNumber value={1000000} />);

      expect(screen.getByText('1,000,000')).toBeInTheDocument();
    });

    it('handles decimal values without decimals prop', () => {
      mockUseCounter.mockReturnValue({ formatted: '99' });
      render(<AnimatedNumber value={99.99} />);

      expect(mockUseCounter).toHaveBeenCalledWith({
        start: 0,
        end: 99.99,
        duration: 2000,
        decimals: 0,
      });
    });
  });
});
