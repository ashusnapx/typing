export class DomRenderer {
  private container: HTMLDivElement | null = null;
  private caret: HTMLSpanElement | null = null;

  constructor(container: HTMLDivElement | null, caret: HTMLSpanElement | null) {
    this.container = container;
    this.caret = caret;
  }

  setElements(container: HTMLDivElement | null, caret: HTMLSpanElement | null) {
    this.container = container;
    this.caret = caret;
  }

  updateChar(index: number, state: 'correct' | 'incorrect' | 'untyped') {
    if (!this.container) return;
    const charNode = this.container.querySelector(`[data-index="${index}"]`) as HTMLElement;
    if (!charNode) return;

    if (state === 'correct') {
      charNode.className = 'text-pencil';
    } else if (state === 'incorrect') {
      charNode.className = 'text-accent bg-red-100 rounded';
    } else {
      charNode.className = 'text-pencil/30';
    }
  }

  updateCaret(index: number) {
    if (!this.container || !this.caret) return;
    const charNode = this.container.querySelector(`[data-index="${index}"]`) as HTMLElement;
    if (!charNode) return;

    // Direct layout offsets to avoid reflow triggers where possible
    const left = charNode.offsetLeft;
    const top = charNode.offsetTop;

    this.caret.style.transform = `translate(${left}px, ${top}px)`;
    
    // Auto-scroll when caret exceeds viewport limits
    const charRect = charNode.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();
    const relativeTop = charRect.top - containerRect.top;

    if (relativeTop < 10 || relativeTop > this.container.clientHeight - 60) {
      charNode.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }
}
