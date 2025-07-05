import React from 'react';
import { render, screen } from '@testing-library/react';
import AdminPage from './page';

// Mock the AdminDashboard component to test rendering
jest.mock('@/components/admin/AdminDashboard', () => () => (
  <div data-testid="admin-dashboard-mock">Mock AdminDashboard</div>
));

describe('AdminPage', () => {
  it('renders the AdminDashboard component', () => {
    render(<AdminPage />);
    expect(screen.getByTestId('admin-dashboard-mock')).toBeInTheDocument();
  });
});
