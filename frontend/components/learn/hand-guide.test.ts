import { describe, it, expect } from 'vitest';
import { fingerFor, lessonKeysFor } from './hand-guide';
import { fingerMap, HAND } from './keyboard-layout';
import { getFlatLessons } from '@/lib/typing-curriculum';

describe('the number row is taught on the right hand', () => {
  it('puts 1 to 5 on the left hand and 6 to 0 on the right', () => {
    // These were mirrored: 1 to 5 were taught as right-hand keys and 6 to 9 as
    // left-hand ones. Figures cost a full mistake under the Commission's
    // marking, so the row where accuracy is most expensive was the one row
    // teaching the wrong hand.
    for (const digit of ['1', '2', '3', '4', '5']) {
      expect(HAND[fingerMap[digit]], digit).toBe('left');
    }
    for (const digit of ['6', '7', '8', '9', '0']) {
      expect(HAND[fingerMap[digit]], digit).toBe('right');
    }
  });

  it('walks outward from the index fingers, as every chart has it', () => {
    expect(fingerMap['1']).toBe('lp');
    expect(fingerMap['2']).toBe('lr');
    expect(fingerMap['3']).toBe('lm');
    expect(fingerMap['4']).toBe('li');
    expect(fingerMap['5']).toBe('li');
    expect(fingerMap['6']).toBe('ri');
    expect(fingerMap['7']).toBe('ri');
    expect(fingerMap['8']).toBe('rm');
    expect(fingerMap['9']).toBe('rr');
    expect(fingerMap['0']).toBe('rp');
  });

  it('agrees with the letter above and below it on the same finger', () => {
    // 4, R and V are all left index; 7, U and M are all right index.
    for (const column of [['4', 'r', 'v'], ['3', 'e', 'c'], ['2', 'w', 'x'], ['1', 'q', 'z'],
                          ['7', 'u', 'm'], ['8', 'i', ','], ['9', 'o', '.'], ['0', 'p', '/']]) {
      const fingers = column.map((k) => fingerMap[k]);
      expect(new Set(fingers).size, column.join(' ')).toBe(1);
    }
  });
});

describe('every lesson can say which finger presses what', () => {
  it('maps the keys a lesson names', () => {
    expect(fingerFor('a')).toBe('lp');
    expect(fingerFor('J')).toBe('ri');
    expect(fingerFor(';')).toBe('rp');
    expect(fingerFor('space')).toBe('thumb');
    expect(fingerFor('Left Shift')).toBe('lp');
    expect(fingerFor('')).toBeNull();
    expect(fingerFor('¤')).toBeNull();
  });

  it('derives the digits for a passage drill that names no keys', () => {
    // The figures drill is a passage with a focus and no key list of its own,
    // and it is the drill where the fingering matters most.
    const keys = lessonKeysFor({
      focus: 'figures',
      sampleText: 'Rs. 1,48,000 crore, up 12.5% over 2024-25.',
    });
    expect(keys).toEqual(['0', '1', '2', '4', '5', '8']);
    for (const k of keys) expect(fingerFor(k)).toBeTruthy();
  });

  it('derives the marks for a punctuation drill', () => {
    const keys = lessonKeysFor({ focus: 'punctuation', sampleText: 'Yes, sir; no. Right?' });
    expect(new Set(keys)).toEqual(new Set([',', ';', '.', '?']));
  });

  it('names both Shift keys for a capitalisation drill', () => {
    expect(lessonKeysFor({ focus: 'capitalisation', sampleText: 'The Reserve Bank' }))
      .toEqual(['Left Shift', 'Right Shift']);
  });

  it('prefers the keys a lesson declares over anything derived', () => {
    expect(lessonKeysFor({ keys: ['F', 'J'], focus: 'figures', sampleText: '2019' }))
      .toEqual(['F', 'J']);
  });

  it('resolves a finger for every key every real lesson names', () => {
    // A lesson that names a key we cannot place is a lesson that silently
    // shows the learner nothing.
    for (const lesson of getFlatLessons()) {
      for (const key of lessonKeysFor(lesson)) {
        expect(fingerFor(key), `${lesson.id} -> ${key}`).toBeTruthy();
      }
    }
  });

  it('gives the typing lessons something to show', () => {
    const typing = getFlatLessons().filter(
      (l) => l.drillType === 'letters' || l.drillType === 'words',
    );
    const withKeys = typing.filter((l) => lessonKeysFor(l).length > 0);
    expect(withKeys.length).toBeGreaterThan(typing.length * 0.5);
  });
});
