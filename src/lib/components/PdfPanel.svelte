<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { isDarkMode } from '$lib/stores/theme';
  import { browser } from '$app/environment';
import { onDestroy, onMount } from 'svelte';

  const dispatch = createEventDispatcher();

  export let showToggle: boolean = true;
  export let open: boolean = false;
  export let title: string = 'Dokument';

const manifest: string = '/pdf-images/Hilfsmittel_12062024-2/manifest.json';


  // —— Manifest: single consolidated state & helpers ——
  type PagesManifest = { pages?: string[] };
  let mImages: string[] = [];
  let mLoading = false;
  let mError = '';

  $: panelTone = $isDarkMode
    ? 'bg-[#1e1e1e] border-l border-gray-600 text-gray-200'
    : 'bg-white border-l border-gray-200 text-gray-700';

  // —— Manifest fetcher ——
  async function fetchManifest(path: string) {
    if (!path) return;
    mLoading = true;
    mError = '';
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PagesManifest = await res.json();
      const pages = Array.isArray(data?.pages) ? data.pages : [];
      mImages = (pages as (string | undefined)[]).filter(Boolean) as string[];
      if (!mImages.length) throw new Error('Ungültiges Manifest');
    } catch (e: any) {
      mImages = [];
      mError = e?.message || 'Manifest konnte nicht geladen werden';
    } finally {
      mLoading = false;
    }
  }


  onMount(() => {
    void fetchManifest(manifest);
    window.addEventListener('keydown', onKey);
  });

  function close() {
    open = false;
    dispatch('close');
  }

  function onKey(e: KeyboardEvent) {
    if (!open) return;
    if (e.key === 'Escape') close();
  }

  onDestroy(() => {
    window.removeEventListener('keydown', onKey);
  });
</script>

{#if open}
  <div class="pdfpanel-overlay" aria-hidden="true">
    <button type="button" class="pdfpanel-backdrop" aria-label="Schließen" on:click={close}></button>

    <div
      class={`pdfpanel ${panelTone}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
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

      <div class="pdfpanel-body">
        {#if mLoading}
          <div class="pdfpanel-empty">Lade Seiten…</div>
        {:else if mError}
          <div class="pdfpanel-empty">{mError}</div>
        {:else if mImages && mImages.length}
          {#each mImages as imgSrc, i}
            <img
              class="panel-image"
              src={imgSrc}
              alt={`Seite ${i + 1}`}
              loading="lazy"
              decoding="async"
            />
          {/each}
        {:else}
          <div class="pdfpanel-empty">Keine Bilder gefunden.</div>
        {/if}
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
    aria-label="PDF öffnen"
  >
    ‹
  </button>
{/if}

<style>
  .pdfpanel-overlay { position: fixed; inset: 0; z-index: 9999; }
  .pdfpanel-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.5); border: 0; padding: 0; margin: 0; }
  .pdfpanel { position: absolute; right: 0; top: 0; height: 100%; width: 100%; max-width: 960px; display: flex; flex-direction: column; }
  .pdfpanel-body { flex: 1 1 auto; min-height: 0; overflow: auto; overscroll-behavior: contain; display: flex; flex-direction: column; }

  .panel-image { display: block; width: 100%; height: auto; margin: 0 0 1rem 0; }
  img.panel-image { max-width: 100%; height: auto; -webkit-user-drag: none; user-select: none; }

  :global(.pdfpanel-empty) { padding: 1rem; font-size: 0.9rem; opacity: 0.7; }

  @media (min-width: 640px) { .pdfpanel { width: 720px; } }
  @media (min-width: 1024px) { .pdfpanel { width: 960px; } }
</style>