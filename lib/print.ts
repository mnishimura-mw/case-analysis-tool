/**
 * Print a specific element by cloning it into a temporary container.
 * Uses window.print() — the browser's "Save as PDF" option produces a PDF.
 */
export function printElement(el: HTMLElement, title: string) {
  const printStyle = document.createElement("style");
  printStyle.id = "__print_style";
  printStyle.textContent = `
    @media print {
      body > *:not(#__print_container) { display: none !important; }
      #__print_container {
        position: static !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .no-print { display: none !important; }
      @page { margin: 12mm; size: A4; }
    }
  `;

  const container = document.createElement("div");
  container.id = "__print_container";
  container.innerHTML = el.outerHTML;

  // Remove no-print elements from clone
  container.querySelectorAll(".no-print").forEach((n) => n.remove());

  const origTitle = document.title;
  document.head.appendChild(printStyle);
  document.body.appendChild(container);
  document.title = title;

  window.print();

  document.head.removeChild(printStyle);
  document.body.removeChild(container);
  document.title = origTitle;
}
