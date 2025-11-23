import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { Checkbox } from '../checkbox';

describe('Checkbox', () => {
  it('renders correctly', () => {
    render(<Checkbox />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  it('handles onChange and onCheckedChange events on click', () => {
    const handleChange = jest.fn();
    const handleCheckedChange = jest.fn();
    render(<Checkbox onChange={handleChange} onCheckedChange={handleCheckedChange} />);
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;

    // Initially unchecked
    expect(checkbox.checked).toBe(false);

    // Click to check
    fireEvent.click(checkbox);
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleCheckedChange).toHaveBeenCalledTimes(1);
    expect(handleCheckedChange).toHaveBeenCalledWith(true);
  });

  it('toggles checked state correctly', () => {
    const handleCheckedChange = jest.fn();
    render(<Checkbox onCheckedChange={handleCheckedChange} />);
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;

    // First click
    fireEvent.click(checkbox);
    expect(handleCheckedChange).toHaveBeenCalledWith(true);

    // Second click
    fireEvent.click(checkbox);
    expect(handleCheckedChange).toHaveBeenCalledWith(false);
  });

  it('handles click event when only onChange is provided', () => {
    const handleChange = jest.fn();
    render(<Checkbox onChange={handleChange} />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('handles click event when only onCheckedChange is provided', () => {
    const handleCheckedChange = jest.fn();
    render(<Checkbox onCheckedChange={handleCheckedChange} />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(handleCheckedChange).toHaveBeenCalledTimes(1);
    expect(handleCheckedChange).toHaveBeenCalledWith(true);
  });

  it('handles click event when no handlers are provided', () => {
    render(<Checkbox />);
    const checkbox = screen.getByRole('checkbox');
    expect(() => fireEvent.click(checkbox)).not.toThrow();
  });

  it('renders with additional className', () => {
    render(<Checkbox className="my-class" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('my-class');
  });

  it('is disabled when the disabled prop is true', () => {
    render(<Checkbox disabled />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('forwards the ref to the input element', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Checkbox ref={ref} />);
    expect(ref.current).toBeInTheDocument();
    expect(ref.current?.tagName).toBe('INPUT');
  });
});
