<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import logo from '$lib/images/svelte-logo.svg';
	import github from '$lib/images/github.svg';
	import { base } from '$app/paths';

let currentSearch = '';
let currentPath = '';

$: currentSearch = browser ? $page.url.search : '';
$: currentPath = browser ? $page.url.pathname : '';
</script>

<header>
	<div class="corner">
		<a href="https://svelte.dev/docs/kit">
			<img src={logo} alt="SvelteKit" />
		</a>
	</div>

		<!-- Filter by class nav bar -->
	<!-- This nav bar allows filtering by class via query parameter -->
	<nav>
		<svg viewBox="0 0 2 3" aria-hidden="true">
			<path d="M0,0 L1,2 C1.5,3 1.5,3 2,3 L2,0 Z" />
		</svg>
		<ul>
			<li aria-current={browser && new URLSearchParams(currentSearch).get('class') === '1' ? 'page' : undefined}>
				<a href="{base}/?class=1">N</a>
			</li>
			<li aria-current={browser && new URLSearchParams(currentSearch).get('class') === '2' ? 'page' : undefined}>
				<a href="{base}/?class=2">E</a>
			</li>
			<li aria-current={browser && new URLSearchParams(currentSearch).get('class') === '3' ? 'page' : undefined}>
				<a href="{base}/?class=3">A</a>
			</li>
			<li aria-current={browser && !['1','2','3'].includes(new URLSearchParams(currentSearch).get('class') ?? '') ? 'page' : undefined}>
				<a href="{base}/">Alle</a>
			</li>
		</ul>
		<svg viewBox="0 0 2 3" aria-hidden="true">
			<path d="M0,0 L0,3 C0.5,3 0.5,3 1,2 L2,0 Z" />
		</svg>
	</nav>


	<nav>
		<svg viewBox="0 0 2 3" aria-hidden="true">
			<path d="M0,0 L1,2 C1.5,3 1.5,3 2,3 L2,0 Z" />
		</svg>
		<ul>
			<li aria-current={browser && currentPath === base + '/' ? 'page' : undefined}>
				<a href={`${base}/${currentSearch}`}>Fragen</a>
			</li>
			<li aria-current={browser && currentPath === base + '/info' ? 'page' : undefined}>
				<a href={`${base}/info${currentSearch}`}>Info</a>
			</li>
		</ul>
		<svg viewBox="0 0 2 3" aria-hidden="true">
			<path d="M0,0 L0,3 C0.5,3 0.5,3 1,2 L2,0 Z" />
		</svg>
	</nav>

	<div class="corner">
		<a href="https://github.com/gruenwelt">
			<img src={github} alt="GitHub" />
		</a>
	</div>
</header>

<style>
	header {
		display: flex;
		justify-content: space-between;
	}

	.corner {
		width: 3em;
		height: 3em;
	}

	.corner a {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	.corner img {
		width: 2em;
		height: 2em;
		object-fit: contain;
	}

	nav {
		display: flex;
		justify-content: center;
		--background: rgba(255, 255, 255, 0.7);
	}

	svg {
		width: 2em;
		height: 3em;
		display: block;
	}

	path {
		fill: var(--background);
	}

	ul {
		position: relative;
		padding: 0;
		margin: 0;
		height: 3em;
		display: flex;
		justify-content: center;
		align-items: center;
		list-style: none;
		background: var(--background);
		background-size: contain;
	}

	li {
		position: relative;
		height: 100%;
	}

	li[aria-current='page']::before {
		--size: 6px;
		content: '';
		width: 0;
		height: 0;
		position: absolute;
		top: 0;
		left: calc(50% - var(--size));
		border: var(--size) solid transparent;
		border-top: var(--size) solid var(--color-theme-1);
	}

	nav a {
		display: flex;
		height: 100%;
		align-items: center;
		padding: 0 0.5rem;
		color: var(--color-text);
		font-weight: 700;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		text-decoration: none;
		transition: color 0.2s linear;
	}

	a:hover {
		color: var(--color-theme-1);
	}
</style>
