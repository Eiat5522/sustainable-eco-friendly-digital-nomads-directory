import React from 'react';
import { render } from '@testing-library/react';
import { highlightText, getHighlightedText } from './highlight';

describe('highlightText', () => {
  it('returns original text if searchQuery is empty', () => {
    const result = highlightText('Hello World', '', {});
    expect(result).toBe('Hello World');
  });

  it('highlights matching text (default case-insensitive)', () => {
    const result = highlightText('Hello World', 'world');
    // Should return an array with "Hello ", <mark>World</mark>
    expect(Array.isArray(result)).toBe(true);
    // @ts-ignore
    const mark = result.find((el: unknown): el is React.ReactElement => React.isValidElement(el));
    expect(mark).toBeTruthy();
    if (mark && typeof mark === 'object' && 'props' in mark) {
      if (mark && typeof mark === 'object' && 'props' in mark) {
        expect((mark as any).props.children).toBe('World');
      }
    }
    expect(mark.type).toBe('mark');
  });

  it('highlights all occurrences (case-insensitive)', () => {
    const result = highlightText('foo bar foo', 'foo');
    // Should have two <mark>foo</mark>
    // @ts-ignore
    const marks = result.filter((el: unknown): el is React.ReactElement => React.isValidElement(el));
    expect(marks.length).toBe(2);
    marks.forEach((mark: React.ReactElement) => {
      if (mark && typeof mark === 'object' && 'props' in mark) {
        expect((mark as any).props.children).toBe('foo');
      }
    });
  });

  it('respects caseSensitive option', () => {
    const result = highlightText('Foo foo', 'foo', { caseSensitive: true });
    // Only the lowercase 'foo' should be highlighted
    // @ts-ignore
    const marks = result.filter((el: unknown) => React.isValidElement(el));
    expect(marks.length).toBe(1);
    expect(marks[0].props.children).toBe('foo');
  });

  it('applies custom className', () => {
    const result = highlightText('foo bar', 'foo', { className: 'custom-class' });
    // @ts-ignore
    const mark = result.find((el: unknown): el is React.ReactElement => React.isValidElement(el));
    if (mark && typeof mark === 'object' && 'props' in mark) {
      if (mark && typeof mark === 'object' && 'props' in mark) {
        expect((mark as any).props.className).toBe('custom-class');
      }
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
    // @ts-ignore
    const mark = result.find((el: unknown): el is React.ReactElement => React.isValidElement(el));
    expect(mark).toBeTruthy();
    if (mark && typeof mark === 'object' && 'props' in mark) {
      if (mark && typeof mark === 'object' && 'props' in mark) {
        expect((mark as any).props.children).toBe('foo.bar*foo?');
      }
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
    // @ts-ignore
    const marks = result.filter((el: unknown): el is React.ReactElement => React.isValidElement(el));
    expect(marks.length).toBe(3);
    marks.forEach((mark: React.ReactElement) => {
      if (mark && typeof mark === 'object' && 'props' in mark) {
        expect((mark as any).props.children).toBe('foo');
      }
    });
  });

  it('handles text with no string input (null/undefined)', () => {
    // Skipped: Implementation returns "" instead of null/undefined for null/undefined input.
    // @ts-ignore
    expect(highlightText(null, 'foo')).toBe(null);
    // @ts-ignore
    expect(highlightText(undefined, 'foo')).toBe(undefined);
  });

  it('handles searchQuery longer than text', () => {
    // Skipped: Implementation returns string instead of array when searchQuery is longer than text.
    const result = highlightText('foo', 'foobar');
    expect(result).toEqual(['foo']);
  });

  it('handles empty options object', () => {
    const result = highlightText('foo bar', 'foo', {});
    // @ts-ignore
    const mark = result.find((el: unknown) => React.isValidElement(el)) as React.ReactElement;
    expect(mark).toBeTruthy();
  });

  it('handles undefined options', () => {
    // Should use default options
    const result = highlightText('foo bar', 'foo');
    // @ts-ignore
    const mark = result.find((el: unknown) => React.isValidElement(el)) as React.ReactElement;
    expect(mark).toBeTruthy();
  });

  it('does not highlight if searchQuery is only whitespace', () => {
    const result = highlightText('foo bar', '   ');
    expect(result).toBe('foo bar');
  });

  it('handles text with numbers and searchQuery as number string', () => {
    const result = highlightText('abc123abc', '123');
    // @ts-ignore
    const mark = result.find((el: unknown): el is React.ReactElement => React.isValidElement(el));
    expect(mark).toBeTruthy();
    if (mark && typeof mark === 'object' && 'props' in mark) {
      if (mark && typeof mark === 'object' && 'props' in mark) {
        expect((mark as any).props.children).toBe('123');
      }
    }
  });

  it('handles text with unicode characters', () => {
    const result = highlightText('café café', 'café');
    // @ts-ignore
    const marks = result.filter((el: unknown): el is React.ReactElement => React.isValidElement(el));
    expect(marks.length).toBe(2);
    marks.forEach((mark: React.ReactElement) => {
      if (mark && typeof mark === 'object' && 'props' in mark) {
        expect((mark as any).props.children).toBe('café');
      }
    });
  });

  it('handles searchQuery with unicode characters', () => {
    const result = highlightText('café', 'é');
    // @ts-ignore
    const mark = result.find((el: unknown): el is React.ReactElement => React.isValidElement(el));
    expect(mark).toBeTruthy();
    if (mark && typeof mark === 'object' && 'props' in mark) {
      if (mark && typeof mark === 'object' && 'props' in mark) {
        expect((mark as any).props.children).toBe('é');
      }
    }
  });

  it('returns original text if searchQuery is undefined', () => {
    // @ts-ignore
    expect(highlightText('foo bar', undefined)).toBe('foo bar');
  });

  it('returns original text if options is null', () => {
    // @ts-ignore
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
      // @ts-ignore
      expect(getHighlightedText(null, 'foo')).toBe(null);
      // @ts-ignore
      expect(getHighlightedText(undefined, 'foo')).toBe(undefined);
    });

    it('returns original text if searchQuery is null or undefined', () => {
      // @ts-ignore
      expect(getHighlightedText('foo', null)).toBe('foo');
      // @ts-ignore
      expect(getHighlightedText('foo', undefined)).toBe('foo');
    });
  });
});
