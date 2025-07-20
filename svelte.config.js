import preprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-static';
import path from 'path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: preprocess(),
	kit: {
		adapter: adapter({
			fallback: 'index.html'
		}),
		alias: {
			$lib: path.resolve('src/lib')
		},
		paths: {
			base: ''
		},
		prerender: {
			entries: ['*', '/', '/offline.html']
		}
	}
};

export default config;