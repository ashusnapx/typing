export function blastConfetti() {
  if (typeof document === 'undefined') return;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const ctx = canvas.getContext('2d')!;
  const colors = ['#2F5BFF', '#4ec5df', '#4caf50', '#ff9800', '#e53935'];
  const pieces: { x: number; y: number; vx: number; vy: number; size: number; color: string }[] = [];

  for (let i = 0; i < 120; i++) {
    pieces.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * -1,
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * 3 + 1,
      size: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }

  const start = performance.now();
  let running = true;

  const frame = () => {
    if (!running) return;
    const elapsed = performance.now() - start;
    if (elapsed > 4000) {
      canvas.remove();
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of pieces) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12;
      const alpha = Math.max(0, 1 - elapsed / 4000);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size * 0.6);
    }
    requestAnimationFrame(frame);
  };

  frame();
  setTimeout(() => { running = false; canvas.remove(); }, 4200);
}
