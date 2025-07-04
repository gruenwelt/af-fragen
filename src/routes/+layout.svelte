<script lang="ts">

	import Header from './Header.svelte';
	import '../app.css';
	import '@fontsource/inter';

	let { children } = $props();
</script>

<div class="app">
	<Header />

	<main>
		{@render children()}
	</main>
	<!--
	<footer>
		<p>
			visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to learn about SvelteKit
		</p>
	</footer>
	-->
</div>

<style>
	/*
	  Root app container fixed to viewport height.
	  main fills remaining space and scrolls internally.
	  header and footer do not shrink.
	*/
	.app {
		display: flex;
		flex-direction: column;
		height: 100vh; /* fixed height to viewport */
	}

	main {
		flex-grow: 1; /* fill remaining space between header and footer */
		display: flex;
		flex-direction: row;
		padding: 1rem;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		box-sizing: border-box;
		overflow: auto; /* scroll content inside main */
	}

	/*
	footer {
		flex-shrink: 0; /* prevent shrinking
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 12px;
	}
	
	footer a {
		font-weight: bold;
	}

	@media (min-width: 480px) {
		footer {
			padding: 12px 0;
		}
	}
	*/ 
</style>
