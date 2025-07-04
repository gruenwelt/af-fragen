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
	import katex from 'katex';
	import 'katex/dist/katex.min.css';
	import { base } from '$app/paths';
	import { browser } from '$app/environment';

	// --- Data Imports ---
	import data from '$lib/data/fragenkatalog3b.json';
	import fullTree from '$lib/data/tree_combined.json';

	// --- Component Imports ---
	import Tree from '$lib/components/Tree.svelte';
	import KatexRenderer from '$lib/components/KatexRenderer.svelte';

	// --- Types ---
	type Question = {
		question: string;
		answer_a: string;
		answer_b: string;
		answer_c: string;
		answer_d: string;
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
						answer_a: q.answer_a,
						answer_b: q.answer_b,
						answer_c: q.answer_c,
						answer_d: q.answer_d,
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

	// --- Event Handlers ---
	// Tree section click handlers are inline in markup, using scrollToQuestion and filteredQuestions

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
						const currentClass = $page.url.searchParams.get('class') || 'Alle';

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
					<article
						data-question-id={q.number}
						class={`border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200 bg-white/70 ${
							highlightedNumbers.includes(q.number)
								? '[border-color:var(--color-theme-1)]'
								: 'border-gray-300'
						}`}
						aria-label="Question and answers"
					>
						<div class="text-center">
							<KatexRenderer latexString={q.question} />
						</div>
						{#if q.picture_question}
							<div class="mb-2"></div>
							<div class="flex justify-center mb-5">
								<img src={`${base}/svgs/${q.picture_question}.svg`} alt="Bild zur Frage" class="max-h-48" />
							</div>
						{:else}
							<div class="mb-5"></div>
						{/if}
						<div class={isLongAnswer(q) ? "flex flex-col gap-3" : "grid grid-cols-2 gap-3"}>
							<div class="border border-gray-300 rounded-lg p-3 min-h-[1rem] flex items-center justify-center text-gray-700">
								{#if q.picture_a}
									<img src={`${base}/svgs/${q.picture_a}.svg`} alt="Bild Antwort A" class="max-h-24 mx-auto" />
								{:else}
									<KatexRenderer latexString={q.answer_a} />
								{/if}
							</div>
							<div class="border border-gray-300 rounded-lg p-3 min-h-[1rem] flex items-center justify-center text-gray-700">
								{#if q.picture_b}
									<img src={`${base}/svgs/${q.picture_b}.svg`} alt="Bild Antwort B" class="max-h-24 mx-auto" />
								{:else}
									<KatexRenderer latexString={q.answer_b} />
								{/if}
							</div>
							<div class="border border-gray-300 rounded-lg p-3 min-h-[1rem] flex items-center justify-center text-gray-700">
								{#if q.picture_c}
									<img src={`${base}/svgs/${q.picture_c}.svg`} alt="Bild Antwort C" class="max-h-24 mx-auto" />
								{:else}
									<KatexRenderer latexString={q.answer_c} />
								{/if}
							</div>
							<div class="border border-gray-300 rounded-lg p-3 min-h-[1rem] flex items-center justify-center text-gray-700">
								{#if q.picture_d}
									<img src={`${base}/svgs/${q.picture_d}.svg`} alt="Bild Antwort D" class="max-h-24 mx-auto" />
								{:else}
									<KatexRenderer latexString={q.answer_d} />
								{/if}
							</div>
						</div>
						<footer class="mt-4 text-[0.6rem] text-gray-500 italic text-center">
							{q.number} – {q.section1}; {q.section2}; {q.section3}
						</footer>
					</article>
				{/each}
			</section>
		</div>

	<!-- ============================== -->
	<!-- ✅ Mobile Layout (Toggleable Sidebar + Questions) -->
	<!-- ============================== -->
	{:else if mobileReady}
		<div class="relative max-w-5xl mx-auto p-4 overflow-x-hidden flex-grow h-screen overflow-hidden">
			<button
				class={`fixed top-13 z-50 bg-white/70 px-2 py-1 rounded transition-transform duration-300 transform ${
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
						const currentClass = $page.url.searchParams.get('class') || 'Alle';

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

			<div bind:this={questionsContainer} class="overflow-y-auto max-h-[90vh]">
				<section
					class="w-full space-y-6 flex-grow overflow-x-hidden"
					aria-label="Scrollable questions container"
				>
					{#each filteredQuestions as q}
						<article
							data-question-id={q.number}
							class={`border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200 bg-white/70 ${
								highlightedNumbers.includes(q.number)
									? '[border-color:var(--color-theme-1)]'
									: 'border-gray-300'
							}`}
							aria-label="Question and answers"
						>
							<div class="text-center">
								<KatexRenderer latexString={q.question} />
							</div>
							{#if q.picture_question}
								<div class="mb-2"></div>
								<div class="flex justify-center mb-5">
									<img src={`${base}/svgs/${q.picture_question}.svg`} alt="Bild zur Frage" class="max-h-48" />
								</div>
							{:else}
								<div class="mb-5"></div>
							{/if}
							<div class={isLongAnswer(q) ? "flex flex-col gap-3" : "grid grid-cols-2 gap-3"}>
								<div class="border border-gray-300 rounded-lg p-3 min-h-[1rem] flex items-center justify-center text-gray-700">
									{#if q.picture_a}
										<img src={`${base}/svgs/${q.picture_a}.svg`} alt="Bild Antwort A" class="max-h-24 mx-auto" />
									{:else}
										<KatexRenderer latexString={q.answer_a} />
									{/if}
								</div>
								<div class="border border-gray-300 rounded-lg p-3 min-h-[1rem] flex items-center justify-center text-gray-700">
									{#if q.picture_b}
										<img src={`${base}/svgs/${q.picture_b}.svg`} alt="Bild Antwort B" class="max-h-24 mx-auto" />
									{:else}
										<KatexRenderer latexString={q.answer_b} />
									{/if}
								</div>
								<div class="border border-gray-300 rounded-lg p-3 min-h-[1rem] flex items-center justify-center text-gray-700">
									{#if q.picture_c}
										<img src={`${base}/svgs/${q.picture_c}.svg`} alt="Bild Antwort C" class="max-h-24 mx-auto" />
									{:else}
										<KatexRenderer latexString={q.answer_c} />
									{/if}
								</div>
								<div class="border border-gray-300 rounded-lg p-3 min-h-[1rem] flex items-center justify-center text-gray-700">
									{#if q.picture_d}
										<img src={`${base}/svgs/${q.picture_d}.svg`} alt="Bild Antwort D" class="max-h-24 mx-auto" />
									{:else}
										<KatexRenderer latexString={q.answer_d} />
									{/if}
								</div>
							</div>
							<footer class="mt-4 text-[0.6rem] text-gray-500 italic text-center">
								{q.number} – {q.section1}; {q.section2}; {q.section3}
							</footer>
						</article>
					{/each}
				</section>
			</div>
		</div>
	{/if}
{/if}