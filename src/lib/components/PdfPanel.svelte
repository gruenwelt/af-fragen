<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fly } from 'svelte/transition';
  import { isDarkMode } from '$lib/stores/theme';

  // PDF.js dynamic import (browser-only) to avoid SSR DOM errors
  import { browser } from '$app/environment';
  let _getDocument: any = null;
  let _GlobalWorkerOptions: any = null;
  let pdfReady = false;

  if (browser) {
    (async () => {
      const lib = await import('pdfjs-dist');
      const worker = await import('pdfjs-dist/build/pdf.worker.mjs?url');
      _getDocument = lib.getDocument;
      _GlobalWorkerOptions = lib.GlobalWorkerOptions;
      _GlobalWorkerOptions.workerSrc = (worker as any).default;
      pdfReady = true;
    })();
  }

  // Sync global dark mode class on <html>
  $: if (browser) document.documentElement.classList.toggle('dark', $isDarkMode);

  /**
   * PdfPanel — a right-side drawer that matches the sidebar-style layout.
   * Props:
   *  - src   (string)   : PDF url (e.g. "/Hilfsmittel_12062024-2.pdf")
   *  - title (string)   : header title
   *  - showToggle (boolean): whether to render the edge toggle when closed
   */
  let open = false;
  export let src = '';
  export let title = 'Dokument';
  export let showToggle = true;

  // State for PDF.js rendering
  let renderContainer: HTMLDivElement | null = null;
  let isRendering = false;
  let cancelRender = false;
  let fitToWidth = true; // render each page to fit container width
  let resizeTimeout: number | null = null;

  async function renderPdf() {
    if (!browser || !pdfReady || !open || !src || !renderContainer) return;
    if (isRendering) return;
    isRendering = true;
    cancelRender = false;

    // clear previous content
    renderContainer.innerHTML = '';

    try {
      const task = _getDocument(src);
      const pdf = await task.promise;

      // Measure container width in CSS pixels
      const containerWidth = renderContainer.clientWidth || 0;
      const outputScale = window.devicePixelRatio || 1;

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        if (cancelRender) break;
        const page = await pdf.getPage(pageNum);

        // Base viewport at scale 1 to get intrinsic page size
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = fitToWidth && containerWidth
          ? containerWidth / baseViewport.width
          : 1;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) continue;

        // Internal bitmap size for sharp rendering on HiDPI screens
        canvas.width = Math.ceil(viewport.width * outputScale);
        canvas.height = Math.ceil(viewport.height * outputScale);

        // Display size in CSS pixels
        canvas.style.width = Math.ceil(viewport.width) + 'px';
        canvas.style.height = Math.ceil(viewport.height) + 'px';

        // Scale drawing operations to match the higher pixel density
        ctx.setTransform(outputScale, 0, 0, outputScale, 0, 0);

        const renderTask = page.render({ canvasContext: ctx, viewport, canvas });
        await renderTask.promise;
        if (cancelRender) break;
        renderContainer.appendChild(canvas);
      }
    } catch (e) {
      console.error('PDF render error', e);
      if (renderContainer) {
        const div = document.createElement('div');
        div.className = 'pdfpanel-empty';
        div.textContent = 'PDF konnte nicht geladen werden.';
        renderContainer.appendChild(div);
      }
    } finally {
      isRendering = false;
    }
  }

  // Re-render whenever the panel opens or the source changes
  $: open, src, (async () => {
    if (browser && pdfReady && open && src) {
      // slight delay to let drawer animate in
      await Promise.resolve();
      cancelRender = false;
      renderPdf();
    } else {
      cancelRender = true;
    }
  })();

  function close() {
    open = false;
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
  }

  function onResize() {
    if (!open) return;
    cancelRender = true;
    if (resizeTimeout) window.clearTimeout(resizeTimeout);
    resizeTimeout = window.setTimeout(() => {
      if (!renderContainer) return;
      cancelRender = false;
      renderPdf();
    }, 150);
  }

  onMount(() => {
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
  });
  onDestroy(() => {
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', onResize);
    cancelRender = true;
  });
</script>

{#if showToggle && !open}
  <button
    class={`fixed right-0 top-1/3 -translate-y-1/2 z-[10000]
         w-10 h-20 rounded-l-full shadow-lg
         flex items-center justify-center text-4xl
         transition-opacity duration-300 motion-reduce:transition-none
         ${$isDarkMode
           ? 'bg-[#1e1e1e] text-gray-200 hover:bg-[#2a2a2a]'
           : 'bg-white text-gray-700 hover:bg-gray-50'}
         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500`}
    on:click={() => (open = true)}
    aria-label="PDF öffnen"
  >
    ‹
  </button>
{/if}

{#if open}
  <div class="pdfpanel-overlay" aria-hidden="true">
    <!-- Backdrop -->
    <button type="button" class="pdfpanel-backdrop" aria-label="Schließen" on:click={close}></button>

    <!-- Drawer (right) -->
    <div
      class={`pdfpanel ${
        $isDarkMode
          ? 'bg-[#1e1e1e] border-l border-gray-600 text-gray-200'
          : 'bg-white border-l border-gray-200 text-gray-700'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      transition:fly={{ x: 24, duration: 150 }}
    >

      <div class="pdfpanel-body text-inherit">
        <div class={`pdfjs-container ${$isDarkMode ? 'bg-[#1e1e1e]' : 'bg-white'}`} bind:this={renderContainer}></div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Overlay/backdrop mirrors sidebar layering; use very high z-index to sit above route UI */
  .pdfpanel-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
  }
  .pdfpanel-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.5);
    border: 0;
    padding: 0;
    margin: 0;
  }
  .pdfpanel {
    position: absolute;
    right: 0;
    top: 0;
    height: 100%;
    width: 100%;
    max-width: 720px;
    display: flex;
    flex-direction: column;
    background: var(--color-bg, #fff);
    border-left: 1px solid var(--border, #e5e7eb);
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
  }
  .pdfpanel-body {
    flex: 1 1 auto;
    min-height: 0; /* allow iframe to fill */
  }
  /* Removed .pdfpanel-frame as iframes are no longer used */
  :global(.pdfpanel-empty) {
    padding: 1rem;
    font-size: 0.9rem;
    opacity: 0.7;
  }

  .pdfjs-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: auto;
    background: var(--color-bg, #fff);
  }
  :global(.pdfjs-container canvas) {
    display: block;
    width: 100%;
    height: auto;
    margin: 0 auto 1rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    background: #fff;
  }

  @media (min-width: 640px) {
    .pdfpanel { width: 720px; }
  }
</style>
