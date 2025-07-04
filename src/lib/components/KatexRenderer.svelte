<script lang="ts">
  import katex from 'katex';
  import 'katex/dist/katex.min.css';

  export let latexString: string;

  function escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderMath(input: string): string {
    if (!input) return '';
    // Regex to split by math delimiters: $$...$$ or $...$
    const regex = /(\$\$[^$]+\$\$|\$[^$]+\$)/g;
    const parts = input.split(regex).filter(Boolean);

    return parts.map(part => {
      if (/^\$\$.*\$\$$/.test(part)) {
        const content = part.slice(2, -2);
        try {
          return katex.renderToString(content, { throwOnError: false, displayMode: true });
        } catch {
          return escapeHtml(part);
        }
      } else if (/^\$.*\$$/.test(part)) {
        const content = part.slice(1, -1);
        try {
          return katex.renderToString(content, { throwOnError: false, displayMode: false });
        } catch {
          return escapeHtml(part);
        }
      } else {
        return escapeHtml(part);
      }
    }).join('');
  }
</script>

<span>{@html renderMath(latexString)}</span>
