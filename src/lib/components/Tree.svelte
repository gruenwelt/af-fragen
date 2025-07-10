<script lang="ts">
  import type { SvelteComponentTyped } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  type TreeProps = { nodes?: any[]; level?: number; selectedId?: string | null };
  let TreeComponent: (new (...args: any) => SvelteComponentTyped<TreeProps>) | null = null;
  $: if (!TreeComponent) {
    import('./Tree.svelte').then((mod) => {
      TreeComponent = mod.default;
    });
  }

  // Props
  export let nodes: any[] = [];
  export let level = 1;
  export let selectedId: string | null = null;

  // Event dispatcher to notify parent of section clicks
  const dispatch = createEventDispatcher();

  // State to manage collapsed top-level sections
  let collapsedSections = new Set();

  // Helper to toggle top-level section collapse
  function toggleCollapse(title: string) {
    collapsedSections = new Set(
      collapsedSections.has(title)
        ? [...collapsedSections].filter((t) => t !== title)
        : [...collapsedSections, title]
    );
  }

  // Set indentation and font styling based on tree depth level
  $: levelClass = level === 1
    ? ''
    : level === 2
    ? 'ml-4 text-sm'
    : 'ml-6 text-xs';
</script>

<!-- Tree List -->
<ul class="list-none pl-0 font-mono">
  {#each nodes as node}
    <li
      class={`mt-4 break-words ${levelClass}`}
    >
      {#if level === 3}
        <!-- Clickable leaf section (Level 3) -->
        <button
          type="button"
          class={`text-left w-full cursor-pointer hover:text-[color:var(--color-theme-1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-theme-1)] ${
            selectedId === node.id ? 'text-[color:var(--color-theme-1)]' : ''
          }`}
          on:click={() => {
            selectedId = node.id;
            dispatch('sectionclick', node);
          }}
        >
          <span>-</span> <span>{node.title}</span>
        </button>
      {:else if level === 1}
        <!-- Top-level collapsible section (Level 1) -->
        <button
          type="button"
          class="flex items-center gap-1 text-left w-full cursor-pointer focus:outline-none"
          on:click={() => {
            selectedId = null;
            toggleCollapse(node.title);
          }}
        >
          <span class={`transform transition-transform inline-block ${collapsedSections.has(node.title) ? 'rotate-0' : 'rotate-90'}`}>&gt;</span>
          {node.title}
        </button>
      {:else}
        <!-- Non-clickable intermediate section (Level 2 without question_numbers) -->
        {node.title}
      {/if}

      <!-- Recurse into sub-sections -->
      {#if node.sections && level < 3 && (level !== 1 || !collapsedSections.has(node.title))}
        {#if TreeComponent}
          <svelte:component this={TreeComponent} nodes={node.sections} level={level + 1} on:sectionclick bind:selectedId />
        {/if}
      {/if}
    </li>
  {/each}
</ul>
<style>
  @media (prefers-color-scheme: dark) {
    ul {
      color: #ddd;
    }

    button:hover,
    button:focus-visible {
      color: var(--color-theme-1);
    }
  }

  :global(.light) ul {
    color: var(--color-text);
  }

  :global(.light) button:hover,
  :global(.light) button:focus-visible {
    color: var(--color-theme-1);
  }
</style>