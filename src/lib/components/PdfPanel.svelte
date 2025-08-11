<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { isDarkMode } from '$lib/stores/theme';
  import { onMount, onDestroy } from 'svelte';
  import { fly } from 'svelte/transition';
  import { browser } from '$app/environment';

  const dispatch = createEventDispatcher();
  export let showToggle: boolean = true;
  export let open: boolean = false;

  // Panel state
  export let src = '';
  export let title = 'Dokument';

  // Image/manifest state
  type PageMeta = { url: string; width?: number; height?: number };
  let pages: PageMeta[] = [];
  let errorMsg = '';
  let loading = false;

  // Pan & Zoom state (mobile-first)
  let viewport: HTMLDivElement | null = null; // scroll container
  let content: HTMLDivElement | null = null;  // .pages wrapper to transform
  let scale = 1;
  let tx = 0; // translateX in px
  let ty = 0; // translateY in px
  const MIN_SCALE = 1;
  const MAX_SCALE = 4;

  // measurements
  let cw = 0, ch = 0; // container size
  let bw = 0, bh = 0; // base (unscaled) content size

  function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }

  // Helpers to apply transform & clamp panning so content stays in view
  function applyTransform() {
    if (!content) return;
    content.style.setProperty('--scale', String(scale));
    content.style.setProperty('--tx', tx + 'px');
    content.style.setProperty('--ty', ty + 'px');
  }
  function measure() {
    if (!viewport || !content) return;
    cw = viewport.clientWidth;
    ch = viewport.clientHeight;
    // Use offsetWidth for width and scrollHeight for full stacked height
    bw = content.offsetWidth || cw;
    bh = content.scrollHeight || content.offsetHeight || ch;
    clampPan();
  }
  function clampPan() {
    if (!viewport || !content) return;
    const sw = bw * scale;
    const sh = bh * scale;
    const minTx = Math.min(0, cw - sw);
    const minTy = Math.min(0, ch - sh);
    const maxTx = 0;
    const maxTy = 0;
    tx = clamp(tx, minTx, maxTx);
    ty = clamp(ty, minTy, maxTy);
    applyTransform();
  }

  // Zoom around a point in container coordinates (px)
  function zoomAt(nextScale: number, px: number, py: number) {
    if (!viewport) return;
    const s = scale;
    const ns = clamp(nextScale, MIN_SCALE, MAX_SCALE);
    if (ns === s) return;
    // Keep point (px, py) stationary: t' = p - (p - t)*(ns/s)
    const k = ns / s;
    tx = px - (px - tx) * k;
    ty = py - (py - ty) * k;
    scale = ns;
    clampPan();
  }

  // Gesture handling (Pointer Events)
  const pointers = new Map<number, { x: number; y: number }>();
  let lastDrag: { x: number; y: number } | null = null;

  function onPointerDown(e: PointerEvent) {
    if (!open || !viewport) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1 && scale > 1) {
      lastDrag = { x: e.clientX, y: e.clientY };
    }
  }

  function onPointerMove(e: PointerEvent) {
    if (!open) return;
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 2 && viewport) {
      // Pinch zoom using two pointers
      const [p1, p2] = [...pointers.values()];
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const rect = viewport.getBoundingClientRect();
      const cx = midX - rect.left;
      const cy = midY - rect.top;

      // Distance-based scaling factor (relative to last frame)
      // Compute previous and current distances; use a small time/pos cache
      // We'll derive factor from current vs previous pointer map
      if ((onPointerMove as any)._prevDist) {
        const prev = (onPointerMove as any)._prevDist as number;
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.hypot(dx, dy) || 1;
        const factor = dist / prev;
        const next = clamp(scale * factor, MIN_SCALE, MAX_SCALE);
        zoomAt(next, cx, cy);
        (onPointerMove as any)._prevDist = dist;
      } else {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        (onPointerMove as any)._prevDist = Math.hypot(dx, dy) || 1;
      }
      // Disable drag tracking while pinching
      lastDrag = null;
      e.preventDefault();
      return;
    }

    // One-finger pan when zoomed in
    if (pointers.size === 1 && lastDrag && scale > 1) {
      const cur = { x: e.clientX, y: e.clientY };
      const dx = cur.x - lastDrag.x;
      const dy = cur.y - lastDrag.y;
      lastDrag = cur;
      tx += dx;
      ty += dy;
      clampPan();
      e.preventDefault();
    }
  }

  function onPointerUpOrCancel(e: PointerEvent) {
    if (!open) return;
    pointers.delete(e.pointerId);
    if (pointers.size < 2) {
      (onPointerMove as any)._prevDist = 0;
    }
    if (pointers.size === 0) {
      lastDrag = null;
    }
  }

  // Mouse: Ctrl+wheel zoom (desktop)
  function onWheel(e: WheelEvent) {
    if (!open || !viewport) return;
    if (e.ctrlKey) {
      e.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const factor = Math.exp(-e.deltaY * 0.0015);
      zoomAt(scale * factor, cx, cy);
    } else if (scale > 1) {
      // smooth pan with wheel when zoomed
      ty += -e.deltaY;
      tx += -e.deltaX;
      clampPan();
      e.preventDefault();
    }
  }

  // Double-tap to zoom on touch
  let lastTap = 0;
  function onClickOrTap(e: MouseEvent) {
    if (!open || !viewport) return;
    const now = Date.now();
    if (now - lastTap < 300) {
      const rect = viewport.getBoundingClientRect();
      const cx = (e as any).clientX ? (e as any).clientX - rect.left : rect.width / 2;
      const cy = (e as any).clientY ? (e as any).clientY - rect.top : rect.height / 2;
      const target = scale < 1.5 ? 2 : 1; // toggle
      zoomAt(target, cx, cy);
      lastTap = 0;
      e.preventDefault();
    } else {
      lastTap = now;
    }
  }

  function onKeyActivate(e: KeyboardEvent) {
    if (!open || !viewport) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const target = scale < 1.5 ? 2 : 1;
      zoomAt(target, cx, cy);
    }
  }

  // Sync global dark mode class on <html>
  $: if (browser) document.documentElement.classList.toggle('dark', $isDarkMode);

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
      if (!data || !Array.isArray(data.pages)) throw new Error('Ungültiges Manifest');
      pages = data.pages;
    } catch (e: any) {
      console.error('Manifest laden fehlgeschlagen', e);
      errorMsg = 'Bilder konnten nicht geladen werden.';
    } finally {
      loading = false;
      // reset transform when loading a new document
      scale = 1; tx = 0; ty = 0; applyTransform();
      // defer measure so images can layout
      requestAnimationFrame(() => measure());
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
  function onResize() { if (!open) return; measure(); }

  let ro: ResizeObserver | null = null;
  onMount(() => {
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    if (content) {
      ro = new ResizeObserver(() => measure());
      ro.observe(content);
    }
    applyTransform();
  });
  onDestroy(() => {
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', onResize);
    if (ro && content) ro.disconnect();
  });
</script>

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
          bind:this={viewport}
          on:wheel|nonpassive={onWheel}
          on:pointerdown={onPointerDown}
          on:pointermove={onPointerMove}
          on:pointerup={onPointerUpOrCancel}
          on:pointercancel={onPointerUpOrCancel}
          on:click|preventDefault|stopPropagation={onClickOrTap}
          role="button"
          tabindex="0"
          aria-label="Dokument zoomen (Doppeltippen oder Eingabe/Leertaste)"
          on:keydown={onKeyActivate}
        >
          <div class="pages" bind:this={content}>
            {#if loading}
              <div class="pdfpanel-empty">Lade Bilder…</div>
            {:else if errorMsg}
              <div class="pdfpanel-empty">{errorMsg}</div>
            {:else if pages.length === 0}
              <div class="pdfpanel-empty">Keine Seiten gefunden.</div>
            {:else}
              {#each pages as p, i}
                <img class="page-img" src={p.url} alt={`Seite ${i+1}`} loading="lazy" decoding="async" on:load={measure} />
              {/each}
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

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
    on:click={() => { open = true; dispatch('toggle'); }}
    aria-label="Bilder öffnen"
  >
    ‹
  </button>
{/if}

<style>
  .pdfpanel-overlay { position: fixed; inset: 0; z-index: 9999; }
  .pdfpanel-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.5); border: 0; padding: 0; margin: 0; }
  .pdfpanel { position: absolute; right: 0; top: 0; height: 100%; width: 100%; max-width: 960px; display: flex; flex-direction: column; background: var(--color-bg, #fff); border-left: 1px solid var(--border, #e5e7eb); box-shadow: 0 10px 25px rgba(0,0,0,0.15); }
  .pdfpanel-body { flex: 1 1 auto; min-height: 0; }
  :global(.pdfpanel-empty) { padding: 1rem; font-size: 0.9rem; opacity: 0.7; }

  /* New pan+zoom viewport: we handle all gestures ourselves */
  .pdfjs-container {
    position: relative; width: 100%; height: 100%; overflow: hidden;
    background: var(--color-bg, #fff);
    /* Prevent browser native scroll/zoom from fighting ours */
    touch-action: none;
    overscroll-behavior: contain;
  }
  .pages {
    transform: translate3d(var(--tx, 0px), var(--ty, 0px), 0) scale(var(--scale, 1));
    transform-origin: 0 0; will-change: transform;
  }
  .page-img { display: block; width: 100%; height: auto; margin: 0 auto 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); background: #fff; }

  @media (min-width: 640px) { .pdfpanel { width: 720px; } }
  @media (min-width: 1024px) { .pdfpanel { width: 960px; } }

  .pdfpanel-close { position: absolute; top: 0.5rem; right: 0.5rem; z-index: 10; }
  .pdfpanel-close svg, .pdfpanel-close svg path { cursor: pointer; }
</style>