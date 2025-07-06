import fs from 'fs';
import katex from 'katex';

const inputPath = './src/lib/data/fragenkatalog3b.json';
const outputPath = './src/lib/data/fragenkatalog3b_prerendered.json';

function escapeHtml(text) {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

function renderMixedKaTeX(input) {
	if (!input) return '';

	const regex = /(\$\$[^$]+\$\$|\$[^$]+\$)/g;
	const parts = input.split(regex).filter(Boolean);

	return parts.map(part => {
		if (/^\$\$.*\$\$$/.test(part)) {
			const content = part.slice(2, -2);
			try {
				return katex.renderToString(content, {
					throwOnError: false,
					displayMode: true,
					strict: "ignore"
				});
			} catch {
				return escapeHtml(part);
			}
		} else if (/^\$.*\$$/.test(part)) {
			const content = part.slice(1, -1);
			try {
				return katex.renderToString(content, {
					throwOnError: false,
					displayMode: false,
					strict: "ignore"
				});
			} catch {
				return escapeHtml(part);
			}
		} else {
			return escapeHtml(part);
		}
	}).join('');
}

function maybeHtml(input) {
	const html = renderMixedKaTeX(input);
	return html.includes('katex') ? html : escapeHtml(input);
}

function renderAllQuestions(data) {
	function processSection(section) {
		if (section.questions) {
			section.questions = section.questions.map(q => ({
				...q,
				questionHtml: maybeHtml(q.question),
				answerAHtml: maybeHtml(q.answer_a),
				answerBHtml: maybeHtml(q.answer_b),
				answerCHtml: maybeHtml(q.answer_c),
				answerDHtml: maybeHtml(q.answer_d)
			}));
		}
		if (section.sections) {
			section.sections = section.sections.map(processSection);
		}
		return section;
	}

	return {
		...data,
		sections: data.sections.map(processSection)
	};
}

function run() {
	const raw = fs.readFileSync(inputPath, 'utf-8');
	const data = JSON.parse(raw);
	const rendered = renderAllQuestions(data);
	fs.writeFileSync(outputPath, JSON.stringify(rendered, null, 2), 'utf-8');
	console.log(`✅ Pre-rendered HTML saved to ${outputPath}`);
}

run();