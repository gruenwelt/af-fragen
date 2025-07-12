<svelte:head>
  <title>Fragenkatalog – Alle offiziellen Fragen der Amateurfunkprüfung (N, E, A)</title>
  <meta name="description" content="Durchsuche den vollständigen Fragenkatalog zur deutschen Amateurfunkprüfung. Filtere nach Klasse N, E oder A und navigiere durch alle Themenbereiche." />
  <link rel="canonical" href="https://funkfragen.de/fragen" />
  <meta name="keywords" content="Amateurfunk, Prüfungssimulator, Funkprüfung, Klasse N, Klasse E, Klasse A, Prüfungsfragen, Fragenkatalog, Lernapp" />
  <meta property="og:title" content="Fragenkatalog – Funkfragen: Alle offiziellen Prüfungsfragen" />
  <meta property="og:description" content="Der komplette Fragenkatalog für die Amateurfunkprüfung: N, E, A – mit Themenfilter, Navigation und zufälliger Übungsfunktion." />
  <script type="application/ld+json">{"@context": "https://schema.org","@type": "CollectionPage","name": "Fragenkatalog – Funkfragen","url": "https://funkfragen.de/fragen","description": "Kompletter Fragenkatalog zur deutschen Amateurfunkprüfung (Klassen N, E, A) mit Themenfilter und Navigation.","inLanguage": "de","mainEntityOfPage": "https://funkfragen.de/fragen","about": {"@type": "EducationalOccupationalProgram","name": "Amateurfunkprüfung Deutschland","educationalLevel": ["N", "E", "A"]},"publisher": {"@type": "Organization","name": "Funkfragen"}}</script>
</svelte:head>

<script lang="ts">
	let headerReady = false;
	// --- External Imports ---
	import { onMount, tick } from 'svelte';
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import { collectQuestions } from '$lib/utils/questionLoader';
	import { filterQuestionsByClass } from '$lib/utils/filterByClass';

	import fullTree from '$lib/data/tree.json';

	// --- Component Imports ---
	let Tree: typeof import('$lib/components/Tree.svelte').default;
	let QuestionCard: typeof import('$lib/components/QuestionCard.svelte').default;
	import Sidebar from '$lib/components/Sidebar.svelte';

import { isMobile } from '$lib/stores/device';
import { get } from 'svelte/store';

onMount(() => {
	document.documentElement.classList.add('light');

	if (!new URLSearchParams(window.location.search).has('class')) {
		const currentParams = new URLSearchParams(window.location.search);
		currentParams.set('class', '1');
		const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
		window.history.replaceState({}, '', newUrl);
	}

	initializeState();
	loadComponents();
});

async function loadComponents() {
	const [{ default: TreeModule }, { default: QuestionCardModule }] = await Promise.all([
		import('$lib/components/Tree.svelte'),
		import('$lib/components/QuestionCard.svelte')
	]);
	Tree = TreeModule;
	QuestionCard = QuestionCardModule;
}

async function initializeState() {
	if (browser && get(isMobile)) {
		setTimeout(() => {
			mobileReady = true;
		}, 100);
	} else {
		mobileReady = true;
	}
	setTimeout(() => {
		headerReady = true;
	}, 0);
}

	// --- Types ---
	type Question = {
		question: string;
		questionHtml: string;
		answer_a: string;
		answerAHtml: string;
		answer_b: string;
		answerBHtml: string;
		answer_c: string;
		answerCHtml: string;
		answer_d: string;
		answerDHtml: string;
		class: string;
		number: string;
		picture_question?: string;
		picture_a?: string;
		picture_b?: string;
		picture_c?: string;
		picture_d?: string;
		section1?: string;
		section2?: string;
		section3?: string;
	};

	// --- Utility Functions ---


	// --- State & Reactive Vars ---

	const questions: Question[] = $page.data?.fragenkatalog?.sections
		? collectQuestions($page.data.fragenkatalog.sections)
		: [];

	// Filtered questions based on class query param (browser only after hydration)
	let filteredQuestions: Question[] = [];
	let isLoading = false;

	$: if (browser && $page.url) {
		const c = $page.url.searchParams.get('class') ?? '1';
		isLoading = true;

		const target = filterQuestionsByClass(questions, c);

		setTimeout(() => {
			filteredQuestions = target;
			isLoading = false;
		}, 300);
	}

	// Selected class for tree filtering
	$: selectedClass = browser ? $page.url.searchParams.get('class') ?? '1' : '1';

	// Tree data filtered by selected class
	let treeData: any[] = [];

	$: if (selectedClass && fullTree) {
		import('$lib/utils/treeFilter').then(({ filterTreeByClass }) => {
			const filtered = filterTreeByClass(fullTree, selectedClass);
			treeData = filtered;
		});
	}

	// --- Scroll Logic ---

	let questionsContainer: HTMLElement | null = null;

	async function scrollToQuestion(questionId: string) {
		if (!questionId) return;

		const index = filteredQuestions.findIndex(q => q.number === questionId);
		if (index === -1) return;

		await tick();
		const container = questionsContainer;
		const target = container?.querySelector(`[data-question-id="${questionId}"]`);
		if (target && container) {
			const containerTop = container.getBoundingClientRect().top;
			const targetTop = target.getBoundingClientRect().top;
			const scrollOffset = targetTop - containerTop + container.scrollTop;
			container.scrollTo({ top: scrollOffset, behavior: 'smooth' });
		}
	}

	// --- Lifecycle ---

	// let isMobile = false;
	let mobileReady = false;

	let showSidebar = false;

	// --- Highlighted Questions ---
	let highlightedNumbers: string[] = [];

	function handleSectionClick(node: any) {
		if (!node.question_numbers || node.question_numbers.length === 0) {
			highlightedNumbers = [];
			return;
		}

		highlightedNumbers = node.question_numbers || [];

		const list = filteredQuestions.length > 0 ? filteredQuestions : questions;
		const first = node.question_numbers.find((qn: string) =>
			list.some((q) => q.number === qn)
		);

		if (first) {
			scrollToQuestion(first);
		}
	}
</script>

{#if isLoading}
	<div class="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
		<div class="w-4 h-4 bg-gray-400 rounded-full animate-pulse"></div>
	</div>
{:else if headerReady}
	<!-- ============================== -->
	<!-- ✅ Desktop Layout (Sidebar + Questions) -->
	<!-- ============================== -->
	{#if !$isMobile && mobileReady}
		<div class="flex max-w-5xl mx-auto p-4 gap-4 overflow-x-hidden flex-grow overflow-auto">
			<!-- Sidebar: Navigation tree -->
			<Sidebar
				{Tree}
				{treeData}
				on:sectionclick={(e) => handleSectionClick(e.detail)}
			/>

			<!-- Questions container -->
			<section
				bind:this={questionsContainer}
				class="w-[65%] space-y-6 max-h-[90vh] overflow-y-auto overflow-x-hidden scroll-smooth"
				aria-label="Scrollable questions container"
				style="will-change: transform;"
			>
				{#if QuestionCard}
					{#each filteredQuestions as q}
						<svelte:component 
							this={QuestionCard}
							{q}
							isHighlighted={highlightedNumbers.includes(q.number)}
							{base}
						/>
					{/each}
				{/if}
			</section>
		</div>

	<!-- ============================== -->
	<!-- ✅ Mobile Layout (Toggleable Sidebar + Questions) -->
	<!-- ============================== -->
	{:else if mobileReady}
		<div class="relative max-w-5xl mx-auto px-0.0 pt-0.0 pb-0 overflow-x-hidden">
			<button
				class={`fixed top-120 z-50 bg-white/70 px-4 py-3 rounded-full shadow transition-transform duration-300 transform ${
				showSidebar ? 'left-[65%] rotate-180' : 'left-0'
				}`}
				on:click={() => (showSidebar = !showSidebar)}
				aria-label="Toggle Sidebar"
			>
				☰
			</button>

			{#if showSidebar}
				<div
					class="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm transition-opacity duration-300"
					role="button"
					tabindex="0"
					on:click={() => (showSidebar = false)}
					on:keydown={(e: KeyboardEvent) => {
						if (e.key === 'Enter' || e.key === ' ') showSidebar = false;
					}}
				></div>
			{/if}

			<Sidebar
				{Tree}
				{treeData}
				mobile
				visible={showSidebar}
				on:sectionclick={(e) => handleSectionClick(e.detail)}
			/>

			<section
				bind:this={questionsContainer}
				class="w-full space-y-3 px-1 pt-1 flex-grow overflow-x-hidden overflow-y-auto max-h-[90vh] scroll-smooth"
				aria-label="Scrollable questions container"
				style="will-change: transform;"
			>
				{#each filteredQuestions as q}
					<QuestionCard 
						{q}
						isHighlighted={highlightedNumbers.includes(q.number)}
						{base}
					/>
				{/each}
			</section>
		</div>
	{/if}
{/if}
<style global>
html,
body {
	height: 100vh;
	overflow: hidden;
}

/* --- Light/Dark class-based theming overrides for nav/sidebar backgrounds --- */
:global(.light) nav.bg-white\/70 {
	background-color: rgba(255, 255, 255, 0.7);
	color: black;
}

:global(.light) .fixed.top-120.bg-white\/70 {
	background-color: rgba(255, 255, 255, 0.7);
	color: black;
}

:global(.light) .fixed.top-\[5\%\].left-0.bg-white\/70 {
	background-color: rgba(255, 255, 255, 0.7);
	color: black;
}

:global(.light) nav.bg-white\/70 .text-white,
:global(.light) nav.bg-white\/70 .fill-white,
:global(.light) nav.bg-white\/70 .stroke-white,
:global(.light) .fixed.top-120.bg-white\/70 .text-white,
:global(.light) .fixed.top-120.bg-white\/70 .fill-white,
:global(.light) .fixed.top-120.bg-white\/70 .stroke-white,
:global(.light) .fixed.top-\[5\%\].left-0.bg-white\/70 .text-white,
:global(.light) .fixed.top-\[5\%\].left-0.bg-white\/70 .fill-white,
:global(.light) .fixed.top-\[5\%\].left-0.bg-white\/70 .stroke-white {
	color: black !important;
	fill: black !important;
	stroke: black !important;
}

@media (prefers-color-scheme: dark) {
	nav.bg-white\/70 {
		background-color: rgba(30, 30, 30, 0.7);
	}

	.fixed.top-120.bg-white\/70 {
		background-color: rgba(30, 30, 30, 0.7);
		color: white;
	}

	.fixed.top-\[5\%\].left-0.bg-white\/70 {
		background-color: rgba(30, 30, 30, 0.7);
	}

	.bg-gray-400 {
		background-color: #888;
	}
}

:global(.dark) nav.bg-white\/70 {
	background-color: rgba(30, 30, 30, 0.7);
}

:global(.dark) .fixed.top-120.bg-white\/70 {
	background-color: rgba(30, 30, 30, 0.7);
}

:global(.dark) .fixed.top-\[5\%\].left-0.bg-white\/70 {
	background-color: rgba(30, 30, 30, 0.7);
}

:global(.dark) .bg-gray-400 {
	background-color: #888;
}

:global(nav.bg-white\/70) {
	color: black;
}

:global(.fixed.top-120.bg-white\/70) {
	color: black;
}

:global(.fixed.top-\[5\%\].left-0.bg-white\/70) {
	color: black;
}

/* Ensure the mobile sidebar toggle icon appears white in dark mode */
:global(.dark .fixed.top-120.bg-white\/70) {
	color: white !important;
}
</style>