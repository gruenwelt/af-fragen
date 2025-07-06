<svelte:head>
	<!-- ============================== -->
	<!-- ✅ Head Metadata               -->
	<!-- ============================== -->
	<title>Fragenkatalog</title>
	<meta name="description" content="Prüfungsfragen zum Erwerb von Amateurfunkprüfungsbescheinigungen" />
</svelte:head>

<script lang="ts">
	// --- External Imports ---
	import { onMount, tick } from 'svelte';
	import { page } from '$app/stores';
	import 'katex/dist/katex.min.css';
	import { base } from '$app/paths';
	import { browser } from '$app/environment';

	// --- Data Imports ---
	import data from '$lib/data/fragenkatalog3b_prerendered.json';
	import fullTree from '$lib/data/tree.json';

	// --- Component Imports ---
	import Tree from '$lib/components/Tree.svelte';
	import QuestionCard from '$lib/components/QuestionCard.svelte';

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

	// --- Component Setup ---

	/**
	 * Recursively collects all questions from nested sections, attaching section header titles.
	 */
	function collectQuestions(sections: any[], path: string[] = []): Question[] {
		let questions: Question[] = [];
		for (const section of sections) {
			const currentPath = [...path, section.title];
			if (section.questions) {
				questions.push(
					...section.questions.map((q: any) => ({
						question: q.question,
						questionHtml: q.questionHtml,
						answer_a: q.answer_a,
						answerAHtml: q.answerAHtml,
						answer_b: q.answer_b,
						answerBHtml: q.answerBHtml,
						answer_c: q.answer_c,
						answerCHtml: q.answerCHtml,
						answer_d: q.answer_d,
						answerDHtml: q.answerDHtml,
						class: q.class,
						picture_question: q.picture_question,
						picture_a: q.picture_a,
						picture_b: q.picture_b,
						picture_c: q.picture_c,
						picture_d: q.picture_d,
						number: q.number,
						section1: (currentPath[0] || '').replace('Prüfungsfragen im Prüfungsteil: ', ''),
						section2: currentPath[1] || '',
						section3: currentPath[2] || ''
					}))
				);
			}
			if (section.sections) {
				questions.push(...collectQuestions(section.sections, currentPath));
			}
		}
		return questions;
	}

	// --- Utility Functions ---

	/**
	 * Determines if a question has any long answers (by length or images).
	 * Uses 2×2 layout for images on desktop, 4×1 on mobile.
	 */
	function isLongAnswer(q: Question): boolean {
		const threshold = isMobile ? 12 : 60;
		const hasLongText = [q.answer_a, q.answer_b, q.answer_c, q.answer_d].some(
			(a) => a.length > threshold
		);
		const hasImages = !!(q.picture_a || q.picture_b || q.picture_c || q.picture_d);
		return hasLongText || (isMobile && hasImages);
	}

	// --- State & Reactive Vars ---

	let questions: Question[] = collectQuestions(data.sections);

	// Filtered questions based on class query param (browser only after hydration)
	let filteredQuestions: Question[] = [];
	let isLoading = false;

	$: if (browser && $page.url) {
		const c = $page.url.searchParams.get('class') || 'Alle';
		isLoading = true;

		let target: Question[];
		if (c === '1' || c === '2' || c === '3') {
			target = questions.filter((q) => q.class === c);
		} else if (c === 'Alle') {
			target = questions;
		} else {
			target = [];
		}

		setTimeout(() => {
			filteredQuestions = target;
			isLoading = false;
		}, 300);
	}

	// Selected class for tree filtering
	$: selectedClass = browser ? $page.url.searchParams.get('class') || 'Alle' : 'Alle';

	// Tree data filtered by selected class
	$: treeData = (() => {
		function filterTreeByClass(nodes: any[], selectedClass: string): any[] {
			if (!nodes) return [];

			return nodes
				.map((node: any) => {
					if (selectedClass === 'Alle' || (node.classes && node.classes.includes(selectedClass))) {
						return {
							...node,
							sections: filterTreeByClass(node.sections, selectedClass)
						};
					}
					return null;
				})
				.filter(Boolean);
		}

		return filterTreeByClass(fullTree, selectedClass);
	})();

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

	let isMobile = false;
	let mobileReady = false;

	onMount(() => {
		const checkMobile = () => {
			isMobile = window.innerWidth <= 768;
		};

		checkMobile();

		// ✅ Enforce default class=Alle if none present
		const currentParams = new URLSearchParams(window.location.search);
		if (!currentParams.has('class')) {
			currentParams.set('class', 'Alle');
			const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
			window.history.replaceState({}, '', newUrl);
		}

		window.addEventListener('resize', checkMobile);

		if (browser && isMobile) {
			setTimeout(() => {
				mobileReady = true;
			}, 100); // simulate delay to ensure DOM is mounted
		} else {
			mobileReady = true;
		}

		return () => window.removeEventListener('resize', checkMobile);
	});

	let showSidebar = false;

	// --- Highlighted Questions ---
	let highlightedNumbers: string[] = [];

</script>

{#if isLoading}
	<div class="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
		<div class="w-4 h-4 bg-gray-400 rounded-full animate-pulse"></div>
	</div>
{:else}
	<!-- ============================== -->
	<!-- ✅ Desktop Layout (Sidebar + Questions) -->
	<!-- ============================== -->
	{#if !isMobile && mobileReady}
		<div class="flex max-w-5xl mx-auto p-4 gap-4 overflow-x-hidden flex-grow overflow-auto">
			<!-- Sidebar: Navigation tree -->
			<nav
				class="w-[35%] rounded-lg p-4 max-h-[80vh] overflow-y-auto bg-white/70"
				aria-label="Left sidebar navigation menu"
			>
				<Tree
					nodes={treeData}
					level={1}
					on:sectionclick={(e: CustomEvent<any>) => {
						const node = e.detail;

						if (!node.question_numbers || node.question_numbers.length === 0) {
							highlightedNumbers = [];
							return;
						}

						highlightedNumbers = node.question_numbers || [];

						let first;
						first = node.question_numbers.find((qn: string) =>
							(filteredQuestions.length > 0 ? filteredQuestions : questions).some(q => q.number === qn)
						);
						if (first) {
							scrollToQuestion(first);
						} else {
							return;
						}
					}}
				/>
			</nav>

			<!-- Questions container -->
			<section
				bind:this={questionsContainer}
				class="w-[65%] space-y-6 max-h-[80vh] overflow-y-auto overflow-x-hidden"
				aria-label="Scrollable questions container"
			>
				{#each filteredQuestions as q}
					<QuestionCard 
						{q}
						isHighlighted={highlightedNumbers.includes(q.number)}
						{isLongAnswer}
						{base}
					/>
				{/each}
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

			<div
				class={`fixed top-[5%] left-0 h-full w-[70%] max-h-[90%] rounded-2xl z-40 p-4 bg-white/70 overflow-y-auto shadow-lg transform transition-transform duration-300 ${
					showSidebar ? 'translate-x-0' : '-translate-x-full'
				}`}
			>
				<Tree
					nodes={treeData}
					level={1}
					on:sectionclick={(e: CustomEvent<any>) => {
						const node = e.detail;

						if (!node.question_numbers || node.question_numbers.length === 0) {
							highlightedNumbers = [];
							return;
						}

						highlightedNumbers = node.question_numbers || [];

						let first;
						first = node.question_numbers.find((qn: string) =>
							(filteredQuestions.length > 0 ? filteredQuestions : questions).some(q => q.number === qn)
						);
						if (first) {
							scrollToQuestion(first);
							// showSidebar = false; // Prevent sidebar from hiding after Tree click
						} else {
							return;
						}
					}}
				/>
			</div>

			<section
				bind:this={questionsContainer}
				class="w-full space-y-3 px-1 pt-1 flex-grow overflow-x-hidden overflow-y-auto max-h-[90vh]"
				aria-label="Scrollable questions container"
			>
				{#each filteredQuestions as q}
					<QuestionCard 
						{q}
						isHighlighted={highlightedNumbers.includes(q.number)}
						{isLongAnswer}
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
</style>