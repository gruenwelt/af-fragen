import { writable } from 'svelte/store';

const STORAGE_KEY = 'dark-mode';

const initial = (() => {
	if (typeof localStorage !== 'undefined') {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored !== null) return stored === 'true';
		return false; // default to light mode
	}
	return false; // default to light mode
})();

export const isDarkMode = writable(initial);

isDarkMode.subscribe((value) => {
	if (typeof document !== 'undefined') {
		document.documentElement.classList.toggle('dark', value);
		document.documentElement.classList.toggle('light', !value);
		localStorage.setItem(STORAGE_KEY, String(value));
	}
});