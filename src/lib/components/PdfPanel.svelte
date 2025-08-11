<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fly } from 'svelte/transition';
  import { isDarkMode } from '$lib/stores/theme';
  import { browser } from '$app/environment';

  // Panel state
  let open = false;
  export let src = '';
  export let title = 'Dokument';
  export let showToggle = true;

  // Image/manifest state
  type PageMeta = { url: string; width?: number; height?: number };
  let pages: PageMeta[] = [];
  let errorMsg = '';
  let loading = false;

  // Zoom state (kept from previous implementation)
  let renderContainer: HTMLDivElement | null = null;
  let pagesContainer: HTMLDivElement | null = null;
  let resizeTimeout: number | null = null;
  let isPinching = false;
  let userScale = 1;
  let liveScale = 1;
  const MIN_SCALE = 0.5;
  const MAX_SCALE = 3;

  function clamp(n: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, n));
  }

  // Zoom keeping the cursor (cx, cy) stationary in the viewport
  function setScaleAtPoint(newScale: number, cx: number, cy: number) {
    if (!renderContainer) return;
    const oldScale = parseFloat(getComputedStyle(renderContainer).getPropertyValue('--zoom')) || 1;
    const clamped = clamp(newScale, MIN_SCALE, MAX_SCALE);
    if (clamped === oldScale) return;

    const scrollLeft = renderContainer.scrollLeft;
    const scrollTop = renderContainer.scrollTop;

    // Content coords under the cursor before scaling
    const targetX = (scrollLeft + cx) / oldScale;
    const targetY = (scrollTop + cy) / oldScale;

    // Apply scale and adjust scroll to keep the same content under the cursor
    renderContainer.style.setProperty('--zoom', String(clamped));
    renderContainer.scrollLeft = targetX * clamped - cx;
    renderContainer.scrollTop = targetY * clamped - cy;
  }

  // Sync global dark mode class on <html>
  $: if (browser) document.documentElement.classList.toggle('dark', $isDarkMode);

  /** Build manifest path from the provided PDF `src`.
   *  Example: "/Hilfsmittel_12062024-2.pdf" -> "/pdf-images/Hilfsmittel_12062024-2/manifest.json"
   */
  function manifestUrlFromPdf(pdfPath: string) {
    const file = pdfPath.split('/').pop() || 'document.pdf';
    const stem = file.replace(/\.pdf$/i, '');
    return `/pdf-images/${stem}/manifest.json`;
  }

  async function loadManifest() {
    pages = [];
    errorMsg = '';
    if (!browser || !open || !src) return;
    loading = true;
    try {
      const res = await fetch(manifestUrlFromPdf(src), { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Expected shape: { pages: [{ url, width?, height? }, ...] }
      if (!data || !Array.isArray(data.pages)) throw new Error('Ungültiges Manifest');
      pages = data.pages;
    } catch (e: any) {
      console.error('Manifest laden fehlgeschlagen', e);
      errorMsg = 'Bilder konnten nicht geladen werden.';
    } finally {
      loading = false;
      if (renderContainer) renderContainer.style.removeProperty('--zoom');
    }
  }

  // Re-load when panel opens or src changes
  $: open, src, (async () => {
    if (browser && open && src) {
      await Promise.resolve();
      await loadManifest();
    }
  })();

  function close() { open = false; }
  function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close(); }

  function onResize() {
    if (!open) return;
    // Keep current zoom; nothing else to do here for image-based viewer.
  }

  // Trackpad pinch (Ctrl+wheel) zoom
  function onWheel(e: WheelEvent) {
    if (!open) return;
    if (e.ctrlKey) {
      e.preventDefault();
      if (!renderContainer) return;
      const rect = renderContainer.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      const factor = Math.exp(-e.deltaY * 0.0015);
      const next = clamp(userScale * factor, MIN_SCALE, MAX_SCALE);
      setScaleAtPoint(next, cx, cy);
      userScale = next;
      liveScale = next;
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
      const next = clamp(pinchStartScale * factor, MIN_SCALE, MAX_SCALE);

      const rect = renderContainer.getBoundingClientRect();
      const cx = (p1.x + p2.x) / 2 - rect.left; // midpoint in container coords
      const cy = (p1.y + p2.y) / 2 - rect.top;

      setScaleAtPoint(next, cx, cy);
      liveScale = next;
    }
  }
  function onPointerUpOrCancel(e: PointerEvent) {
    if (!open) return;
    pointers.delete(e.pointerId);
    if (isPinching && pointers.size < 2) {
      isPinching = false;
      if (liveScale !== userScale) {
        userScale = liveScale;
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
  });
</script>

{#if showToggle && !open}
  <button
    class={`fixed right-0 top-1/3 -translate-y-1/2 z-[10000]
         w-10 h-20 rounded-l-full shadow-lg
         flex items-center justify-center text-4xl cursor-pointer
         transition-opacity duration-300 motion-reduce:transition-none
         ${$isDarkMode
           ? 'bg-[#1e1e1e] text-gray-200 hover:bg-[#2a2a2a]'
           : 'bg-white text-gray-700 hover:bg-gray-50'}
         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500`}
    on:click={() => (open = true)}
    aria-label="Bilder öffnen"
  >
    ‹
  </button>
{/if}

{#if open}
  <div class="pdfpanel-overlay" aria-hidden="true">
    <button type="button" class="pdfpanel-backdrop" aria-label="Schließen" on:click={close}></button>

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
          class="pdfpanel-close absolute top-3 right-3 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none cursor-pointer"
          on:click={close}
          aria-label="Schließen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="#374151" stroke-width="2">
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
        >
          <div class="pages" bind:this={pagesContainer}>
            {#if loading}
              <div class="pdfpanel-empty">Lade Bilder…</div>
            {:else if errorMsg}
              <div class="pdfpanel-empty">{errorMsg}</div>
            {:else if pages.length === 0}
              <div class="pdfpanel-empty">Keine Seiten gefunden.</div>
            {:else}
              {#each pages as p, i}
                <img class="page-img" src={p.url} alt={`Seite ${i+1}`} loading="lazy" decoding="async" />
              {/each}
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .pdfpanel-overlay { position: fixed; inset: 0; z-index: 9999; }
  .pdfpanel-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.5); border: 0; padding: 0; margin: 0; }
  .pdfpanel { position: absolute; right: 0; top: 0; height: 100%; width: 100%; max-width: 960px; display: flex; flex-direction: column; background: var(--color-bg, #fff); border-left: 1px solid var(--border, #e5e7eb); box-shadow: 0 10px 25px rgba(0,0,0,0.15); }
  .pdfpanel-body { flex: 1 1 auto; min-height: 0; }
  :global(.pdfpanel-empty) { padding: 1rem; font-size: 0.9rem; opacity: 0.7; }

  .pdfjs-container { position: relative; width: 100%; height: 100%; overflow: auto; background: var(--color-bg, #fff); touch-action: pan-x pan-y; overscroll-behavior: contain; }
  .pages { transform: scale(var(--zoom, 1)); transform-origin: 0 0; will-change: transform; }
  .page-img { display: block; width: 100%; height: auto; margin: 0 auto 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); background: #fff; }

  @media (min-width: 640px) { .pdfpanel { width: 720px; } }
  @media (min-width: 1024px) { .pdfpanel { width: 960px; } }

  .pdfpanel-close { position: absolute; top: 0.5rem; right: 0.5rem; z-index: 10; }
  .pdfpanel-close svg, .pdfpanel-close svg path { cursor: pointer; }
</style>
