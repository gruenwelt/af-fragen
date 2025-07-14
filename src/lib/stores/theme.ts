import { writable } from 'svelte/store';

const STORAGE_KEY = 'dark-mode';

const initial = (() => {
	if (typeof localStorage !== 'undefined') {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored !== null) return stored === 'true';
		return true; // default to dark mode
	}
	return true; // default to dark mode
})();

export const isDarkMode = writable(initial);

isDarkMode.subscribe((value) => {
	if (typeof document !== 'undefined') {
		document.documentElement.classList.toggle('dark', value);
		localStorage.setItem(STORAGE_KEY, String(value));
	}
});