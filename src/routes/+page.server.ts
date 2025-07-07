export const prerender = true;

import { redirect } from '@sveltejs/kit';

export function load() {
	throw redirect(307, '/af-fragen/ueben?class=1');
}