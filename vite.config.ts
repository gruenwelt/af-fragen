import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		devtoolsJson()
	],
	build: {
		rollupOptions: {
		output: {
			manualChunks: {
				questionCard: ['src/lib/components/QuestionCard.svelte'],
				Tree: ['src/lib/components/Tree.svelte'],
				treeFilter: ['src/lib/utils/treeFilter.ts'],
				questionLoader: ['src/lib/utils/questionLoader.ts']
			}
		}
		}
	}
});
