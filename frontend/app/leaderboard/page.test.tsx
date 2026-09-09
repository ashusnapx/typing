// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import LeaderboardPage from './page';

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

const board = vi.fn();
const mine = vi.fn();
const states = vi.fn();
vi.mock('@/lib/queries', () => ({
  useLeaderboard: () => board(),
  useMyRank: () => mine(),
  useLeaderboardStates: () => states(),
}));
const authed = vi.fn(() => true);
vi.mock('@/store/auth-store', () => ({
  useAuthStore: (sel: any) => sel({ isAuthenticated: authed() }),
}));

const row = (over: Record<string, unknown> = {}) => ({
  rank: 1,
  userId: 'u1',
  fullName: 'Asha Devi',
  state: 'Bihar',
  bestWpm: 41.2,
  bestAccuracy: 97.4,
  qualified: true,
  testsTaken: 12,
  xp: 900,
  level: 3,
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  states.mockReturnValue({ data: [] });
  mine.mockReturnValue({ data: undefined });
  authed.mockReturnValue(true);
});

describe('the board renders', () => {
  it('lists candidates with their best cleared attempt', () => {
    // The page was `return null` — linked from the navbar and the footer and
    // rendering nothing at all.
    board.mockReturnValue({ data: [row()], isLoading: false });
    render(<LeaderboardPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Leaderboard');
    expect(screen.getByText('Asha Devi')).toBeInTheDocument();
    expect(screen.getByText('41.2 WPM')).toBeInTheDocument();
    expect(screen.getByText('97.4%')).toBeInTheDocument();
    expect(screen.getByText(/Bihar · 12 tests/)).toBeInTheDocument();
  });

  it('marks who has actually cleared a bar', () => {
    board.mockReturnValue({
      data: [row(), row({ userId: 'u2', rank: 2, fullName: 'Ravi', qualified: false })],
      isLoading: false,
    });
    render(<LeaderboardPage />);
    expect(screen.getAllByText('cleared')).toHaveLength(1);
  });

  it('says the ranking rule, because raw speed is not the rule', () => {
    board.mockReturnValue({ data: [row()], isLoading: false });
    render(<LeaderboardPage />);
    expect(screen.getByText(/Speed alone does not count/)).toBeInTheDocument();
  });

  it('names an unnamed candidate rather than leaving a blank row', () => {
    board.mockReturnValue({ data: [row({ fullName: 'Anonymous candidate', state: null })], isLoading: false });
    render(<LeaderboardPage />);
    expect(screen.getByText('Anonymous candidate')).toBeInTheDocument();
  });
});

describe('finding yourself on it', () => {
  it('marks the signed-in candidate in the list', () => {
    board.mockReturnValue({ data: [row({ userId: 'me' })], isLoading: false });
    mine.mockReturnValue({ data: row({ userId: 'me' }) });
    render(<LeaderboardPage />);
    expect(screen.getByText('you')).toBeInTheDocument();
  });

  it('adds a row for a candidate ranked below the page', () => {
    // A board you cannot find yourself on is no use to the person it is meant
    // to motivate.
    board.mockReturnValue({ data: [row()], isLoading: false });
    mine.mockReturnValue({ data: row({ userId: 'me', rank: 84, fullName: 'Me', bestWpm: 22 }) });
    render(<LeaderboardPage />);
    expect(screen.getByText('84')).toBeInTheDocument();
    expect(screen.getByText('22.0 WPM')).toBeInTheDocument();
  });

  it('tells a signed-in candidate with no attempts how to appear', () => {
    board.mockReturnValue({ data: [row()], isLoading: false });
    mine.mockReturnValue({ data: null });
    render(<LeaderboardPage />);
    expect(screen.getByText(/Take a full test and you will appear here/)).toBeInTheDocument();
  });
});

describe('when there is nothing to show', () => {
  it('invites the first attempt instead of rendering an empty box', () => {
    board.mockReturnValue({ data: [], isLoading: false });
    render(<LeaderboardPage />);
    expect(screen.getByText(/Nobody has taken a test yet/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Take a test/ })).toHaveAttribute('href', '/exam');
  });

  it('says so when a state filter has no one in it', () => {
    board.mockReturnValue({ data: [], isLoading: false });
    states.mockReturnValue({ data: ['Bihar', 'Delhi'] });
    render(<LeaderboardPage />);
    const bihar = screen.getByRole('button', { name: 'Bihar' });
    bihar.click();
    expect(screen.getByRole('button', { name: 'All India' })).toBeInTheDocument();
  });

  it('offers only the states that have candidates', () => {
    board.mockReturnValue({ data: [row()], isLoading: false });
    states.mockReturnValue({ data: ['Bihar'] });
    render(<LeaderboardPage />);
    expect(screen.getByRole('button', { name: 'Bihar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Kerala' })).not.toBeInTheDocument();
  });
});
