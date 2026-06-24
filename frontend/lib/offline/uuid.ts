export function generateUUIDv7(): string {
  const timestamp = Date.now();
  const hexTimestamp = timestamp.toString(16).padStart(12, '0');

  const randomBytes = new Uint8Array(10);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(randomBytes);
  } else {
    for (let i = 0; i < 10; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }

  const part1 = hexTimestamp.slice(0, 8);
  const part2 = hexTimestamp.slice(8, 12);

  const ver = 0x7000 | ((randomBytes[0] << 8 | randomBytes[1]) & 0x0fff);
  const part3 = ver.toString(16).padStart(4, '0');

  const varPart = 0x8000 | ((randomBytes[2] << 8 | randomBytes[3]) & 0x3fff);
  const part4 = varPart.toString(16).padStart(4, '0');

  let part5 = '';
  for (let i = 4; i < 10; i++) {
    part5 += randomBytes[i].toString(16).padStart(2, '0');
  }

  return `${part1}-${part2}-${part3}-${part4}-${part5}`;
}
