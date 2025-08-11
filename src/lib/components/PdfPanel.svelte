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
  let pagesContainer: HTMLDivElement | null = null;
  let isRendering = false;
  let cancelRender = false;
  let fitToWidth = true; // render each page to fit container width
  let resizeTimeout: number | null = null;

  // Zoom state
  let userScale = 1;            // persistent zoom (multiplies fit-to-width)
  let liveScale = 1;            // transient scale used during pinch gesture
  let isPinching = false;       // whether we are in an active pinch
  const MIN_SCALE = 0.5;
  const MAX_SCALE = 3;

  function clamp(n: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, n));
  }

  async function renderPdf() {
    if (!browser || !pdfReady || !open || !src || !renderContainer) return;
    if (isRendering) return;
    isRendering = true;
    cancelRender = false;

    // clear previous content
    if (pagesContainer) pagesContainer.innerHTML = '';

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
        const baseScale = fitToWidth && containerWidth
          ? containerWidth / baseViewport.width
          : 1;
        const scale = baseScale * userScale;
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
        pagesContainer?.appendChild(canvas);
      }
      if (renderContainer) {
        renderContainer.style.removeProperty('--zoom');
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

  // Trackpad pinch (Ctrl+wheel) zoom
  function onWheel(e: WheelEvent) {
    if (!open) return;
    if (e.ctrlKey) {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.0015); // smooth zoom
      userScale = clamp(userScale * factor, MIN_SCALE, MAX_SCALE);
      cancelRender = true;
      if (resizeTimeout) window.clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        cancelRender = false;
        renderPdf();
      }, 120);
    }
  }

  // Touch pinch zoom via Pointer Events
  const pointers = new Map<number, {x:number, y:number}>();
  let pinchStartDist = 0;
  let pinchStartScale = 1;

  function dist(a:{x:number,y:number}, b:{x:number,y:number}) {
    const dx = a.x - b.x; const dy = a.y - b.y; return Math.hypot(dx, dy);
  }

  function onPointerDown(e: PointerEvent) {
    if (!open) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [p1, p2] = [...pointers.values()];
      pinchStartDist = dist(p1, p2);
      pinchStartScale = userScale;
      isPinching = true;
    }
  }

  function onPointerMove(e: PointerEvent) {
    if (!open) return;
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (isPinching && pointers.size === 2 && renderContainer) {
      const [p1, p2] = [...pointers.values()];
      const d = dist(p1, p2);
      const factor = d / Math.max(1, pinchStartDist);
      liveScale = clamp(pinchStartScale * factor, MIN_SCALE, MAX_SCALE);
      // live visual feedback via CSS transform; re-render on end
      renderContainer.style.setProperty('--zoom', String(liveScale));
    }
  }

  function onPointerUpOrCancel(e: PointerEvent) {
    if (!open) return;
    pointers.delete(e.pointerId);
    if (isPinching && pointers.size < 2) {
      isPinching = false;
      if (liveScale !== userScale) {
        userScale = liveScale;
        cancelRender = false;
        renderPdf();
      } else if (renderContainer) {
        renderContainer.style.removeProperty('--zoom');
      }
    }
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
        <button
          type="button"
          class="pdfpanel-close absolute top-3 right-3 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
          on:click={close}
          aria-label="Schließen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div
          class={`pdfjs-container ${$isDarkMode ? 'bg-[#1e1e1e]' : 'bg-white'}`}
          bind:this={renderContainer}
          on:wheel|nonpassive={onWheel}
          on:pointerdown={onPointerDown}
          on:pointermove={onPointerMove}
          on:pointerup={onPointerUpOrCancel}
          on:pointercancel={onPointerUpOrCancel}
          style={`--zoom: ${isPinching ? liveScale : 1}`}
        >
          <div class="pdfpages" bind:this={pagesContainer}></div>
        </div>
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
    max-width: 960px;
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
    touch-action: pan-x pan-y;
  }
  .pdfpages {
    transform: scale(var(--zoom, 1));
    transform-origin: 0 0;
    will-change: transform;
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
  @media (min-width: 1024px) {
    .pdfpanel { width: 960px; }
  }

  .pdfpanel-close {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    z-index: 10;
  }
</style>
