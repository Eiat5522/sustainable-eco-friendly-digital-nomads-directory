import { render, screen } from '@testing-library/react';
import CommentList from '../CommentList';

describe('CommentList', () => {
  it('renders all comments with their content and author names', () => {
    const comments = [
      { _id: '1', content: 'First comment', user: { name: 'Alice' } },
      { _id: '2', content: 'Second insight', user: { name: 'Bob' } },
    ] as const;

    render(<CommentList comments={comments} />);

    expect(screen.getByText('First comment')).toBeInTheDocument();
    expect(screen.getByText(/Alice$/)).toBeInTheDocument();
    expect(screen.getByText('Second insight')).toBeInTheDocument();
    expect(screen.getByText(/Bob$/)).toBeInTheDocument();
  });

  it('falls back to Anonymous when no user information is provided', () => {
    const comments = [
      { _id: '3', content: 'Mystery feedback', user: null },
      { _id: '4', content: 'Another note' },
    ] as const;

    render(<CommentList comments={comments} />);

    const anonymousLabels = screen.getAllByText(/Anonymous$/);
    expect(anonymousLabels).toHaveLength(2);
    expect(screen.getByText('Mystery feedback')).toBeInTheDocument();
    expect(screen.getByText('Another note')).toBeInTheDocument();
  });
});
