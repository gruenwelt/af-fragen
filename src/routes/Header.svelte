<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import logo from '$lib/images/svelte-logo.svg';
	import github from '$lib/images/github.svg';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
    import { sessionStarted } from '$lib/stores/session';

	let isDesktop: boolean | undefined = undefined;
let showPopup = true;

	onMount(() => {
		if (browser) {
			const updateSize = () => {
				isDesktop = window.innerWidth > 768;
			};
			updateSize();
			window.addEventListener('resize', updateSize);
			return () => window.removeEventListener('resize', updateSize);
		}
	});

	let currentSearch = '';
	let currentPath = '';
  let selectedClass = '';

	$: currentSearch = browser ? $page.url.search : '';
	$: currentPath = browser ? $page.url.pathname : '';
  $: selectedClass = browser ? new URLSearchParams(currentSearch).get('class') ?? '1' : '1';
  $: isInfoPage = browser && currentPath === base + '/info';
	$: $sessionStarted;
</script>

{#if isDesktop === undefined}
	<!-- No header until screen size is known -->
{:else if isDesktop}
<header>
	<div class="corner">
		<a href="https://svelte.dev/docs/kit">
			<img src={logo} alt="SvelteKit" aria-label="SvelteKit Logo" />
		</a>
	</div>

		<!-- Filter by class nav bar -->
	<!-- This nav bar allows filtering by class via query parameter -->
	<nav aria-label="Klassenauswahl">
		<svg viewBox="0 0 2 3" aria-hidden="true">
			<path d="M0,0 L1,2 C1.5,3 1.5,3 2,3 L2,0 Z" />
		</svg>
		<ul>
			<li aria-current={selectedClass === '1' ? 'page' : undefined}>
				{#if ($sessionStarted && selectedClass !== '1') || isInfoPage}
					<span class="opacity-50 cursor-not-allowed flex h-full items-center px-2 text-[color:var(--color-text)] font-bold text-[0.8rem] uppercase tracking-wider">N</span>
				{:else}
					<a href={`${currentPath}?class=1`}>N</a>
				{/if}
			</li>
			<li aria-current={selectedClass === '2' ? 'page' : undefined}>
				{#if ($sessionStarted && selectedClass !== '2') || isInfoPage}
					<span class="opacity-50 cursor-not-allowed flex h-full items-center px-2 text-[color:var(--color-text)] font-bold text-[0.8rem] uppercase tracking-wider">E</span>
				{:else}
					<a href={`${currentPath}?class=2`}>E</a>
				{/if}
			</li>
			<li aria-current={selectedClass === '3' ? 'page' : undefined}>
				{#if ($sessionStarted && selectedClass !== '3') || isInfoPage}
					<span class="opacity-50 cursor-not-allowed flex h-full items-center px-2 text-[color:var(--color-text)] font-bold text-[0.8rem] uppercase tracking-wider">A</span>
				{:else}
					<a href={`${currentPath}?class=3`}>A</a>
				{/if}
			</li>
			<li aria-current={selectedClass === 'Alle' ? 'page' : undefined}>
				{#if ($sessionStarted && selectedClass !== 'Alle') || isInfoPage}
					<span class="opacity-50 cursor-not-allowed flex h-full items-center px-2 text-[color:var(--color-text)] font-bold text-[0.8rem] uppercase tracking-wider">Alle</span>
				{:else}
					<a href={`${currentPath}?class=Alle`}>Alle</a>
				{/if}
			</li>
		</ul>
		<svg viewBox="0 0 2 3" aria-hidden="true">
			<path d="M0,0 L0,3 C0.5,3 0.5,3 1,2 L2,0 Z" />
		</svg>
	</nav>


	<nav aria-label="Hauptnavigation">
		<svg viewBox="0 0 2 3" aria-hidden="true">
			<path d="M0,0 L1,2 C1.5,3 1.5,3 2,3 L2,0 Z" />
		</svg>
		<ul>
			<li aria-current={browser && currentPath === base + '/' ? 'page' : undefined}>
				<a href={`${base}/${currentSearch}`}>Üben</a>
			</li>
			<li aria-current={browser && currentPath === base + '/fragen' ? 'page' : undefined}>
				<a href={`${base}/fragen${currentSearch}`}>Fragen</a>
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
			<img src={github} alt="GitHub" aria-label="GitHub Profil" />
		</a>
	</div>
</header>
{:else}
<header>
	<div class="corner">
		<a href="https://svelte.dev/docs/kit">
			<img src={logo} alt="SvelteKit" aria-label="SvelteKit Logo" />
		</a>
	</div>

	<div style="display: flex; flex-direction: column; align-items: center;">
		<div style="width: 100%;">
			<nav aria-label="Hauptnavigation">
				<svg viewBox="0 0 2 3" aria-hidden="true">
					<path d="M0,0 L1,2 C1.5,3 1.5,3 2,3 L2,0 Z" />
				</svg>
				<ul>
					<li>
						<button class="hamburger" on:click={() => showPopup = !showPopup} aria-label="Toggle menu">
							☰
						</button>
					</li>
					<li aria-current={browser && currentPath === base + '/' ? 'page' : undefined}>
						<a href={`${base}/${currentSearch}`}>Üben</a>
					</li>
					<li aria-current={browser && currentPath === base + '/fragen' ? 'page' : undefined}>
						<a href={`${base}/fragen${currentSearch}`}>Fragen</a>
					</li>	
					<li aria-current={browser && currentPath === base + '/info' ? 'page' : undefined}>
						<a href={`${base}/info${currentSearch}`}>Info</a>
					</li>
				</ul>
				<svg viewBox="0 0 2 3" aria-hidden="true">
					<path d="M0,0 L0,3 C0.5,3 0.5,3 1,2 L2,0 Z" />
				</svg>
			</nav>
		</div>
		{#if showPopup}
			<div style="width: 100%;">
				<nav aria-label="Klassenauswahl" style="margin-top: 1px;">
					<svg viewBox="0 0 2 3" aria-hidden="true">
						<path d="M0,0 L1,2 C1.5,3 1.5,3 2,3 L2,0 Z" />
					</svg>
					<ul>
						<li aria-current={selectedClass === '1' ? 'page' : undefined}>
							{#if ($sessionStarted && selectedClass !== '1') || isInfoPage}
								<span class="opacity-50 cursor-not-allowed flex h-full items-center px-2 text-[color:var(--color-text)] font-bold text-[0.8rem] uppercase tracking-wider">N</span>
							{:else}
								<a href={`${currentPath}?class=1`}>N</a>
							{/if}
						</li>
						<li aria-current={selectedClass === '2' ? 'page' : undefined}>
							{#if ($sessionStarted && selectedClass !== '2') || isInfoPage}
								<span class="opacity-50 cursor-not-allowed flex h-full items-center px-2 text-[color:var(--color-text)] font-bold text-[0.8rem] uppercase tracking-wider">E</span>
							{:else}
								<a href={`${currentPath}?class=2`}>E</a>
							{/if}
						</li>
						<li aria-current={selectedClass === '3' ? 'page' : undefined}>
							{#if ($sessionStarted && selectedClass !== '3') || isInfoPage}
								<span class="opacity-50 cursor-not-allowed flex h-full items-center px-2 text-[color:var(--color-text)] font-bold text-[0.8rem] uppercase tracking-wider">A</span>
							{:else}
								<a href={`${currentPath}?class=3`}>A</a>
							{/if}
						</li>
						<li aria-current={selectedClass === 'Alle' ? 'page' : undefined}>
							{#if ($sessionStarted && selectedClass !== 'Alle') || isInfoPage}
								<span class="opacity-50 cursor-not-allowed flex h-full items-center px-2 text-[color:var(--color-text)] font-bold text-[0.8rem] uppercase tracking-wider">Alle</span>
							{:else}
								<a href={`${currentPath}?class=Alle`}>Alle</a>
							{/if}
						</li>
					</ul>
					<svg viewBox="0 0 2 3" aria-hidden="true">
						<path d="M0,0 L0,3 C0.5,3 0.5,3 1,2 L2,0 Z" />
					</svg>
				</nav>
			</div>
		{/if}
	</div>

	<div class="corner">
		<a href="https://github.com/gruenwelt">
			<img src={github} alt="GitHub" aria-label="GitHub Profil" />
		</a>
	</div>
</header>
{/if}


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

	button.hamburger {
	  background: none;
	  border: none;
	  font-size: 1.4rem;
	  padding-left: 0.5rem;
	  padding-right: 0.4rem;
	  text-transform: none;
	  display: flex;
	  align-items: center;
	  transform: translateY(6px);
	  cursor: pointer;
	}

	@media (prefers-color-scheme: dark) {
		nav {
			--background: rgba(30, 30, 30, 0.7);
		}

		path {
			fill: var(--background);
		}

		ul {
			background: var(--background);
		}

		nav a {
			color: var(--color-text);
		}

		a:hover {
			color: var(--color-theme-1);
		}
	}
</style>
