import { render, screen } from '@testing-library/react';
import { SectionHeader } from '../SectionHeader';

describe('SectionHeader', () => {
  describe('Basic Rendering', () => {
    it('renders with title only', () => {
      render(<SectionHeader title="Test Title" />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Test Title');
    });

    it('renders with title and description', () => {
      render(<SectionHeader title="Test Title" description="This is a test description" />);

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Test Title');
      expect(screen.getByText('This is a test description')).toBeInTheDocument();
    });

    it('renders without description when not provided', () => {
      const { container } = render(<SectionHeader title="Only Title" />);

      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs).toHaveLength(0);
    });

    it('applies default styling classes', () => {
      const { container } = render(<SectionHeader title="Styled Title" />);
      const wrapper = container.firstChild as HTMLElement;

      expect(wrapper).toHaveClass('text-center');
      expect(wrapper).toHaveClass('mb-12');
    });
  });

  describe('Title Styling', () => {
    it('applies heading-lg class to title', () => {
      render(<SectionHeader title="Large Heading" />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveClass('heading-lg');
      expect(heading).toHaveClass('mb-4');
    });

    it('renders title as h2 element', () => {
      render(<SectionHeader title="H2 Test" />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading.tagName).toBe('H2');
    });
  });

  describe('Description Styling', () => {
    it('applies body-lg class to description', () => {
      const { container } = render(<SectionHeader title="Title" description="Description text" />);

      const description = container.querySelector('p');
      expect(description).toHaveClass('body-lg');
      expect(description).toHaveClass('max-w-2xl');
      expect(description).toHaveClass('mx-auto');
    });

    it('centers description with max-width', () => {
      const { container } = render(
        <SectionHeader title="Title" description="Centered description" />
      );

      const description = container.querySelector('p');
      expect(description).toHaveClass('mx-auto');
      expect(description).toHaveClass('max-w-2xl');
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(<SectionHeader title="Custom Class" className="custom-class" />);
      const wrapper = container.firstChild as HTMLElement;

      expect(wrapper).toHaveClass('custom-class');
      expect(wrapper).toHaveClass('text-center'); // Still has default classes
      expect(wrapper).toHaveClass('mb-12');
    });

    it('merges custom className with default classes', () => {
      const { container } = render(
        <SectionHeader title="Merged Classes" className="my-8 bg-gray-100" />
      );
      const wrapper = container.firstChild as HTMLElement;

      expect(wrapper).toHaveClass('my-8');
      expect(wrapper).toHaveClass('bg-gray-100');
      expect(wrapper).toHaveClass('text-center');
    });
  });

  describe('Content Variations', () => {
    it('handles empty title gracefully', () => {
      render(<SectionHeader title="" />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('');
    });

    it('handles long title', () => {
      const longTitle =
        'This is a very long title that should still render correctly without breaking the layout';
      render(<SectionHeader title={longTitle} />);

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(longTitle);
    });

    it('handles long description', () => {
      const longDescription =
        'This is a very long description that should be properly constrained by the max-w-2xl class and centered with mx-auto. It should wrap to multiple lines if needed.';
      render(<SectionHeader title="Title" description={longDescription} />);

      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('handles empty description', () => {
      const { container } = render(<SectionHeader title="Title" description="" />);

      // Empty string is falsy, so no p element should render
      const description = container.querySelector('p');
      expect(description).not.toBeInTheDocument();
    });

    it('handles special characters in title', () => {
      render(<SectionHeader title="Special & Characters <>" />);

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
        'Special & Characters <>'
      );
    });

    it('handles special characters in description', () => {
      render(<SectionHeader title="Title" description="Description with & < > special chars" />);

      expect(screen.getByText('Description with & < > special chars')).toBeInTheDocument();
    });
  });

  describe('Structure', () => {
    it('wraps content in a div', () => {
      const { container } = render(<SectionHeader title="Test" />);

      expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
    });

    it('maintains proper element hierarchy', () => {
      const { container } = render(<SectionHeader title="Title" description="Description" />);

      const wrapper = container.firstChild as HTMLElement;
      const heading = wrapper.querySelector('h2');
      const description = wrapper.querySelector('p');

      expect(wrapper).toContainElement(heading);
      expect(wrapper).toContainElement(description);
    });
  });
});
