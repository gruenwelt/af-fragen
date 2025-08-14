<script lang="ts">
	let headerReady = false;
	// --- External Imports ---
import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
import { onMount, tick } from 'svelte';
import { page } from '$app/stores';
import { derived } from 'svelte/store';
import { browser } from '$app/environment';
const showNoIndex = derived(page, ($page) => {
  // Guard: don't access searchParams when not in browser (e.g. during prerender)
  if (!browser) return false;
  return $page.url.searchParams.has('class');
});
$: showNoIndexTag = $showNoIndex
  ? `<meta name="robots" content="noindex" />`
  : '';
import { base } from '$app/paths';
	import { collectQuestions } from '$lib/utils/questionLoader';
	import { filterQuestionsByClass } from '$lib/utils/filterByClass';

	import fullTree from '$lib/data/tree.json';

	// --- Component Imports ---
	let QuestionCard: typeof import('$lib/components/QuestionCard.svelte').default;
	let Sidebar: typeof import('$lib/components/Sidebar.svelte').default;

import PdfPanel from '$lib/components/PdfPanel.svelte';

import { isMobile } from '$lib/stores/device';
import { get } from 'svelte/store';

import SeoHead from '$lib/components/SeoHead.svelte';

onMount(() => {
	console.log('[Debug] onMount - Checking prefers-color-scheme');
	if (browser && window.matchMedia) {
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		console.log('[Debug] prefers-color-scheme: ', prefersDark ? 'dark' : 'light');
	}
	initializeState();
	loadComponents();
});

async function loadComponents() {
	const [QuestionCardModule, SidebarModule] = await Promise.all([
		import('$lib/components/QuestionCard.svelte'),
		import('$lib/components/Sidebar.svelte')
	]);
	QuestionCard = QuestionCardModule.default;
	Sidebar = SidebarModule.default;
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

	if ($page.data?.fragenkatalog?.sections) {
		questions = collectQuestions($page.data.fragenkatalog.sections);
	} else {
		const module = await import('$lib/data/fragenkatalog3b_prerendered.json');
		questions = collectQuestions(module.default.sections);
	}
}

	// --- Types ---
	import type { Question } from '$lib/types';

	// --- Utility Functions ---


	// --- State & Reactive Vars ---

	let questions: Question[] = [];

	// Filtered questions based on class query param (browser only after hydration)
	let filteredQuestions: Question[] = [];
	let isLoading = false;

	$: if (browser && $page.url) {
		const c = $page.url.searchParams.get('class') ?? 'V';
		isLoading = true;

		const target = filterQuestionsByClass(questions, c);

		setTimeout(() => {
			filteredQuestions = target;
			isLoading = false;
		}, 300);
	}

	// Selected class for tree filtering
	$: selectedClass = browser ? $page.url.searchParams.get('class') ?? 'V' : 'V';

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

let showSidebar = false; // initially false, triggered reactively later
// Show sidebar only after filteredQuestions are rendered, and only on desktop
$: if (!showSidebar && questionsContainer && filteredQuestions.length > 0 && !$isMobile) {
  tick().then(() => {
    requestAnimationFrame(() => {
      showSidebar = true;
    });
  });
}

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

<SeoHead />

{#if isLoading}
	<LoadingSpinner />
{:else if headerReady}
	<PdfPanel title="Hilfsmittel" />
	{#if !$isMobile && mobileReady}
		<div class="flex max-w-5xl mx-auto p-4 gap-4 overflow-x-hidden flex-grow overflow-auto">
			{#if Sidebar && showSidebar}
				<svelte:component
					this={Sidebar}
					{treeData}
					on:sectionclick={(e) => handleSectionClick(e.detail)}
				/>
			{/if}

			<section
				bind:this={questionsContainer}
				class="w-[65%] space-y-6 max-h-[90vh] overflow-y-auto overflow-x-hidden scroll-smooth"
				aria-label="Scrollable questions container"
			>
				{#if QuestionCard}
					{#each filteredQuestions as q}
						<svelte:component 
							this={QuestionCard}
							{q}
							isHighlighted={highlightedNumbers.includes(q.number)}
							{base}
							selectedAnswerIndex={0}
							correctIndex={0}
						/>
					{/each}
				{/if}
			</section>
		</div>
	{:else if mobileReady}
		<div class="relative max-w-5xl mx-auto px-0 pt-0 pb-0 overflow-x-hidden overflow-hidden h-screen">
			{#if Sidebar}
				<svelte:component
					this={Sidebar}
					{treeData}
					mobile
					visible={showSidebar}
					on:sectionclick={(e) => handleSectionClick(e.detail)}
					on:toggle={() => (showSidebar = !showSidebar)}
					on:close={() => (showSidebar = false)}
				/>
			{/if}

			<section
				bind:this={questionsContainer}
				class="w-full space-y-6 max-h-[90vh] overflow-y-auto overflow-x-hidden scroll-smooth px-1 pt-1 flex-grow"
				aria-label="Scrollable questions container"
			>
				{#each filteredQuestions as q}
					<QuestionCard 
						{q}
						isHighlighted={highlightedNumbers.includes(q.number)}
						{base}
						selectedAnswerIndex={0}
						correctIndex={0}
					/>
				{/each}
			</section>
		</div>
	{/if}
{/if}

<style>
  :global(html.dark ::-webkit-scrollbar) {
    width: 8px;
  }

  :global(html.dark ::-webkit-scrollbar-thumb) {
    background-color: #fff;
    border-radius: 4px;
  }

  :global(html.dark ::-webkit-scrollbar-track) {
    background-color: #222;
  }

  :global(html.light ::-webkit-scrollbar) {
    width: 8px;
  }

  :global(html.light ::-webkit-scrollbar-thumb) {
    background-color: #bbb;
    border-radius: 4px;
  }

  :global(html.light ::-webkit-scrollbar-track) {
    background-color: #eee;
  }

  /* Firefox scrollbar support */
  :global(html.dark),
  :global(html.light) {
    scrollbar-width: thin;
  }

  :global(html.dark) {
    scrollbar-color: #fff #222;
  }

  :global(html.light) {
    scrollbar-color: #bbb #eee;
  }
</style>