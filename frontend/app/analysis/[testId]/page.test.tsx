// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import AnalysisPage from './page';

/**
 * The report a candidate opens after a test.
 *
 * These assert what has to be on the screen and what must never be. The page
 * used to decide the verdict for itself, print a passage-completion rule the
 * Commission does not have, and describe full and half mistakes backwards in
 * its own tooltips — so a candidate could read one thing here and another on
 * the dashboard about the same attempt.
 */

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => ({ testId: 'test-1' }),
  useRouter: () => ({ push, back: vi.fn() }),
}));
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

const result = vi.fn();
const replay = vi.fn(() => ({ data: undefined }));
vi.mock('@/lib/queries', () => ({
  useTestResult: () => result(),
  useTestReplay: () => replay(),
}));

const SENTENCE = 'The Reserve Bank of India said that growth would rise this year. ';
const PASSAGE = SENTENCE.repeat(12).trim();

const attempt = (over: Record<string, unknown> = {}) => ({
  data: {
    mode: 'ssc_chsl',
    net_wpm: 40,
    ssc_net_wpm: 40,
    ssc_accuracy: 98,
    ssc_error_percentage: 2,
    full_mistakes: 1,
    half_mistakes: 0,
    key_depression_count: 2000,
    time_taken_seconds: 600,
    duration_seconds: 600,
    is_qualified: true,
    typed_content: PASSAGE,
    original_content: PASSAGE,
    date: '2026-09-09T06:00:00.000Z',
    ...over,
  },
  isLoading: false,
  error: null,
});

beforeEach(() => {
  vi.clearAllMocks();
  replay.mockReturnValue({ data: undefined });
  // The chosen category is remembered, so it has to be cleared between tests
  // or one test's choice decides another's error limit.
  localStorage.clear();
});

describe('the verdict', () => {
  it('shows the stored verdict, not one it works out again', () => {
    // Deliberately contradictory: the figures look like a pass, the stored
    // verdict is a fail. The stored verdict is the one that decided the
    // candidate's result, so it is the one that must show.
    result.mockReturnValue(attempt({ is_qualified: false }));
    render(<AnalysisPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Not qualified');
  });

  it('says which of the two requirements cost the attempt', () => {
    result.mockReturnValue(
      attempt({ is_qualified: false, ssc_error_percentage: 20, ssc_accuracy: 80 }),
    );
    render(<AnalysisPage />);
    expect(screen.getByText(/Mistakes are what cost you this attempt/)).toBeInTheDocument();
  });

  it('says so when the attempt cleared', () => {
    result.mockReturnValue(attempt());
    render(<AnalysisPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Qualified');
    expect(screen.getByText(/met both requirements/)).toBeInTheDocument();
  });
});

describe('the two requirements', () => {
  it('quotes the bar for the post, not a flat 35 WPM and 20% for everything', () => {
    result.mockReturnValue(attempt());
    render(<AnalysisPage />);
    expect(screen.getByText(/35 WPM needed/)).toBeInTheDocument();
    expect(screen.getByText(/7% or less needed/)).toBeInTheDocument();
  });

  it('quotes 30 WPM for a Hindi attempt', () => {
    result.mockReturnValue(attempt({ mode: 'ssc_hindi' }));
    render(<AnalysisPage />);
    expect(screen.getByText(/30 WPM needed/)).toBeInTheDocument();
    expect(screen.getByText(/Hindi paper qualifies at 30, not 35/)).toBeInTheDocument();
  });

  it('quotes key depressions per hour for a DEO attempt', () => {
    result.mockReturnValue(attempt({ mode: 'ssc_chsl_deo', ssc_net_wpm: 28, net_wpm: 28 }));
    render(<AnalysisPage />);
    expect(screen.getByText(/8,000 needed/)).toBeInTheDocument();
    // Net of mistakes: 28 x 300, not the raw depression rate.
    expect(screen.getByText(/8,400 KDPH/)).toBeInTheDocument();
  });

  it('shows the arithmetic that produced the speed', () => {
    result.mockReturnValue(attempt());
    render(<AnalysisPage />);
    expect(screen.getByText(/How this was worked out/)).toBeInTheDocument();
    expect(screen.getByText(/÷ 5/)).toBeInTheDocument();
  });
});

describe('what it must never say', () => {
  it('does not invent a passage-completion rule', () => {
    // "Need >=50% passage completion to qualify" was printed as fact, with a
    // citation to the SSC notification beside it. There is no such rule.
    result.mockReturnValue(attempt({ typed_content: PASSAGE.slice(0, 300) }));
    render(<AnalysisPage />);
    expect(screen.queryByText(/50% passage completion/i)).not.toBeInTheDocument();
    expect(screen.getByText(/no rule that says you must finish/)).toBeInTheDocument();
  });

  it('does not show a consistency or rhythm score that is always the same number', () => {
    result.mockReturnValue(attempt({ consistency_score: 100, typing_rhythm_score: 100 }));
    render(<AnalysisPage />);
    expect(screen.queryByText(/Rhythm Score/i)).not.toBeInTheDocument();
  });
});

describe('what cost you marks', () => {
  it('lists each kind of mistake with what it cost and where to drill it', () => {
    const typed = PASSAGE.replace('Reserve', 'reserve').replace('growth', 'growht');
    result.mockReturnValue(attempt({ typed_content: typed, is_qualified: false }));
    render(<AnalysisPage />);

    const panel = screen.getByRole('heading', { name: /What cost you marks/ }).closest('section')!;
    expect(within(panel).getByText('Capital letters')).toBeInTheDocument();
    expect(within(panel).getByText('Spelling')).toBeInTheDocument();
    expect(within(panel).getByText(/half mistake each/)).toBeInTheDocument();
    expect(within(panel).getByText(/full mistake each/)).toBeInTheDocument();
    // The moat: every finding points at the drill that fixes it.
    for (const link of within(panel).getAllByRole('link', { name: /Practise:/ })) {
      expect(link).toHaveAttribute('href', expect.stringContaining('/exam/lesson/'));
    }
  });

  it('says nothing was wrong when nothing was wrong', () => {
    result.mockReturnValue(attempt());
    render(<AnalysisPage />);
    expect(screen.getByText(/Nothing was marked wrong/)).toBeInTheDocument();
  });

  it('does not charge an unfinished attempt for the part never reached', () => {
    // Typed a third of the passage, perfectly. The old page listed every
    // remaining word as an error.
    const words = PASSAGE.split(' ');
    result.mockReturnValue(
      attempt({ typed_content: words.slice(0, 30).join(' '), is_qualified: false }),
    );
    render(<AnalysisPage />);
    expect(screen.getByText(/Nothing was marked wrong/)).toBeInTheDocument();
    expect(screen.getByText(/ran out of time before the end/)).toBeInTheDocument();
  });
});

describe('when the attempt cannot be shown', () => {
  it('explains itself rather than rendering an empty page', () => {
    result.mockReturnValue({ data: undefined, isLoading: false, error: new Error('Test not found.') });
    render(<AnalysisPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('could not find that test');
    expect(screen.getByRole('link', { name: /Back to dashboard/ })).toBeInTheDocument();
  });

  it('says so when the passage was not saved with the attempt', () => {
    result.mockReturnValue(attempt({ typed_content: '', original_content: '' }));
    render(<AnalysisPage />);
    expect(screen.getByText(/passage for this attempt was not saved/)).toBeInTheDocument();
  });
});

describe('the category a candidate picks', () => {
  it('is read from the same place the result screen writes it', () => {
    // The two screens used different keys, so choosing SC/ST after a test and
    // then opening the report on that test showed the UR limit again.
    localStorage.setItem('tm-category-v2', 'scSt');
    result.mockReturnValue(attempt({ ssc_error_percentage: 9, is_qualified: false }));
    render(<AnalysisPage />);
    // 9% is over the 7% general cap and inside the 10% allowed to SC/ST.
    expect(screen.getByText(/10% or less needed/)).toBeInTheDocument();
  });

  it('offers PwBD, which the result screen also offers', () => {
    result.mockReturnValue(attempt());
    render(<AnalysisPage />);
    expect(screen.getByRole('tab', { name: 'PwBD' })).toBeInTheDocument();
  });
});
