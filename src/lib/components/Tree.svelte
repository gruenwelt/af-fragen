<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Tree from './Tree.svelte';
  import { page } from '$app/stores';
  import { base } from '$app/paths';

  export let nodes: any[] = [];
  export let level = 1;

  const dispatch = createEventDispatcher();

  let collapsedSections = new Set();

  function toggleCollapse(title: string) {
    collapsedSections = new Set(
      collapsedSections.has(title)
        ? [...collapsedSections].filter((t) => t !== title)
        : [...collapsedSections, title]
    );
  }

  $: levelClass = level === 1
    ? ''
    : level === 2
    ? 'ml-4 text-sm'
    : 'ml-6 text-xs';
</script>

<ul class="list-none pl-0 font-mono">
  {#each nodes as node}
    <li
      class={`mt-4 break-words ${levelClass}`}
    >
      {#if level === 3 || (level === 2 && node.question_numbers?.length)}
        <button
          type="button"
          class="text-left w-full hover:text-[color:var(--color-theme-1)] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-theme-1)]"
          on:click={() => {
            dispatch('sectionclick', node);
          }}
        >
          <span>-</span> <span class="hover:underline">{node.title}</span>
        </button>
      {:else if level === 1}
        <button
          type="button"
          class="flex items-center gap-1 text-left w-full cursor-pointer hover:text-[color:var(--color-theme-1)] focus:outline-none"
          on:click={() => toggleCollapse(node.title)}
        >
          <span class={`transform transition-transform inline-block ${collapsedSections.has(node.title) ? 'rotate-0' : 'rotate-90'}`}>&gt;</span>
          {node.title}
        </button>
      {:else}
        {node.title}
      {/if}

      {#if node.sections && level < 3 && (level !== 1 || !collapsedSections.has(node.title))}
        <Tree nodes={node.sections} level={level + 1} on:sectionclick />
      {/if}
    </li>
  {/each}
</ul>