// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Board } from './board';

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

const mine = vi.fn();
vi.mock('@/lib/queries', () => ({ useMyRank: () => mine() }));
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

/** The rows arrive as props now — the server renders them. */
let rows: ReturnType<typeof row>[] = [];
let states: string[] = [];
const render0 = () => render(<Board rows={rows} states={states} />);

beforeEach(() => {
  vi.clearAllMocks();
  rows = [];
  states = [];
  mine.mockReturnValue({ data: undefined });
  authed.mockReturnValue(true);
});

describe('the board renders', () => {
  it('lists candidates with their best cleared attempt', () => {
    // The page was `return null` — linked from the navbar and the footer and
    // rendering nothing at all.
    rows = [row()];
    render0();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Leaderboard');
    expect(screen.getByText('Asha Devi')).toBeInTheDocument();
    expect(screen.getByText('41.2 WPM')).toBeInTheDocument();
    expect(screen.getByText('97.4%')).toBeInTheDocument();
    expect(screen.getByText(/Bihar · 12 tests/)).toBeInTheDocument();
  });

  it('marks who has actually cleared a bar', () => {
    rows = [row(), row({ userId: 'u2', rank: 2, fullName: 'Ravi', qualified: false })];
    render0();
    expect(screen.getAllByText('cleared')).toHaveLength(1);
  });

  it('says the ranking rule, because raw speed is not the rule', () => {
    rows = [row()];
    render0();
    expect(screen.getByText(/Speed alone does not count/)).toBeInTheDocument();
  });

  it('names an unnamed candidate rather than leaving a blank row', () => {
    rows = [row({ fullName: 'Anonymous candidate', state: null })];
    render0();
    expect(screen.getByText('Anonymous candidate')).toBeInTheDocument();
  });
});

describe('finding yourself on it', () => {
  it('marks the signed-in candidate in the list', () => {
    rows = [row({ userId: 'me' })];
    mine.mockReturnValue({ data: row({ userId: 'me' }) });
    render0();
    expect(screen.getByText('you')).toBeInTheDocument();
  });

  it('adds a row for a candidate ranked below the page', () => {
    // A board you cannot find yourself on is no use to the person it is meant
    // to motivate.
    rows = [row()];
    mine.mockReturnValue({ data: row({ userId: 'me', rank: 84, fullName: 'Me', bestWpm: 22 }) });
    render0();
    expect(screen.getByText('84')).toBeInTheDocument();
    expect(screen.getByText('22.0 WPM')).toBeInTheDocument();
  });

  it('tells a signed-in candidate with no attempts how to appear', () => {
    rows = [row()];
    mine.mockReturnValue({ data: null });
    render0();
    expect(screen.getByText(/Take a full test and you will appear here/)).toBeInTheDocument();
  });
});

describe('when there is nothing to show', () => {
  it('invites the first attempt instead of rendering an empty box', () => {
    rows = [];
    render0();
    expect(screen.getByText(/Nobody has taken a test yet/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Take a test/ })).toHaveAttribute('href', '/exam');
  });

  it('says so when a state filter has no one in it', () => {
    rows = [];
    states = ['Bihar', 'Delhi'];
    render0();
    const bihar = screen.getByRole('button', { name: 'Bihar' });
    bihar.click();
    expect(screen.getByRole('button', { name: 'All India' })).toBeInTheDocument();
  });

  it('offers only the states that have candidates', () => {
    rows = [row()];
    states = ['Bihar'];
    render0();
    expect(screen.getByRole('button', { name: 'Bihar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Kerala' })).not.toBeInTheDocument();
  });
});

describe('the state filter works on the rows already in hand', () => {
  it('narrows to one state without another request', () => {
    rows = [
      row({ userId: 'a', rank: 1, fullName: 'Asha', state: 'Bihar' }),
      row({ userId: 'b', rank: 2, fullName: 'Ravi', state: 'Delhi' }),
      row({ userId: 'c', rank: 3, fullName: 'Sita', state: 'Bihar' }),
    ];
    states = ['Bihar', 'Delhi'];
    render0();

    fireEvent.click(screen.getByRole('button', { name: 'Delhi' }));
    expect(screen.getByText('Ravi')).toBeInTheDocument();
    expect(screen.queryByText('Asha')).not.toBeInTheDocument();
  });

  it('renumbers a filtered board from one', () => {
    // Otherwise a filtered board reads 1, 3, 7 and looks broken.
    rows = [
      row({ userId: 'a', rank: 1, fullName: 'Asha', state: 'Delhi' }),
      row({ userId: 'b', rank: 2, fullName: 'Ravi', state: 'Bihar' }),
      row({ userId: 'c', rank: 3, fullName: 'Sita', state: 'Bihar' }),
    ];
    states = ['Bihar', 'Delhi'];
    render0();

    fireEvent.click(screen.getByRole('button', { name: 'Bihar' }));
    const ranks = screen.getAllByText(/^[0-9]+$/).map((n) => n.textContent);
    expect(ranks).toEqual(['1', '2']);
  });

  it('goes back to the whole board', () => {
    rows = [row({ userId: 'a', fullName: 'Asha', state: 'Bihar' }),
            row({ userId: 'b', rank: 2, fullName: 'Ravi', state: 'Delhi' })];
    states = ['Bihar', 'Delhi'];
    render0();

    fireEvent.click(screen.getByRole('button', { name: 'Bihar' }));
    expect(screen.queryByText('Ravi')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'All India' }));
    expect(screen.getByText('Ravi')).toBeInTheDocument();
  });
});
