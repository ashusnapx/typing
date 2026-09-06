'use client';

import { useMemo, useRef, useEffect } from 'react';

interface TypingDisplayProps {
  originalContent: string;
  typedContent: string;
  isActive: boolean;
}

function getCharState(original: string, typed: string, index: number): 'untyped' | 'correct' | 'incorrect' | 'extra' {
  if (index >= original.length) return 'untyped';
  if (index >= typed.length) return 'untyped';
  if (index >= original.length && index < typed.length) return 'extra';
  return typed[index] === original[index] ? 'correct' : 'incorrect';
}

export function TypingDisplay({ originalContent, typedContent, isActive }: TypingDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const currentIndex = typedContent.length;

  const words = useMemo(() => {
    const chars = originalContent.split('');
    const words: { chars: { char: string; state: 'untyped' | 'correct' | 'incorrect' | 'extra'; globalIndex: number }[] }[] = [];
    let currentWord: typeof words[0]['chars'] = [];
    let globalIndex = 0;

    for (const char of chars) {
      if (char === ' ' && currentWord.length > 0) {
        words.push({ chars: currentWord });
        currentWord = [];
      }
      const state = getCharState(originalContent, typedContent, globalIndex);
      currentWord.push({ char, state, globalIndex });
      globalIndex++;
    }
    if (currentWord.length > 0) words.push({ chars: currentWord });

    return words;
  }, [originalContent, typedContent]);

  useEffect(() => {
    if (caretRef.current && containerRef.current) {
      const container = containerRef.current;
      const caret = caretRef.current;
      const caretRect = caret.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const relativeTop = caretRect.top - containerRect.top;

      if (relativeTop < container.scrollTop || relativeTop > container.scrollTop + container.clientHeight - 60) {
        caret.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
  }, [currentIndex]);

  return (
    <div className="card flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        ref={containerRef}
        className="scroll-fade min-h-0 flex-1 select-none overflow-y-auto scroll-smooth break-words px-5 py-5 text-lg leading-[1.9] focus:outline-none sm:px-6 sm:text-xl"
      >
        {words.map((word, wi) => (
          <span key={wi}>
            {word.chars.map((c, ci) => {
              const isCurrent = c.globalIndex === currentIndex;
              const isExtra = c.globalIndex >= originalContent.length;

              if (isExtra) {
                return (
                  <span key={ci} className="ch text-err/60 line-through">
                    {typedContent[c.globalIndex] || ''}
                  </span>
                );
              }

              // A mistyped space needs its own treatment: colouring a blank
              // character does nothing, so the cell itself is filled instead.
              const cls =
                c.state === 'correct'
                  ? 'ch ch-correct'
                  : c.state === 'incorrect'
                    ? c.char === ' '
                      ? 'ch ch-error-space'
                      : 'ch ch-error'
                    : 'ch ch-pending';

              return (
                <span key={ci} className={cls}>
                  {isCurrent && isActive && (
                    <span ref={caretRef} className="caret" aria-hidden="true" />
                  )}
                  {c.state === 'incorrect' ? typedContent[c.globalIndex] : c.char}
                </span>
              );
            })}
          </span>
        ))}
      </div>
    </div>
  );
}
