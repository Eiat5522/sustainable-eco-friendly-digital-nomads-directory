import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { FilterMultiSelect } from '../filter-multi-select';
import { LucideIcon } from 'lucide-react';

const mockOptions = [
  { value: '1', label: 'Option 1', count: 10 },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3', count: 5 },
];

const MockIcon: LucideIcon = () => <svg />;

describe('FilterMultiSelect', () => {
  const user = userEvent.setup();

  it('renders with label', () => {
    render(<FilterMultiSelect label="Test Label" options={mockOptions} selected={[]} onChange={() => {}} />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('displays the number of selected items', () => {
    render(<FilterMultiSelect label="Test Label" options={mockOptions} selected={['1', '2']} onChange={() => {}} />);
    expect(screen.getByText('Test Label (2)')).toBeInTheDocument();
  });

  it('opens the dropdown on click', async () => {
    render(<FilterMultiSelect label="Test Label" options={mockOptions} selected={[]} onChange={() => {}} />);
    await user.click(screen.getByText('Test Label'));
    expect(await screen.findByText('Option 1 (10)', undefined, { timeout: 2000 })).toBeInTheDocument();
    expect(await screen.findByText('Option 2', undefined, { timeout: 2000 })).toBeInTheDocument();
  });

  it('calls onChange with the correct value when an item is selected', async () => {
    const handleChange = jest.fn();
    render(<FilterMultiSelect label="Test Label" options={mockOptions} selected={[]} onChange={handleChange} />);
    await user.click(screen.getByText('Test Label'));
    const option1 = await screen.findByText('Option 1 (10)', undefined, { timeout: 2000 });
    await user.click(option1);
    expect(handleChange).toHaveBeenCalledWith(['1']);
  });

  it('calls onChange with the correct value when an item is deselected', async () => {
    const handleChange = jest.fn();
    render(<FilterMultiSelect label="Test Label" options={mockOptions} selected={['1', '2']} onChange={handleChange} />);
    await user.click(screen.getByText('Test Label (2)'));
    const option1 = await screen.findByText('Option 1 (10)', undefined, { timeout: 2000 });
    await user.click(option1);
    expect(handleChange).toHaveBeenCalledWith(['2']);
  });

  it('renders with a trigger icon', () => {
    render(<FilterMultiSelect label="Test Label" options={mockOptions} selected={[]} onChange={() => {}} triggerIcon={MockIcon} />);
    expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument();
  });

  it('does not deselect other items when selecting a new one', async () => {
    const handleChange = jest.fn();
    render(<FilterMultiSelect label="Test Label" options={mockOptions} selected={['1']} onChange={handleChange} />);
    await user.click(screen.getByText('Test Label (1)'));
    const option2 = await screen.findByText('Option 2', undefined, { timeout: 2000 });
    await user.click(option2);
    expect(handleChange).toHaveBeenCalledWith(['1', '2']);
  });
});
