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
        <!-- Top-level section (Level 1) without collapsing -->
        <div class="flex items-center gap-1 text-left w-full">
          {node.title}
        </div>
      {:else}
        <!-- Non-clickable intermediate section (Level 2 without question_numbers) -->
        {node.title}
      {/if}

      <!-- Recurse into sub-sections -->
      {#if node.sections && level < 3}
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

    button:focus-visible {
      color: var(--color-theme-1);
    }
  }

  :global(.light) ul {
    color: var(--color-text);
  }

  :global(.light) button:focus-visible {
    color: var(--color-theme-1);
  }
</style>