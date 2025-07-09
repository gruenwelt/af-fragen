<svelte:head>
  <title>Fragenkatalog – Alle offiziellen Fragen der Amateurfunkprüfung (N, E, A)</title>
  <meta name="description" content="Durchsuche den vollständigen Fragenkatalog zur deutschen Amateurfunkprüfung. Filtere nach Klasse N, E oder A und navigiere durch alle Themenbereiche." />
  <link rel="canonical" href="https://funkfragen.de/fragen" />
  <meta name="keywords" content="Amateurfunk, Prüfungssimulator, Funkprüfung, Klasse N, Klasse E, Klasse A, Prüfungsfragen, Fragenkatalog, Lernapp" />
  <meta property="og:title" content="Fragenkatalog – Funkfragen: Alle offiziellen Prüfungsfragen" />
  <meta property="og:description" content="Der komplette Fragenkatalog für die Amateurfunkprüfung: N, E, A – mit Themenfilter, Navigation und zufälliger Übungsfunktion." />
  <script type="application/ld+json">
    {JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Wie viele Fragen gibt es in der Klasse N?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Es gibt 180 offizielle Prüfungsfragen für die Klasse N."
          }
        },
        {
          "@type": "Question",
          "name": "Ist das die offizielle Datenquelle?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Ja, die Fragen basieren auf dem offiziellen Katalog der Bundesnetzagentur."
          }
        }
      ]
    })}
  </script>
</svelte:head>

<script lang="ts">
	let headerReady = false;
	// --- External Imports ---
	import { onMount, tick } from 'svelte';
	import { page } from '$app/stores';
	import 'katex/dist/katex.min.css';
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import { collectQuestions } from '$lib/utils/questionLoader';

	import fullTree from '$lib/data/tree.json';

	// --- Component Imports ---
	let Tree: typeof import('$lib/components/Tree.svelte').default;
	let QuestionCard: typeof import('$lib/components/QuestionCard.svelte').default;

	onMount(() => {
		const checkMobile = () => {
			isMobile = window.innerWidth <= 768;
		};

		checkMobile();

		if (!new URLSearchParams(window.location.search).has('class')) {
			const currentParams = new URLSearchParams(window.location.search);
			currentParams.set('class', '1');
			const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
			window.history.replaceState({}, '', newUrl);
		}

		window.addEventListener('resize', checkMobile);

		const load = async () => {
			if (browser && isMobile) {
				setTimeout(() => {
					mobileReady = true;
				}, 100);
			} else {
				mobileReady = true;
			}
		};
		load();

		setTimeout(() => {
			headerReady = true;
		}, 0);

		(async () => {
			const [{ default: TreeModule }, { default: QuestionCardModule }] = await Promise.all([
				import('$lib/components/Tree.svelte'),
				import('$lib/components/QuestionCard.svelte')
			]);
			Tree = TreeModule;
			QuestionCard = QuestionCardModule;
		})();

		return () => window.removeEventListener('resize', checkMobile);
	});

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

	const questions: Question[] = $page.data?.fragenkatalog?.sections
		? collectQuestions($page.data.fragenkatalog.sections)
		: [];

	// Filtered questions based on class query param (browser only after hydration)
	let filteredQuestions: Question[] = [];
	let isLoading = false;

	$: if (browser && $page.url) {
		const c = $page.url.searchParams.get('class') ?? '1';
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

	let isMobile = false;
	let mobileReady = false;

	onMount(() => {
		const checkMobile = () => {
			isMobile = window.innerWidth <= 768;
		};

		checkMobile();

		// ✅ Enforce default class=1 if none present
		const currentParams = new URLSearchParams(window.location.search);
		if (!currentParams.has('class')) {
			currentParams.set('class', '1');
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
	{#if !isMobile && mobileReady}
		<div class="flex max-w-5xl mx-auto p-4 gap-4 overflow-x-hidden flex-grow overflow-auto">
			<!-- Sidebar: Navigation tree -->
			<nav
				class="w-[35%] rounded-lg p-4 max-h-[80vh] overflow-y-auto bg-white/70"
				aria-label="Left sidebar navigation menu"
			>
				{#if Tree}
					<Tree
						nodes={treeData}
						level={1}
						on:sectionclick={(e: CustomEvent<any>) => handleSectionClick(e.detail)}
					/>
				{/if}	
			</nav>

			<!-- Questions container -->
			<section
				bind:this={questionsContainer}
				class="w-[65%] space-y-6 max-h-[80vh] overflow-y-auto overflow-x-hidden"
				aria-label="Scrollable questions container"
			>
				{#if QuestionCard}
					{#each filteredQuestions as q}
						<svelte:component 
							this={QuestionCard}
							{q}
							isHighlighted={highlightedNumbers.includes(q.number)}
							{isLongAnswer}
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

			<div
				class={`fixed top-[5%] left-0 h-full w-[70%] max-h-[90%] rounded-2xl z-40 p-4 bg-white/70 overflow-y-auto shadow-lg transform transition-transform duration-300 ${
					showSidebar ? 'translate-x-0' : '-translate-x-full'
				}`}
			>
				<Tree
					nodes={treeData}
					level={1}
					on:sectionclick={(e: CustomEvent<any>) => handleSectionClick(e.detail)}
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