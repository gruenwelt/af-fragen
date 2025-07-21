<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { isDarkMode } from '$lib/stores/theme';
  export let treeData;
  export let mobile = false;
  export let visible = true;
  const dispatch = createEventDispatcher();
  let isVisible = visible;
  let activeTitle: string | null = null;

  $: isVisible = visible;

  $: document.documentElement.classList.toggle('dark', $isDarkMode);

  function toggleSidebar() {
    isVisible = !isVisible;
    dispatch('toggle');
  }

  function closeSidebar() {
    isVisible = false;
    dispatch('close');
  }

  onMount(() => {

  });
</script>

{#if mobile}
  <div class="relative">
    {#if isVisible}
      <div
        class="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm transition-opacity"
        on:click={closeSidebar}
        on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && closeSidebar()}
        role="button"
        tabindex="0"
      ></div>
    {/if}
    {#if isVisible}
      <div
        class={`sidebar-container fixed top-[5%] left-0 h-full w-[70%] max-h-[90%] translate-x-0 z-40 rounded-xl overflow-y-auto scrollbar-hide ${
          $isDarkMode ? 'bg-[#1e1e1e]' : 'bg-[rgba(255,255,255,0.7)]'
        } ${$isDarkMode ? 'border border-gray-600' : 'border border-gray-200'} p-4 transition-transform`}
      >
        <ul class="mt-[-0.7rem]">
          {#each treeData as node}
            <li class="mt-4 break-words">
              <div>{node.title}</div>
              {#if node.sections}
                <ul class="ml-4 text-sm">
                  {#each node.sections as child}
                    <li class="mt-4 break-words">
                      <div>{child.title}</div>
                      {#if child.sections}
                        <ul class="ml-6 text-xs">
                          {#each child.sections as grandchild}
                            <li class="mt-4 break-words">
                              <button
                                class={`w-full text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-[color:var(--color-theme-1)] focus-visible:outline-none ${
                                  activeTitle === grandchild.title ? 'text-[color:var(--color-theme-1)]' : 'hover:text-[color:var(--color-theme-1)]'
                                }`}
                                on:click={() => {
                                  activeTitle = grandchild.title;
                                  dispatch('sectionclick', grandchild);
                                }}
                              >
                                - {grandchild.title}
                              </button>
                            </li>
                          {/each}
                        </ul>
                      {/if}
                    </li>
                  {/each}
                </ul>
              {/if}
            </li>
          {/each}
        </ul>
      </div>
    {/if}
    <button
      class={`fixed left-0 top-[66%] md:top-1/2 transform -translate-y-1/2 w-10 h-20 rounded-r-full shadow-lg text-4xl flex items-center justify-center z-50 transition-opacity duration-300 ${
        isVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } ${$isDarkMode ? 'bg-[#1e1e1e]' : 'bg-white'}`}
      on:click={toggleSidebar}
      aria-label="Toggle Sidebar"
    >
      &gt;
    </button>
  </div>
{:else}
  <div
    class={`sidebar-container w-[35%] max-h-[90vh] z-40 rounded-xl overflow-y-auto scrollbar-hide ${
      $isDarkMode ? 'bg-[#1e1e1e]' : 'bg-[rgba(255,255,255,0.7)]'
    } ${$isDarkMode ? 'border border-gray-600' : 'border border-gray-200'} p-4 transition-transform`}
  >
    <ul class="mt-[-0.7rem]">
      {#each treeData as node}
        <li class="mt-4 break-words">
          <div>{node.title}</div>
          {#if node.sections}
            <ul class="ml-4 text-sm">
              {#each node.sections as child}
                <li class="mt-4 break-words">
                  <div>{child.title}</div>
                  {#if child.sections}
                    <ul class="ml-6 text-xs">
                      {#each child.sections as grandchild}
                        <li class="mt-4 break-words">
                          <button
                            class={`w-full text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-[color:var(--color-theme-1)] focus-visible:outline-none ${
                              activeTitle === grandchild.title ? 'text-[color:var(--color-theme-1)]' : 'hover:text-[color:var(--color-theme-1)]'
                            }`}
                            on:click={() => {
                              activeTitle = grandchild.title;
                              dispatch('sectionclick', grandchild);
                            }}
                          >
                            - {grandchild.title}
                          </button>
                        </li>
                      {/each}
                    </ul>
                  {/if}
                </li>
              {/each}
            </ul>
          {/if}
        </li>
      {/each}
    </ul>
  </div>
{/if}

<style>
  :global(.sidebar-container) {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  :global(.sidebar-container::-webkit-scrollbar) {
    display: none;
  }
</style>
