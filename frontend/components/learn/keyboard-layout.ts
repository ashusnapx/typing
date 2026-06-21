export type FingerZone = 'lp' | 'lr' | 'lm' | 'li' | 'ri' | 'rm' | 'rr' | 'rp' | 'thumb';

export interface KeyDef {
  label: string;
  shiftLabel?: string;
  row: number;
  col: number;
  width: number;
  finger: FingerZone;
}

export const FINGER_COLORS: Record<FingerZone, string> = {
  lp: '#ff6b6b',
  lr: '#ffa94d',
  lm: '#ffd43b',
  li: '#69db7c',
  ri: '#4dabf7',
  rm: '#9775fa',
  rr: '#f783ac',
  rp: '#adb5bd',
  thumb: '#868e96',
};

export const FINGER_NAMES: Record<FingerZone, string> = {
  lp: 'Left Pinky',
  lr: 'Left Ring',
  lm: 'Left Middle',
  li: 'Left Index',
  ri: 'Right Index',
  rm: 'Right Middle',
  rr: 'Right Ring',
  rp: 'Right Pinky',
  thumb: 'Thumb',
};

export const HAND: Record<FingerZone, 'left' | 'right'> = {
  lp: 'left', lr: 'left', lm: 'left', li: 'left',
  ri: 'right', rm: 'right', rr: 'right', rp: 'right',
  thumb: 'left',
};

const LETTERS: KeyDef[] = [];

function addRow(layout: string[][], row: number, fingerMap: Record<string, FingerZone>, offsets?: number[]) {
  layout.forEach((keys, col) => {
    keys.forEach((k, i) => {
      let label = k;
      let shiftLabel: string | undefined;
      if (k.length > 1) {
        const parts = k.split('/');
        label = parts[0];
        shiftLabel = parts[1];
      }
      const colPos = col + (offsets?.[row] || 0);
      LETTERS.push({
        label,
        shiftLabel,
        row,
        col: colPos + i * 0.5,
        width: 1,
        finger: fingerMap[label.toLowerCase()] || 'rp',
      });
    });
  });
}

const fingerMap: Record<string, FingerZone> = {
  '`': 'rp', '~': 'rp', '1': 'rp', '!': 'rp', '2': 'rr', '@': 'rr',
  '3': 'rm', '#': 'rm', '4': 'ri', '$': 'ri', '5': 'ri', '%': 'ri',
  '6': 'li', '^': 'li', '7': 'li', '&': 'li', '8': 'lm', '*': 'lm',
  '9': 'lr', '(': 'lr', '0': 'rp', ')': 'rp', '-': 'rp', '_': 'rp',
  '=': 'rp', '+': 'rp',
  q: 'lp', w: 'lr', e: 'lm', r: 'li', t: 'li',
  y: 'ri', u: 'ri', i: 'rm', o: 'rr', p: 'rp',
  '[': 'rp', '{': 'rp', ']': 'rp', '}': 'rp', '\\': 'rp', '|': 'rp',
  a: 'lp', s: 'lr', d: 'lm', f: 'li', g: 'li',
  h: 'ri', j: 'ri', k: 'rm', l: 'rr', ';': 'rp', ':': 'rp',
  "'": 'rp', '"': 'rp',
  z: 'lp', x: 'lr', c: 'lm', v: 'li', b: 'li',
  n: 'ri', m: 'ri', ',': 'rm', '<': 'rm', '.': 'rr', '>': 'rr',
  '/': 'rp', '?': 'rp',
};

const modifiers: KeyDef[] = [
  // Row 0 - Number row
  { label: '`', shiftLabel: '~', row: 0, col: 0, width: 1, finger: 'rp' },
  { label: '1', shiftLabel: '!', row: 0, col: 1, width: 1, finger: 'rp' },
  { label: '2', shiftLabel: '@', row: 0, col: 2, width: 1, finger: 'rr' },
  { label: '3', shiftLabel: '#', row: 0, col: 3, width: 1, finger: 'rm' },
  { label: '4', shiftLabel: '$', row: 0, col: 4, width: 1, finger: 'ri' },
  { label: '5', shiftLabel: '%', row: 0, col: 5, width: 1, finger: 'ri' },
  { label: '6', shiftLabel: '^', row: 0, col: 6, width: 1, finger: 'li' },
  { label: '7', shiftLabel: '&', row: 0, col: 7, width: 1, finger: 'li' },
  { label: '8', shiftLabel: '*', row: 0, col: 8, width: 1, finger: 'lm' },
  { label: '9', shiftLabel: '(', row: 0, col: 9, width: 1, finger: 'lr' },
  { label: '0', shiftLabel: ')', row: 0, col: 10, width: 1, finger: 'rp' },
  { label: '-', shiftLabel: '_', row: 0, col: 11, width: 1, finger: 'rp' },
  { label: '=', shiftLabel: '+', row: 0, col: 12, width: 1, finger: 'rp' },
  // Row 1 - Top row
  { label: 'q', row: 1, col: 0, width: 1, finger: 'lp' },
  { label: 'w', row: 1, col: 1, width: 1, finger: 'lr' },
  { label: 'e', row: 1, col: 2, width: 1, finger: 'lm' },
  { label: 'r', row: 1, col: 3, width: 1, finger: 'li' },
  { label: 't', row: 1, col: 4, width: 1, finger: 'li' },
  { label: 'y', row: 1, col: 5, width: 1, finger: 'ri' },
  { label: 'u', row: 1, col: 6, width: 1, finger: 'ri' },
  { label: 'i', row: 1, col: 7, width: 1, finger: 'rm' },
  { label: 'o', row: 1, col: 8, width: 1, finger: 'rr' },
  { label: 'p', row: 1, col: 9, width: 1, finger: 'rp' },
  { label: '[', shiftLabel: '{', row: 1, col: 10, width: 1, finger: 'rp' },
  { label: ']', shiftLabel: '}', row: 1, col: 11, width: 1, finger: 'rp' },
  { label: '\\', shiftLabel: '|', row: 1, col: 12, width: 1.5, finger: 'rp' },
  // Row 2 - Home row
  { label: 'a', row: 2, col: 0, width: 1, finger: 'lp' },
  { label: 's', row: 2, col: 1, width: 1, finger: 'lr' },
  { label: 'd', row: 2, col: 2, width: 1, finger: 'lm' },
  { label: 'f', row: 2, col: 3, width: 1, finger: 'li' },
  { label: 'g', row: 2, col: 4, width: 1, finger: 'li' },
  { label: 'h', row: 2, col: 5, width: 1, finger: 'ri' },
  { label: 'j', row: 2, col: 6, width: 1, finger: 'ri' },
  { label: 'k', row: 2, col: 7, width: 1, finger: 'rm' },
  { label: 'l', row: 2, col: 8, width: 1, finger: 'rr' },
  { label: ';', shiftLabel: ':', row: 2, col: 9, width: 1, finger: 'rp' },
  { label: "'", shiftLabel: '"', row: 2, col: 10, width: 1, finger: 'rp' },
  // Row 3 - Bottom row
  { label: 'z', row: 3, col: 0, width: 1, finger: 'lp' },
  { label: 'x', row: 3, col: 1, width: 1, finger: 'lr' },
  { label: 'c', row: 3, col: 2, width: 1, finger: 'lm' },
  { label: 'v', row: 3, col: 3, width: 1, finger: 'li' },
  { label: 'b', row: 3, col: 4, width: 1, finger: 'li' },
  { label: 'n', row: 3, col: 5, width: 1, finger: 'ri' },
  { label: 'm', row: 3, col: 6, width: 1, finger: 'ri' },
  { label: ',', shiftLabel: '<', row: 3, col: 7, width: 1, finger: 'rm' },
  { label: '.', shiftLabel: '>', row: 3, col: 8, width: 1, finger: 'rr' },
  { label: '/', shiftLabel: '?', row: 3, col: 9, width: 1, finger: 'rp' },
];

export const KEYBOARD_KEYS: KeyDef[] = modifiers;

export function getKeyByLabel(label: string): KeyDef | undefined {
  return KEYBOARD_KEYS.find(k => k.label === label.toLowerCase() || k.label === label);
}

export function getHomeRowKeys(): string[] {
  return ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'];
}
