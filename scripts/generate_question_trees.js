import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceFile = path.resolve(__dirname, "../src/lib/data/fragenkatalog3b.json");
const outputFile = path.resolve(__dirname, "../src/lib/data/tree_combined.json");

function loadData() {
  const jsonData = fs.readFileSync(sourceFile, "utf8");
  return JSON.parse(jsonData);
}

// Get unique classes from questions inside a node
function getClasses(questions) {
  const classesSet = new Set();
  for (const q of questions) {
    if (q.class) classesSet.add(q.class);
  }
  return Array.from(classesSet);
}

function buildTreeCombined(sections) {
  const tree = [];
  for (const level1 of sections) {
    const prefix = "Prüfungsfragen im Prüfungsteil: ";
    let level1Title = level1.title;
    if (level1Title.startsWith(prefix)) {
      level1Title = level1Title.substring(prefix.length).trim();
    }

    const level1Node = {
      title: level1Title,
      total_questions: 0,
      classes: [],
      sections: [],
    };

    for (const level2 of level1.sections || []) {
      const level2Node = {
        title: level2.title,
        total_questions: 0,
        classes: [],
        sections: [],
      };

      for (const level3 of level2.sections || []) {
        const questions = level3.questions || [];
        const classes = getClasses(questions);

        const level3Node = {
          title: level3.title,
          total_questions: questions.length,
          classes: classes,
          question_numbers: questions.map((q) => q.number),
        };

        // Accumulate classes and question counts for level2
        level2Node.sections.push(level3Node);
        level2Node.total_questions += questions.length;
        level2Node.classes = Array.from(new Set([...level2Node.classes, ...classes]));
      }

      // Accumulate classes and question counts for level1
      level1Node.sections.push(level2Node);
      level1Node.total_questions += level2Node.total_questions;
      level1Node.classes = Array.from(new Set([...level1Node.classes, ...level2Node.classes]));
    }

    tree.push(level1Node);
  }
  return tree;
}

function saveJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  console.log(`Saved: ${filePath}`);
}

function main() {
  const data = loadData();
  const combinedTree = buildTreeCombined(data.sections);
  saveJSON(outputFile, combinedTree);
  console.log("Combined tree JSON file generated.");
}

main();