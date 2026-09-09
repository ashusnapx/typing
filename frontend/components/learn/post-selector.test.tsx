// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PostSelector } from './post-selector';
import { getPost } from '@/lib/ssc-posts';

const chsl = getPost('chsl_ldc_jsa')!;
const cgl = getPost('cgl_tax_assistant')!;

const setup = (post = chsl) => {
  const onPostChange = vi.fn();
  const onCategoryChange = vi.fn();
  const onScribeChange = vi.fn();
  render(
    <PostSelector
      post={post}
      category="ur"
      scribe={false}
      onPostChange={onPostChange}
      onCategoryChange={onCategoryChange}
      onScribeChange={onScribeChange}
    />,
  );
  return { onPostChange, onCategoryChange, onScribeChange };
};

describe('the target is three questions, not five', () => {
  it('asks the exam, the category and the scribe allowance', () => {
    setup();
    expect(screen.getByText('Which exam are you sitting?')).toBeInTheDocument();
    expect(screen.getByText('Your category')).toBeInTheDocument();
    expect(screen.getByText(/Eligible for a scribe/)).toBeInTheDocument();
  });

  it('does not ask which post they applied for', () => {
    // Which post a candidate is allotted is decided long after the skill test,
    // so it was a question they could not answer.
    setup();
    expect(screen.queryByText('Post applied for')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('has no by-post and by-score tabs', () => {
    setup();
    expect(screen.queryByRole('tab', { name: 'By post' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'By score' })).not.toBeInTheDocument();
    expect(screen.queryByText('What can you type today?')).not.toBeInTheDocument();
  });
});

describe('the exam sets the bar', () => {
  it('shows the CHSL typing bar', () => {
    setup(chsl);
    expect(screen.getByText('35 WPM')).toBeInTheDocument();
    expect(screen.getByText('10 min')).toBeInTheDocument();
    expect(screen.getByText('7%')).toBeInTheDocument();
  });

  it('shows the CGL bar in key depressions', () => {
    setup(cgl);
    expect(screen.getByText('8,000 KDPH')).toBeInTheDocument();
    expect(screen.getByText('15 min')).toBeInTheDocument();
    expect(screen.getByText('5%')).toBeInTheDocument();
  });

  it('switches to the other exam without asking for a post', () => {
    const { onPostChange } = setup(chsl);
    fireEvent.click(screen.getByRole('radio', { name: 'SSC CGL' }));
    expect(onPostChange).toHaveBeenCalledWith('cgl_tax_assistant');
  });

  it('marks the exam the candidate is on', () => {
    setup(cgl);
    expect(screen.getByRole('radio', { name: 'SSC CGL' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'SSC CHSL' })).toHaveAttribute('aria-checked', 'false');
  });
});

describe('the category and the scribe allowance still work', () => {
  it('reports the category the candidate picks', () => {
    const { onCategoryChange } = setup();
    fireEvent.click(screen.getByRole('radio', { name: 'SC / ST' }));
    expect(onCategoryChange).toHaveBeenCalledWith('scSt');
  });

  it('reports the scribe allowance', () => {
    const { onScribeChange } = setup();
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onScribeChange).toHaveBeenCalledWith(true);
  });
});
