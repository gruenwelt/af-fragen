import { VitePWA } from 'vite-plugin-pwa';
import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import adapter from '@sveltejs/adapter-static';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		devtoolsJson(),
		VitePWA({
			registerType: 'autoUpdate',
			workbox: {
				maximumFileSizeToCacheInBytes: 3145728,
				globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json,txt}']
			},
			includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
			manifest: {
				name: 'Funkfragen.de',
				short_name: 'Funkfragen',
				description: 'Trainiere mit Fragen zur deutschen Amateurfunkprüfung (N, E, A, B, V).',
				id: '/',
				lang: 'de',
				orientation: 'portrait',
				theme_color: '#0f172a',
				background_color: '#ffffff',
				display: 'standalone',
				scope: '/',
				start_url: '/',
				icons: [
					{
						src: 'pwa-192x192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: 'pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png'
					},
					{
						src: 'pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any maskable'
					}
				],
				screenshots: [
					{
						src: 'screenshots/home-mobile.jpg',
						sizes: '1170x2532',
						type: 'image/jpeg',
						form_factor: 'narrow'
					},
					{
						src: 'screenshots/home-desktop.jpg',
						sizes: '2560x1444',
						type: 'image/jpeg',
						form_factor: 'wide'
					}
				]
			}
		})
	]
});
