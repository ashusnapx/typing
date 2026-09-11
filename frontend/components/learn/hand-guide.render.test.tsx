// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KeyboardHands, LessonKeys } from './hand-guide';
import { getFlatLessons } from '@/lib/typing-curriculum';
import { lessonKeysFor } from './hand-guide';

/** What the drawing says it is showing, which is what a screen reader gets and
 *  what these assertions can read. */
const label = () => screen.getByRole('img').getAttribute('aria-label') ?? '';

describe('the drawing is about the lesson, not about the home row', () => {
  it('shows the resting position when the lesson stays on the home row', () => {
    render(<KeyboardHands keys={['a', 's', 'd', 'f']} />);
    expect(screen.getByText('Where your fingers rest')).toBeInTheDocument();
    expect(label()).toContain('resting on the home row');
  });

  it('lifts only the fingers the lesson needs', () => {
    // Every lesson used to get an identical picture of A S D F, which is no
    // use at all to a drill on the top row.
    render(<KeyboardHands keys={['e', 't']} />);
    expect(screen.getByText('Which finger reaches which key')).toBeInTheDocument();
    expect(label()).toContain('Left Middle reaches E');
    expect(label()).toContain('Left Index reaches T');
    expect(label()).not.toContain('Right');
  });

  it('draws the whole board and lights only the keys in play', () => {
    const { container } = render(<KeyboardHands keys={['e']} />);
    const keys = Array.from(container.querySelectorAll('text')).map((t) => t.textContent);
    // The whole board is drawn now, every row of it: a keyboard that changes
    // shape between lessons is not the keyboard the learner is sitting at.
    expect(keys).toContain('E');
    expect(keys).toContain('A');
    expect(keys).toContain('Z');
    expect(keys).toContain('1');
    // What tells the lesson apart is which keys are lit, not which are drawn.
    const lit = Array.from(container.querySelectorAll('rect[data-lit="true"]'));
    expect(lit).toHaveLength(1);
  });

  it('sends each digit to the right hand', () => {
    render(<KeyboardHands keys={['1', '2', '9', '0']} />);
    const l = label();
    expect(l).toContain('Left Pinky reaches 1');
    expect(l).toContain('Left Ring reaches 2');
    expect(l).toContain('Right Ring reaches 9');
    expect(l).toContain('Right Pinky reaches 0');
  });

  it('marks the lesson keys and leaves the rest plain', () => {
    const { container } = render(<KeyboardHands keys={['e']} />);
    const lit = container.querySelectorAll('rect[data-lit="true"]');
    expect(lit).toHaveLength(1);
  });

  it('lights every lesson key, not just the one a finger reaches for', () => {
    // A finger can only reach one key at a time, but the lesson teaches all of
    // them, so all of them are marked.
    const { container } = render(<KeyboardHands keys={['y', 'b', 'v', 'k']} />);
    const lit = container.querySelectorAll('rect[data-lit="true"]');
    expect(lit).toHaveLength(4);
  });
});

describe('the key list names a finger for every key', () => {
  it('groups the lesson keys by hand', () => {
    render(<LessonKeys keys={['f', 'j', '4']} />);
    expect(screen.getByText('Left hand')).toBeInTheDocument();
    expect(screen.getByText('Right hand')).toBeInTheDocument();
    expect(screen.getAllByText('Left Index').length).toBeGreaterThan(0);
  });

  it('renders nothing when there is nothing to name', () => {
    const { container } = render(<LessonKeys keys={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('every lesson in the course produces a drawing', () => {
  it('never renders a board with no keys on it', () => {
    for (const lesson of getFlatLessons()) {
      const { container, unmount } = render(<KeyboardHands keys={lessonKeysFor(lesson)} />);
      const caps = container.querySelectorAll('rect[rx="9"]');
      // Ten home-row keys and the space bar, at the very least.
      expect(caps.length, lesson.id).toBeGreaterThanOrEqual(11);
      unmount();
    }
  });
});
