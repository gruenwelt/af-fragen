<svelte:head>
	<title>Info</title>
	<meta name="description" content="Info über die app" />
</svelte:head>

<script>
	import { onMount } from 'svelte';
	let isMobile = false;

	onMount(() => {
		isMobile = window.innerWidth <= 768;
	});
</script>


<div
	class="space-y-6 overflow-y-auto pt-8"
	class:text-column={!isMobile}
	class:pr-1={isMobile}
	class:p-1={isMobile}
	style="scrollbar-width: none; -ms-overflow-style: none;"
	on:wheel|passive
>

	<p>
		Prüfungsfragen zum Erwerb von Amateurfunkprüfungsbescheinigungen<br>
		3. Auflage, März 2024
	</p>
	<p>
		Die Prüfungsfragen werden in maschinenlesbarer Form von der<br>
		Bundesnetzagentur für Elektrizität, Gas, Telekommunikation, Post und Eisenbahnen,<br>
		Tulpenfeld 4, 53113 Bonn<br>
		unter der Datenlizenz DL-DE->BY-2.0 bereitgestellt.<br>
	</p>
	<p>
		Diese Web-App wurde von <a href="https://www.linkedin.com/in/gw10/" target="_blank" rel="noopener noreferrer" class="underline hover:text-[color:var(--color-theme-1)]">Puneet P.</a> entworfen und entwickelt, unter Verwendung des SvelteKit App Framework. Als Open-Source-Projekt kann der vollständige Code auf <a href="https://github.com/gruenwelt" target="_blank" rel="noopener noreferrer" class="underline hover:text-[color:var(--color-theme-1)]">GitHub</a> gefunden werden.
	</p>
	<p>
		Svelte bietet eine besonders hohe Performance, geringe Ladezeiten und eine einfache, reaktive Programmierweise ohne unnötigen Overhead.
	</p>
	<p>
		Alle Inhalte dieser Web-App wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte wird jedoch keine Gewähr übernommen. Die Nutzung der Inhalte erfolgt auf eigene Verantwortung.
	</p>

	<div class="h-20"></div>

	<style>
		div::-webkit-scrollbar {
			display: none;
		}
	</style>
</div>
