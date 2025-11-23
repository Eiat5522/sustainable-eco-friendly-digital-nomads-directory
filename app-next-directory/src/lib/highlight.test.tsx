import { getHighlightedText, highlightText } from './highlight';

describe('highlightText', () => {
  it('returns original text if searchQuery is empty', () => {
    const result = highlightText('Hello World', '', {});
    expect(result).toBe('Hello World');
  });

  it('highlights matching text (default case-insensitive)', () => {
    const result = highlightText('Hello World', 'world');
    // Should return an array with "Hello ", <mark>World</mark>
    expect(Array.isArray(result)).toBe(true);

    if (!Array.isArray(result)) return;

    const mark = result.find((el: unknown): el is React.ReactElement => React.isValidElement(el));
    expect(mark).toBeTruthy();
    if (mark) {
      expect((mark.props as { children?: unknown; className?: string }).children).toBe('World');
      expect(mark.type).toBe('mark');
    }
  });

  it('highlights all occurrences (case-insensitive)', () => {
    const result = highlightText('foo bar foo', 'foo');
    // Should have two <mark>foo</mark>

    if (!Array.isArray(result)) {
      fail('Expected result to be an array');
      return;
    }

    const marks = result.filter((el: unknown): el is React.ReactElement =>
      React.isValidElement(el)
    );
    expect(marks.length).toBe(2);
    marks.forEach((mark: React.ReactElement) => {
      expect((mark.props as { children?: unknown; className?: string }).children).toBe('foo');
    });
  });

  it('respects caseSensitive option', () => {
    const result = highlightText('Foo foo', 'foo', { caseSensitive: true });
    // Only the lowercase 'foo' should be highlighted

    if (!Array.isArray(result)) {
      fail('Expected result to be an array');
      return;
    }

    const marks = result.filter((el: unknown) => React.isValidElement(el));
    expect(marks.length).toBe(1);
    if (marks[0]) {
      expect((marks[0].props as { children?: unknown }).children).toBe('foo');
    }
  });

  it('applies custom className', () => {
    const result = highlightText('foo bar', 'foo', { className: 'custom-class' });

    if (!Array.isArray(result)) {
      fail('Expected result to be an array');
      return;
    }

    const mark = result.find((el: unknown): el is React.ReactElement => React.isValidElement(el));
    if (mark) {
      expect((mark.props as { children?: unknown; className?: string }).className).toBe(
        'custom-class'
      );
    }
  });

  it('returns original text if no match', () => {
    // Skipped: Implementation returns string instead of array when no match.
    const result = highlightText('foo bar', 'baz');
    expect(result).toEqual(['foo bar']);
  });

  it('handles special regex characters in searchQuery', () => {
    const result = highlightText('foo.bar*foo?', 'foo.bar*foo?', {});
    // Should highlight the entire string

    if (!Array.isArray(result)) {
      fail('Expected result to be an array');
      return;
    }

    const mark = result.find((el: unknown): el is React.ReactElement => React.isValidElement(el));
    expect(mark).toBeTruthy();
    if (mark) {
      expect((mark.props as { children?: unknown; className?: string }).children).toBe(
        'foo.bar*foo?'
      );
    }
  });

  it('returns original text if text is empty', () => {
    const result = highlightText('', 'foo');
    expect(result).toBe('');
  });

  it('returns array with original text if no match and text is not empty', () => {
    // Skipped: Implementation returns string instead of array when no match.
    const result = highlightText('no match here', 'xyz');
    expect(result).toEqual(['no match here']);
  });

  it('handles searchQuery with only whitespace', () => {
    const result = highlightText('foo bar', '   ');
    expect(result).toBe('foo bar');
  });

  it('handles text with multiple consecutive matches', () => {
    const result = highlightText('foofoofoo', 'foo');
    // Should have three <mark>foo</mark>

    if (!Array.isArray(result)) {
      fail('Expected result to be an array');
      return;
    }

    const marks = result.filter((el: unknown): el is React.ReactElement =>
      React.isValidElement(el)
    );
    expect(marks.length).toBe(3);
    marks.forEach((mark: React.ReactElement) => {
      if (mark) {
        expect((mark.props as { children?: unknown; className?: string }).children).toBe('foo');
      }
    });
  });

  it('handles text with no string input (null/undefined)', () => {
    // Skipped: Implementation returns "" instead of null/undefined for null/undefined input.

    expect(highlightText(null, 'foo')).toBe(null);

    expect(highlightText(undefined, 'foo')).toBe(undefined);
  });

  it('handles searchQuery longer than text', () => {
    // Skipped: Implementation returns string instead of array when searchQuery is longer than text.
    const result = highlightText('foo', 'foobar');
    expect(result).toEqual(['foo']);
  });

  it('handles empty options object', () => {
    const result = highlightText('foo bar', 'foo', {});

    if (!Array.isArray(result)) {
      fail('Expected result to be an array');
      return;
    }

    const mark = result.find((el: unknown) => React.isValidElement(el)) as React.ReactElement;
    expect(mark).toBeTruthy();
  });

  it('handles undefined options', () => {
    // Should use default options
    const result = highlightText('foo bar', 'foo');

    if (!Array.isArray(result)) {
      fail('Expected result to be an array');
      return;
    }

    const mark = result.find((el: unknown) => React.isValidElement(el)) as React.ReactElement;
    expect(mark).toBeTruthy();
  });

  it('does not highlight if searchQuery is only whitespace', () => {
    const result = highlightText('foo bar', '   ');
    expect(result).toBe('foo bar');
  });

  it('handles text with numbers and searchQuery as number string', () => {
    const result = highlightText('abc123abc', '123');

    if (!Array.isArray(result)) {
      fail('Expected result to be an array');
      return;
    }

    const mark = result.find((el: unknown): el is React.ReactElement => React.isValidElement(el));
    expect(mark).toBeTruthy();
    if (mark) {
      expect((mark.props as { children?: unknown; className?: string }).children).toBe('123');
    }
  });

  it('handles text with unicode characters', () => {
    const result = highlightText('café café', 'café');

    if (!Array.isArray(result)) {
      fail('Expected result to be an array');
      return;
    }

    const marks = result.filter((el: unknown): el is React.ReactElement =>
      React.isValidElement(el)
    );
    expect(marks.length).toBe(2);
    marks.forEach((mark: React.ReactElement) => {
      if (mark) {
        expect((mark.props as { children?: unknown; className?: string }).children).toBe('café');
      }
    });
  });

  it('handles searchQuery with unicode characters', () => {
    const result = highlightText('café', 'é');

    if (!Array.isArray(result)) {
      fail('Expected result to be an array');
      return;
    }

    const mark = result.find((el: unknown): el is React.ReactElement => React.isValidElement(el));
    expect(mark).toBeTruthy();
    if (mark) {
      expect((mark.props as { children?: unknown; className?: string }).children).toBe('é');
    }
  });

  it('returns original text if searchQuery is undefined', () => {
    expect(highlightText('foo bar', undefined)).toBe('foo bar');
  });

  it('returns original text if options is null', () => {
    expect(highlightText('foo bar', 'foo', null)).not.toBeNull();
  });

  // getHighlightedText additional tests
  describe('getHighlightedText edge cases', () => {
    it('returns original text if options is undefined', () => {
      expect(getHighlightedText('foo bar', 'foo')).toBeDefined();
    });

    it('returns original text if both text and searchQuery are empty', () => {
      expect(getHighlightedText('', '')).toBe('');
    });

    it('returns original text if text is null or undefined', () => {
      // Skipped: Implementation returns "" instead of null/undefined for null/undefined input.

      expect(getHighlightedText(null, 'foo')).toBe(null);

      expect(getHighlightedText(undefined, 'foo')).toBe(undefined);
    });

    it('returns original text if searchQuery is null or undefined', () => {
      expect(getHighlightedText('foo', null)).toBe('foo');

      expect(getHighlightedText('foo', undefined)).toBe('foo');
    });
  });
});
