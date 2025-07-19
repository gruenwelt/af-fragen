<script lang="ts">

	import Header from './Header.svelte';
	import '../app.css';
	import '@fontsource/inter';

	let { children } = $props();

	if ('serviceWorker' in navigator) {
	  window.addEventListener('load', () => {
	    navigator.serviceWorker.register('/sw.js');
	  });
	}
</script>

<svelte:head>
  <title>Funkfragen – Amateurfunkprüfung online lernen</title>
  <meta name="description" content="Trainiere mit Fragen zur deutschen Amateurfunkprüfung (N, E, A, B, V)." />
  <meta name="keywords" content="Amateurfunk, Prüfungssimulator, Funkprüfung, Klasse N, Klasse E, Klasse A, Klasse B, Klasse V, Prüfungsfragen, Lernapp, Online Test, Fragenkatalog, Amateurfunkzeugnis" />
  <meta property="og:title" content="Funkfragen – Online lernen für die Amateurfunkprüfung" />
  <meta property="og:description" content="Offizieller Fragenkatalog und Prüfungssimulator zur deutschen Amateurfunkprüfung (N, E, A, B, V) – interaktiv, kostenlos und ohne Anmeldung." />
  <script type="application/ld+json">[
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Funkfragen",
    "url": "https://funkfragen.de",
    "description": "Trainiere für die deutsche Amateurfunkprüfung der Klassen N, E, A, B und V mit offiziellen Fragen im Übungsmodus oder als Fragenkatalog.",
    "inLanguage": "de",
    "mainEntityOfPage": "https://funkfragen.de",
    "publisher": {
      "@type": "Organization",
      "name": "Funkfragen"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Funkfragen Übungsmodus",
    "url": "https://funkfragen.de",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "All",
    "description": "Simuliere die deutsche Amateurfunkprüfung für die Klassen N, E, A, B und V. Wähle 25, 100 oder 200 Fragen im Übungsmodus mit zufälliger Reihenfolge.",
    "inLanguage": "de",
    "mainEntityOfPage": "https://funkfragen.de",
    "publisher": {
      "@type": "Organization",
      "name": "Funkfragen"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "EUR"
    }
  }
]</script>
</svelte:head>

<div class="app">
	<Header />

	<main>
		{@render children()}
	</main>
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
</style>
