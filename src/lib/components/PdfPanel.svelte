

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fly } from 'svelte/transition';

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

  function close() {
    open = false;
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
  }

  onMount(() => {
    window.addEventListener('keydown', onKey);
  });
  onDestroy(() => {
    window.removeEventListener('keydown', onKey);
  });
</script>

{#if showToggle && !open}
  <button
    class="fixed right-0 top-1/3 -translate-y-1/2 z-[10000] w-10 h-20 flex items-center justify-center rounded-l-full shadow-lg text-4xl transition-opacity duration-300 bg-white dark:bg-[#1e1e1e] text-current hover:opacity-90"
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
      class="pdfpanel"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      transition:fly={{ x: 24, duration: 150 }}
    >
      <header class="pdfpanel-header">
        <h2 class="pdfpanel-title">{title}</h2>
        <button type="button" class="pdfpanel-close" aria-label="Schließen" on:click={close}>
          ✕
        </button>
      </header>

      <div class="pdfpanel-body">
        {#if src}
          <iframe class="pdfpanel-frame" src={src} title={title} loading="lazy"></iframe>
        {:else}
          <div class="pdfpanel-empty">Kein Dokument angegeben.</div>
        {/if}
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
  .pdfpanel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.75rem;
    border-bottom: 1px solid var(--border, #e5e7eb);
  }
  .pdfpanel-title {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .pdfpanel-close {
    border: 0;
    background: transparent;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
  }
  .pdfpanel-body {
    flex: 1 1 auto;
    min-height: 0; /* allow iframe to fill */
  }
  .pdfpanel-frame {
    width: 100%;
    height: 100%;
    border: 0;
    display: block;
  }
  .pdfpanel-empty {
    padding: 1rem;
    font-size: 0.9rem;
    opacity: 0.7;
  }

  @media (min-width: 640px) {
    .pdfpanel { width: 720px; }
  }
</style>
