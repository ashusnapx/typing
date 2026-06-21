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

  const progress = originalContent.length > 0
    ? Math.min(100, (typedContent.length / originalContent.length) * 100)
    : 0;

  return (
    <div className="card-hand-lg p-6 relative overflow-hidden">
      <div className="w-full bg-muted/50 h-1.5 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-blue-pen transition-all duration-200 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div
        ref={containerRef}
        className="font-mono text-xl leading-[2.2] text-pencil/30 select-none h-[280px] overflow-y-auto scroll-smooth focus:outline-none"
        style={{ wordBreak: 'break-word' }}
      >
        {words.map((word, wi) => (
          <span key={wi} className="inline mr-3">
            {word.chars.map((c, ci) => {
              const isCurrent = c.globalIndex === currentIndex;
              const isExtra = c.globalIndex >= originalContent.length;

              if (isExtra) {
                return (
                  <span key={ci} className="text-accent/50 line-through">
                    {typedContent[c.globalIndex] || ''}
                  </span>
                );
              }

              if (isCurrent && isActive) {
                return (
                  <span key={ci} className="relative">
                    <span
                      ref={caretRef}
                      className="absolute -left-[1px] top-0 w-[2px] h-[1.2em] bg-pencil animate-pulse"
                    />
                    <span className="text-pencil">{c.char}</span>
                  </span>
                );
              }

              if (c.state === 'correct') {
                return <span key={ci} className="text-pencil">{c.char}</span>;
              }

              if (c.state === 'incorrect') {
                return (
                  <span key={ci} className="text-accent">
                    <span className="bg-red-100 rounded">{typedContent[c.globalIndex]}</span>
                  </span>
                );
              }

              return <span key={ci} className="text-pencil/25">{c.char}</span>;
            })}
          </span>
        ))}
      </div>
    </div>
  );
}
