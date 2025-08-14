<script lang="ts">
import { page } from '$app/stores';
import { browser } from '$app/environment';
import { base } from '$app/paths';
import { sessionStarted } from '$lib/stores/session';
import { isDarkMode } from '$lib/stores/theme';
import { isMobile } from '$lib/stores/device';
import { onMount } from 'svelte';

let github = '';
let githubWhite = '';
$: github = `${base}/github.svg`;
$: githubWhite = `${base}/github-white.png`;

// Shape-based nav background controls
let gap = 1.25;   // em, spacing between nav items
let sz = 25;     // px, shape width at each side
let r = 6;       // px, visual radius placeholder (reserved for future use)
let navMainH = 0; // measured height for main nav
let navClassH = 0; // measured height for class nav

$: isDesktop = browser ? !$isMobile : undefined;
let showPopup = true;

let currentSearch = '';
let currentPath = '';
let selectedClass = '';

$: currentSearch = browser ? $page.url.search : '';
$: currentPath = browser ? $page.url.pathname : '';
$: selectedClass = browser ? new URLSearchParams(currentSearch).get('class') ?? 'V' : 'V';
$: isInfoPage = browser && currentPath === base + '/info';
$: $sessionStarted;
$: $isDarkMode;

if (browser) {
	onMount(() => {
		if (currentPath === base + '/info') {
			document.documentElement.classList.add('info-page');
		} else {
			document.documentElement.classList.remove('info-page');
		}
	});
}
  
</script>
  

{#if isDesktop === undefined}
	<!-- No header until screen size is known -->
{:else if isDesktop}
<header>
	<div class="corner">
		<a href="https://github.com/gruenwelt">
			<div class="w-8 h-8 flex items-center justify-center">
				<img src={$isDarkMode ? githubWhite : github} alt="GitHub" aria-label="GitHub Profil" class="w-full h-full object-contain" />
			</div>
		</a>
	</div>

		<!-- Filter by class nav bar -->
	<!-- This nav bar allows filtering by class via query parameter -->
	<nav aria-label="Klassenauswahl">
		<div class="shape" style="--sz:{sz}px; --r:{r}px; --h:{navClassH}px;" bind:clientHeight={navClassH}></div>
		<ul style="--gap:{gap}em">
			<li aria-current={!isInfoPage && selectedClass === 'V' ? 'page' : undefined}>
				{#if ($sessionStarted && selectedClass !== 'V') || isInfoPage}
					<span class="opacity-50 cursor-not-allowed flex h-full items-center text-[color:var(--color-text)] font-bold text-[0.8rem] uppercase tracking-wider">V</span>
				{:else}
					<a href={`${currentPath}?class=V`}>V</a>
				{/if}
			</li>
			<li aria-current={!isInfoPage && selectedClass === 'B' ? 'page' : undefined}>
				{#if ($sessionStarted && selectedClass !== 'B') || isInfoPage}
					<span class="opacity-50 cursor-not-allowed flex h-full items-center text-[color:var(--color-text)] font-bold text-[0.8rem] uppercase tracking-wider">B</span>
				{:else}
					<a href={`${currentPath}?class=B`}>B</a>
				{/if}
			</li>
			<li aria-current={!isInfoPage && selectedClass === '1' ? 'page' : undefined}>
				{#if (($sessionStarted && selectedClass !== '1') || isInfoPage)}
					<span class="opacity-50 cursor-not-allowed flex h-full items-center text-[color:var(--color-text)] font-bold text-[0.8rem] uppercase tracking-wider">N</span>
				{:else}
					<a href={`${currentPath}?class=1`}>N</a>
				{/if}
			</li>
			<li aria-current={!isInfoPage && selectedClass === '2' ? 'page' : undefined}>
				{#if (($sessionStarted && selectedClass !== '2') || isInfoPage)}
					<span class="opacity-50 cursor-not-allowed flex h-full items-center text-[color:var(--color-text)] font-bold text-[0.8rem] uppercase tracking-wider">N→E</span>
				{:else}
					<a href={`${currentPath}?class=2`}>N→E</a>
				{/if}
			</li>
			<li aria-current={!isInfoPage && selectedClass === '3' ? 'page' : undefined}>
				{#if (($sessionStarted && selectedClass !== '3') || isInfoPage)}
					<span class="opacity-50 cursor-not-allowed flex h-full items-center text-[color:var(--color-text)] font-bold text-[0.8rem] uppercase tracking-wider">E→A</span>
				{:else}
					<a href={`${currentPath}?class=3`}>E→A</a>
				{/if}
			</li>
		</ul>
	</nav>


	<nav aria-label="Hauptnavigation">
		<div class="shape" style="--sz:{sz}px; --r:{r}px; --h:{navMainH}px;" bind:clientHeight={navMainH}></div>
		<ul style="--gap:{gap}em">
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
	</nav>

	<div class="corner corner-toggle">
	  <label class="inline-flex items-center cursor-pointer" aria-label="Toggle dark mode">
	    <span class="sr-only">Toggle dark mode</span>
	    <input type="checkbox" class="sr-only peer" bind:checked={$isDarkMode}>
	    <div class="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-[color:var(--color-theme-1)] dark:peer-focus:ring-[color:var(--color-theme-1)] dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[color:var(--color-theme-1)] dark:peer-checked:bg-[color:var(--color-theme-1)]"></div>
	  </label>
	</div>
</header>
{:else}
<header>
	<div class="corner">
		<a href="https://github.com/gruenwelt">
			<div class="w-8 h-8 flex items-center justify-center">
				<img src={$isDarkMode ? githubWhite : github} alt="GitHub" aria-label="GitHub Profil" class="w-full h-full object-contain" />
			</div>
		</a>
	</div>

	<div style="display: flex; flex-direction: column; align-items: center;">
		<div style="width: 100%;">
			<nav aria-label="Hauptnavigation">
				<div class="shape" style="--sz:{sz}px; --r:{r}px; --h:{navMainH}px;" bind:clientHeight={navMainH}></div>
				<ul style="--gap:{gap}em">
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
			</nav>
		</div>
		{#if showPopup}
			<div style="width: 100%;">
				<nav aria-label="Klassenauswahl" style="margin-top: 1px;">
					<div class="shape" style="--sz:{sz}px; --r:{r}px; --h:{navClassH}px;" bind:clientHeight={navClassH}></div>
					<ul style="--gap:{gap}em">
						<li aria-current={!isInfoPage && selectedClass === 'V' ? 'page' : undefined}>
							{#if ($sessionStarted && selectedClass !== 'V') || isInfoPage}
								<span class="opacity-50 cursor-not-allowed flex h-full items-center text-[color:var(--color-text)] font-bold text-[0.8rem] uppercase tracking-wider">V</span>
							{:else}
								<a href={`${currentPath}?class=V`}>V</a>
							{/if}
						</li>
						<li aria-current={!isInfoPage && selectedClass === 'B' ? 'page' : undefined}>
							{#if ($sessionStarted && selectedClass !== 'B') || isInfoPage}
								<span class="opacity-50 cursor-not-allowed flex h-full items-center text-[color:var(--color-text)] font-bold text-[0.8rem] uppercase tracking-wider">B</span>
							{:else}
								<a href={`${currentPath}?class=B`}>B</a>
							{/if}
						</li>
						<li aria-current={!isInfoPage && selectedClass === '1' ? 'page' : undefined}>
							{#if ($sessionStarted && selectedClass !== '1') || isInfoPage}
								<span class="opacity-50 cursor-not-allowed flex h-full items-center text-[color:var(--color-text)] font-bold text-[0.8rem] uppercase tracking-wider">N</span>
							{:else}
								<a href={`${currentPath}?class=1`}>N</a>
							{/if}
						</li>
						<li aria-current={!isInfoPage && selectedClass === '2' ? 'page' : undefined}>
							{#if ($sessionStarted && selectedClass !== '2') || isInfoPage}
								<span class="opacity-50 cursor-not-allowed flex h-full items-center text-[color:var(--color-text)] font-bold text-[0.8rem] uppercase tracking-wider">N→E</span>
							{:else}
								<a href={`${currentPath}?class=2`}>N→E</a>
							{/if}
						</li>
						<li aria-current={!isInfoPage && selectedClass === '3' ? 'page' : undefined}>
							{#if ($sessionStarted && selectedClass !== '3') || isInfoPage}
								<span class="opacity-50 cursor-not-allowed flex h-full items-center text-[color:var(--color-text)] font-bold text-[0.8rem] uppercase tracking-wider">E→A</span>
							{:else}
								<a href={`${currentPath}?class=3`}>E→A</a>
							{/if}
						</li>
					</ul>
				</nav>
			</div>
		{/if}
	</div>

	<div class="corner corner-toggle">
	  <label class="inline-flex items-center cursor-pointer" aria-label="Toggle dark mode">
	    <span class="sr-only">Toggle dark mode</span>
	    <input type="checkbox" class="sr-only peer" bind:checked={$isDarkMode}>
	    <div class="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-[color:var(--color-theme-1)] dark:peer-focus:ring-[color:var(--color-theme-1)] dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[color:var(--color-theme-1)] dark:peer-checked:bg-[color:var(--color-theme-1)]"></div>
	  </label>
	</div>
</header>
{/if}


<style>
	nav {
		position: relative;
		display: flex;
		justify-content: center;
		--background: rgba(255, 255, 255, 0.7);
	}

	.shape {
		position: absolute;
		inset: 0;
		background: var(--background);
		/* extend width by sz on both sides and recenter */
		width: calc(100% + 2 * var(--sz));
		height: 100%;
		translate: calc(-1* var(--sz)) 0;
		/* Angle & curve helpers (use nav height bound to --h) */
		--rads: atan2(var(--h), var(--sz));
		--dx: calc(var(--r) * cos(var(--rads)));
		--dy: calc(var(--r) * sin(var(--rads)));
		/* Slanted ends using quadratic curves for rounded corners */
		clip-path: shape(
			from 0 0,
			line to 100% 0,
			line to calc(100% - var(--sz) + var(--dx)) calc(100% - var(--dy)),
			curve to calc(100% - var(--sz) - var(--r)) 100% with calc(100% - var(--sz)) 100%,
			line to calc(var(--sz) + var(--r)) 100%,
			curve to calc(var(--sz) - var(--dx)) calc(100% - var(--dy)) with var(--sz) 100%,
			close
		);
	}

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

	ul {
		position: relative;
		padding: 0;
		padding-inline: 0.5rem;
		margin: 0;
		height: 3em;
		display: flex;
		justify-content: center;
		align-items: center;
		list-style: none;
		gap: var(--gap);
	}

	li {
		position: relative;
		height: 100%;
	}

	:global(:not(.info-page)) li[aria-current='page']::before {
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
		padding: 0;
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
	  padding: 0;
	  text-transform: none;
	  display: flex;
	  align-items: center;
	  transform: translateY(5.5px);
	  cursor: pointer;
	}

	.corner-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		padding-right: 0.5rem;
	}

	/* Uniform edge spacing: trim padding on first and last visible items */
	nav ul > li:first-of-type > *:first-child { padding-left: 0 !important; }
	nav ul > li:last-of-type > *:last-child { padding-right: 0 !important; }

:global(.dark) nav {
	--background: rgba(30, 30, 30, 0.7);
}



/* On mobile, shrink Klassenauswahl nav to fit its items */
@media (max-width: 768px) {
  nav[aria-label="Klassenauswahl"] {
    width: fit-content;
    margin: 0 auto;
  }
}
</style>
