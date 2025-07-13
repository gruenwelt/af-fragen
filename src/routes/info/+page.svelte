<svelte:head>
  <title>Info – Amateurfunkprüfung Simulator (N, E, A)</title>
  <meta name="description" content="Informationen über die Web-App zur Vorbereitung auf die Amateurfunkprüfung, zu Datenquellen, Lizenz, Datenschutz und rechtlichen Hinweisen." />
  <link rel="canonical" href="https://funkfragen.de/info" />
  <meta name="keywords" content="Amateurfunk, Prüfungssimulator, Funkprüfung, Klasse N, Klasse E, Klasse A, Prüfungsfragen, Lernapp, Informationen" />
  <meta property="og:title" content="Info – Funkfragen: Prüfungssimulator für Amateurfunk" />
  <meta property="og:description" content="Erfahre mehr über die Funktionalität, Datenquellen, Datenschutz und Lizenzbedingungen der Funkfragen Web-App." />
  <script type="application/ld+json">{
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Funkfragen Info",
    "url": "https://funkfragen.de/info",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "All",
    "description": "Informationen über die Web-App zur Vorbereitung auf die Amateurfunkprüfung, zu Datenquellen, Lizenz, Datenschutz und rechtlichen Hinweisen.",
    "inLanguage": "de",
    "mainEntityOfPage": "https://funkfragen.de/info",
    "publisher": {
      "@type": "Organization",
      "name": "Funkfragen"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "EUR"
    }
  }</script>
</svelte:head>

<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { isMobile } from '$lib/stores/device';

	let headerReady = false;

onMount(() => {
	if (browser) {
		requestAnimationFrame(() => {
			headerReady = true;
		});
	}
});

	// Get current path and base
	let currentPath = '';
	let base = '';
	$: if (browser) {
		currentPath = window.location.pathname;
		base = '';
	}

	// Reactive statement for isInfoPage
	$: isInfoPage = browser && currentPath === base + '/info';
</script>

<div
	lang="de"
	class="space-y-6 pt-8 max-w-2xl mx-auto break-words hyphens-auto text-justify"
	class:pr-1={$isMobile}
	class:p-1={$isMobile}
	style="scrollbar-width: none; -ms-overflow-style: none;"
	on:wheel|passive
>
	{#if headerReady}
	<p>
		Prüfungsfragen zum Erwerb von Amateurfunkprüfungsbescheinigungen<br>
		3. Auflage, März 2024
	</p>

	<p>
	  <strong>Funktionalität der App</strong>
	</p>
	<p>
	  Über die oberen Filter lassen sich die Prüfungsteile „Technische Kenntnisse“ (unterteilt in N, E und A), „Betriebliche Kenntnisse“ (B) und „Kenntnisse von Vorschriften“ (V) auswählen. Die Auswahl „Alle“ zeigt Fragen aus allen Teilen gemeinsam.<br><br>

	  Der Abschnitt „Üben“ zeigt eine zufällige Liste von Fragen basierend auf dem gewählten Prüfungsteil und der Anzahl der gewünschten Fragen (wählbar: 25 – dem Prüfungsformat entsprechend, 100 oder 200). Die Antwortmöglichkeiten sind hier in zufälliger Reihenfolge angeordnet. Sobald ein Übungstest gestartet wurde, kann die Auswahl nicht mehr geändert werden, da die Fragen zu Beginn des Tests einmalig entsprechend der gewählten Auswahl gefiltert werden und während der gesamten Sitzung konsistent bleiben. Navigiert man während des Tests zu anderen Bereichen, merkt sich die App den Stand des Tests, sodass man später dorthin zurückkehren kann. Daher ist während einer laufenden Sitzung die Auswahl anderer Teile deaktiviert.<br><br>

	  Der Abschnitt „Fragen“ listet alle Fragen des gewählten Prüfungsteils vollständig auf. Über die linke Seitenleiste kann zusätzlich navigiert werden – beim Klick wird automatisch zur ersten Frage der jeweiligen Gruppe gescrollt. Wie in den Originaldaten angegeben, ist hier stets die erste Antwort (oben oder oben-links) die richtige.<br><br>

	  Die App funktioniert auch recht zuverlässig mit der integrierten Übersetzungsfunktion des Safari-Browsers.
	</p>

	<p>
	  <strong>Prüfungsaufbau und Lizenzklassen</strong>
	</p>
	<p>
	  Informationen zum Ablauf der Amateurfunkprüfung sowie zu den verschiedenen Lizenzklassen finden Sie auf der Website des Deutschen Amateur-Radio-Clubs (DARC): 
	  <a href="https://www.darc.de/einsteiger/amateurfunkausbildung/#c37989" target="_blank" rel="noopener noreferrer" class="underline hover:text-[color:var(--color-theme-1)]">
	    Amateurfunkausbildung – DARC
	  </a>.
	</p>

	<p>
	  <strong>Daten</strong>
	</p>
	<p>
		Die Prüfungsfragen werden in maschinenlesbarer Form von der<br>
		Bundesnetzagentur für Elektrizität, Gas, Telekommunikation, Post und Eisenbahnen,<br>
		Tulpenfeld 4, 53113 Bonn<br>
		unter der
		<a href="https://www.govdata.de/dl-de/by-2-0" target="_blank" rel="noopener noreferrer" class="underline hover:text-[color:var(--color-theme-1)]">Datenlizenz DL-DE->BY-2.0</a>
		bereitgestellt.<br><br>

		Dieser Fragen- und Antwortenkatalog veranschaulicht Prüfungsinhalte und Anforderungen in den Prüfungsteilen „Betriebliche Kenntnisse“, „Kenntnisse von Vorschriften“ und „Technische Kenntnisse“ die bei Prüfungen zum Erwerb von Amateurfunkzeugnissen der Klassen A, E und N ab dem 24. Juni 2024 gefordert werden. Die Prüfungsinhalte und Anforderungen berücksichtigen die CEPT-Empfehlung T/R 61-02, den ERC-Report 32, den ECC-Report 89 sowie weitergehende Anforderungen, die sich unter anderem aus dem Amateurfunkgesetz (AFuG) und der ab dem 23. Juni 2024 gültigen Amateurfunkverordnung (AFuV) ergeben.<br><br>

		Dieser Fragenkatalog ersetzt für Prüfungen ab dem 24. Juni 2024 die bisherigen von der Regulierungsbehörde bzw. der Bundesnetzagentur veröffentlichten Fragenkataloge und Einzelheiten aus der 1. Auflage (Oktober 2006) sowie der 2. Auflage (Dezember 2023).<br><br>

		Für den Erwerb eines Amateurfunkzeugnisses müssen die Prüfungsteile „Technische Kenntnisse“, „Betriebliche Kenntnisse“ und „Kenntnisse von Vorschriften“ erfolgreich abgelegt werden. Die Inhalte und Anforderungen der Prüfungsteile für die Klassen N, E und A unterscheiden sich nur beim Prüfungsteil „Technische Kenntnisse“. Der Aufstieg von den Klassen N und E zu einer höheren Klasse ist mit einer Zusatzprüfung möglich, die nur aus dem bzw. den Prüfungsteil(en) „Technische Kenntnisse“ besteht.<br><br>
		
		Die Inhalte und Anforderungen der Prüfungsteile sind in dem nachfolgendem Fragenund Antwortenkatalog veranschaulicht. Eventuelle künftige Änderungen werden mindestens drei Monate vor ihrer Anwendung bekannt gemacht. Der Fragen- und Antwortenkatalog beinhaltet die folgenden Teile:
	</p>
		<ul class="list-disc pl-4 space-y-1">
		<li>Prüfungsfragen im Prüfungsteil „Betriebliche Kenntnisse“ bei Prüfungen zum Erwerb von Amateurfunkzeugnissen der Klassen N, E und A,</li>
		<li>Prüfungsfragen im Prüfungsteil „Kenntnisse von Vorschriften“ bei Prüfungen zum Erwerb von Amateurfunkzeugnissen der Klassen N, E und A,</li>
		<li>Prüfungsfragen im Prüfungsteil „Technische Kenntnisse“ bei Prüfungen zum Erwerb von Amateurfunkzeugnissen der Klassen N, E und A,</li>
		<li>Weitere Prüfungsfragen im Prüfungsteil „Technische Kenntnisse“ bei Prüfungen zum Erwerb von Amateurfunkzeugnissen der Klassen E und A,</li>
		<li>Weitere Prüfungsfragen im Prüfungsteil „Technische Kenntnisse“ bei Prüfungen zum Erwerb von Amateurfunkzeugnissen der Klasse A.</li>
		</ul><br>
	<p>
		Bei den Prüfungen müssen nicht ausschließlich Fragen und Antworten aus dem hier vorliegenden Katalog verwendet werden. Es können auch andere Fragen und Antworten verwendet werden, die sich inhaltlich an den Fragen des betreffenden Katalogs orientieren.<br><br>

		Die richtige Antwort bei jeder Frage ist im nachfolgenden Katalog immer die Antwort A. Die Antworten B, C und D sind falsche oder teilweise falsche Antworten. In den Prüfungsbögen werden die Antworten in zufälliger Reihenfolge angeordnet. Bei der Prüfung ist im Antwortbogen die als richtig angesehene Antwort anzukreuzen.<br><br>

		Bei der Prüfung wird im Prüfungsteil „Technische Kenntnisse“ eine Formelsammlung zur Verfügung gestellt. Die Formelsammlung entspricht der als Anhang enthaltenen Formelsammlung und kann auch erforderliche Korrekturen und Ergänzungen enthalten. Andere Formelsammlungen dürfen bei der Prüfung nicht benutzt werden. Weiterhin sind bei der Prüfung im Teil „Technische Kenntnisse“ als Hilfsmittel eigene nicht programmierbare Taschenrechner ohne Textspeicher zulässig.<br><br>

		Der Fragenkatalog ist ein Hilfsmittel zur Vorbereitung auf die Amateurfunkprüfung. Er kann jedoch nicht Lehr- und Unterrichtsmaterialien oder die Vielseitigkeit der Fachliteratur ersetzen.<br><br>

		Weitere Informationen, Regelungen sowie Links zu den Gesetzen und Verordnungen zum Thema Amateurfunk sowie zur Durchführung der Amateurfunkprüfungen und zur Prüfungsvorbereitung finden Sie online unter bundesnetzagentur.de/amateurfunk.<br><br>

		Die Fragen wurden mit großer Unterstützung durch den Runden Tisch Amateurfunk und dessen Mitgliedsverbänden sowie mit viel Engagement einzelner Funkamateure und Beschäftigten der Bundesnetzagentur erstellt. Wir danken allen, auch allen Hinweisgebern zu Korrekturen der 2. Auflage, die damit zu der Erstellung dieser 3. Auflage beigetragen haben. Ein besonderer Dank gilt erneut Dr. Matthias Jung und Björn Swierczek vom DARC e.V., die auf Seiten der Verbände die Überarbeitung des Fragenkatalogs federführend koordiniert und besonders tatkräftig zur Überarbeitung der Prüfungsfragen beigetragen haben.<br><br>

		<br>

		Offizielle Hilfsmittel zur Amateurfunkprüfung können hier heruntergeladen werden: 
    <a href="https://www.bundesnetzagentur.de/SharedDocs/Downloads/DE/Sachgebiete/Telekommunikation/Unternehmen_Institutionen/Frequenzen/Amateurfunk/AntraegeFormulare/Hilfsmittel_12062024.pdf?__blob=publicationFile&v=3" target="_blank" rel="noopener noreferrer" class="underline hover:text-[color:var(--color-theme-1)]">
      Amateurfunkprüfungen – Hilfsmittel (PDF)
    </a>
  	</p>

	<p>
	  <strong>Über die App</strong>
	</p>
	<p>
		Diese Web-App wurde von <a href="https://www.linkedin.com/in/gw10/" target="_blank" rel="noopener noreferrer" class="underline hover:text-[color:var(--color-theme-1)]">Puneet P.</a> entworfen und entwickelt, unter Verwendung des SvelteKit App Framework. Als Open-Source-Projekt kann der vollständige Code auf <a href="https://github.com/gruenwelt" target="_blank" rel="noopener noreferrer" class="underline hover:text-[color:var(--color-theme-1)]">GitHub</a> gefunden werden.<br><br>
		
		Svelte bietet eine besonders hohe Performance, geringe Ladezeiten und eine einfache, reaktive Programmierweise ohne unnötigen Overhead.
	</p>

	<p>
	  <strong>Besonderer Dank</strong>
	</p>
	<p>
	  Vielen Dank an <a href="https://www.afup.a36.de/" target="_blank" rel="noopener noreferrer" class="underline hover:text-[color:var(--color-theme-1)]">Junghard, DF1IAV</a> für seine hilfreichen Hinweise und Anregungen zur Verbesserung der App.
	</p>



	<p><strong>Ressourcen</strong></p>
	<p>
    Zur ergänzenden Prüfungsvorbereitung empfehlen wir das Lernangebot auf <a href="https://www.50ohm.de/" target="_blank" rel="noopener noreferrer" class="underline hover:text-[color:var(--color-theme-1)]">50Ohm.de</a> (ein Angebot des <a href="https://www.darc.de/home/" target="_blank" rel="noopener noreferrer" class="underline hover:text-[color:var(--color-theme-1)]">Deutschen Amateur-Radio-Clubs e. V.</a>).
  </p>

	<p>&nbsp;</p>

	<p class="text-sm text-gray-600">
	  <strong>Rechtliche Hinweise / Disclaimer</strong>
	</p>
	<p class="text-sm text-gray-600">
		Datenschutz:<br>
		Diese Web-App speichert oder sammelt keinerlei personenbezogene Daten – Punkt. Die Nutzung ist vollständig anonym, es findet keine Erfassung oder Auswertung von Nutzeraktivitäten statt.
	</p>

	<p class="text-sm text-gray-600">
		Unabhängigkeit:<br>
		Diese Web-App steht in keinerlei Verbindung zu Dritten – insbesondere nicht zur Bundesnetzagentur für Elektrizität, Gas, Telekommunikation, Post und Eisenbahnen, zu 50Ohm.de, zum Deutschen Amateur-Radio-Club e. V. (DARC), zu Svelte, GitHub oder sonstigen genannten oder verwendeten Organisationen, Diensten oder Marken. Alle Referenzen dienen ausschließlich informativen oder funktionalen Zwecken.
	</p>

	<p class="text-sm text-gray-600">
		Haftungsausschluss:<br>
		Alle Inhalte dieser Web-App wurden mit größter Sorgfalt erstellt. Es wird jedoch keine Gewähr für deren Richtigkeit, Vollständigkeit oder Aktualität übernommen. Die Nutzung der Inhalte erfolgt auf eigene Verantwortung.
	</p>

	<div class="h-20"></div>

	{/if}
</div>

<style>
	div::-webkit-scrollbar {
		display: none;
	}
	:global(.dark) .text-gray-600 {
		color: #ccc;
	}
</style>
