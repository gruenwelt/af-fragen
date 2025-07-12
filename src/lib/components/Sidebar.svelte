<script lang="ts">
	export let Tree;
	export let treeData;
	export let mobile = false;
	export let visible = true;
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
</script>

{#if Tree}
	{#if mobile}
		<div
			class={`fixed top-[5%] left-0 h-full w-[70%] max-h-[90%] rounded-2xl z-40 p-4 bg-white/70 overflow-y-auto shadow-lg transform transition-transform duration-300 ${
				visible ? 'translate-x-0' : '-translate-x-full'
			}`}
		>
			<Tree
				nodes={treeData}
				level={1}
				on:sectionclick={(e: CustomEvent<any>) => dispatch('sectionclick', e.detail)}
			/>
		</div>
	{:else}
		<nav
			class="w-[35%] rounded-lg p-4 max-h-[90vh] overflow-y-auto bg-white/70"
			aria-label="Left sidebar navigation menu"
		>
			<Tree
				nodes={treeData}
				level={1}
				on:sectionclick={(e: CustomEvent<any>) => dispatch('sectionclick', e.detail)}
			/>
		</nav>
	{/if}
{/if}
