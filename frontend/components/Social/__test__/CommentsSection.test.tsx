import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import { groupWalkService } from '@/services/groupWalkService';
import { COMMENT_PAGE_SIZE } from '@/hooks/useGroupWalkComments';
import { CommentsSection } from '../CommentsSection';

jest.mock('@/services/groupWalkService', () => ({
  groupWalkService: { listComments: jest.fn(), addComment: jest.fn(), deleteComment: jest.fn() },
}));

const service = groupWalkService as jest.Mocked<typeof groupWalkService>;

const fromAnn = { _id: 'c1', author: { _id: 'u2', name: 'Ann' }, text: 'See you there', createdAt: '2030-01-01T13:00:00.000Z' };
const fromBob = { _id: 'c2', author: { _id: 'u3', name: 'Bob' }, text: 'Bringing snacks', createdAt: '2030-01-01T14:00:00.000Z' };

beforeEach(() => {
  jest.clearAllMocks();
  // Newest first, as the server sends them
  service.listComments.mockResolvedValue([fromBob, fromAnn]);
  service.deleteComment.mockResolvedValue(undefined);
});

type Props = React.ComponentProps<typeof CommentsSection>;
const renderSection = async (props: Partial<Props> = {}) => {
  const screen = renderWithTheme(
    <CommentsSection walkId="w1" currentUserId="u2" isOrganiser={false} closedReason={null} {...props} />,
  );
  await screen.findByText('See you there');
  return screen;
};

describe('CommentsSection', () => {
  it('lists the comments oldest first with their authors', async () => {
    const { getAllByText, getByText } = await renderSection();

    expect(getByText('Ann')).toBeTruthy();
    expect(getByText('Bob')).toBeTruthy();
    const texts = getAllByText(/See you there|Bringing snacks/).map((node) => node.props.children);
    expect(texts).toEqual(['See you there', 'Bringing snacks']);
  });

  it('posts a comment, which then appears in the list', async () => {
    service.addComment.mockResolvedValue({
      _id: 'c3',
      author: { _id: 'u2', name: 'Ann' },
      text: 'On my way',
      createdAt: '2030-01-01T15:00:00.000Z',
    });
    const { getByLabelText, getByRole, findByText } = await renderSection();

    fireEvent.changeText(getByLabelText('Write a comment'), '  On my way ');
    fireEvent.press(getByRole('button', { name: 'Post comment' }));

    expect(await findByText('On my way')).toBeTruthy();
    expect(service.addComment).toHaveBeenCalledWith('w1', 'On my way');
    await waitFor(() => expect(getByLabelText('Write a comment').props.value).toBe(''));
  });

  it('counts the characters up to 500', async () => {
    const { getByLabelText, getByText } = await renderSection();

    expect(getByText('0/500')).toBeTruthy();
    fireEvent.changeText(getByLabelText('Write a comment'), 'Hello');

    expect(getByText('5/500')).toBeTruthy();
    expect(getByLabelText('Write a comment').props.maxLength).toBe(500);
  });

  it("can't post an empty comment", async () => {
    const { getByLabelText, getByRole } = await renderSection();

    expect(getByRole('button', { name: 'Post comment' })).toBeDisabled();
    fireEvent.changeText(getByLabelText('Write a comment'), '   ');
    expect(getByRole('button', { name: 'Post comment' })).toBeDisabled();
  });

  it('lets me delete only my own comments', async () => {
    const { getByLabelText, queryByLabelText } = await renderSection();

    expect(getByLabelText('Delete your comment')).toBeTruthy();
    expect(queryByLabelText("Delete Bob's comment")).toBeNull();
  });

  it('lets the organiser delete any comment, after confirming', async () => {
    const { getByLabelText, findByText, queryByText } = await renderSection({ currentUserId: 'u1', isOrganiser: true });

    fireEvent.press(getByLabelText("Delete Ann's comment"));
    fireEvent.press(await findByText('Delete'));

    await waitFor(() => expect(service.deleteComment).toHaveBeenCalledWith('w1', 'c1'));
    await waitFor(() => expect(queryByText('See you there')).toBeNull());
  });

  it('hides the comment box and explains why when commenting is closed', async () => {
    const { queryByLabelText, getByText } = await renderSection({ closedReason: 'Comments are closed.' });

    expect(queryByLabelText('Write a comment')).toBeNull();
    expect(getByText('Comments are closed.')).toBeTruthy();
  });

  it('loads older comments on request', async () => {
    const fullPage = Array.from({ length: COMMENT_PAGE_SIZE }, (_, i) => ({
      ...fromAnn,
      _id: `n${i}`,
      text: i === COMMENT_PAGE_SIZE - 1 ? 'See you there' : `Newer ${i}`,
      createdAt: new Date(Date.UTC(2030, 0, 1, 12, 59 - i)).toISOString(),
    }));
    service.listComments.mockResolvedValueOnce(fullPage).mockResolvedValueOnce([
      { ...fromBob, _id: 'old', text: 'Oldest one', createdAt: '2029-12-31T10:00:00.000Z' },
    ]);
    const { getByText, findByText, queryByText } = await renderSection();

    fireEvent.press(getByText('Load older comments'));

    expect(await findByText('Oldest one')).toBeTruthy();
    expect(queryByText('Load older comments')).toBeNull();
  });

  it('invites the first comment when there are none', async () => {
    service.listComments.mockResolvedValue([]);
    const { findByText } = renderWithTheme(
      <CommentsSection walkId="w1" currentUserId="u2" isOrganiser={false} closedReason={null} />,
    );

    expect(await findByText('No comments yet.')).toBeTruthy();
  });

  it('offers a retry when the comments fail to load', async () => {
    service.listComments.mockRejectedValueOnce(new Error('Network Error'));
    const { findByText, getByText } = renderWithTheme(
      <CommentsSection walkId="w1" currentUserId="u2" isOrganiser={false} closedReason={null} />,
    );

    expect(await findByText("Couldn't load the comments")).toBeTruthy();
    fireEvent.press(getByText('Try again'));

    expect(await findByText('See you there')).toBeTruthy();
  });
});
