# amateurfunk-fragenkatalog

Prüfungsfragen zum Erwerb von Amateurfunkprüfungsbescheinigungen

## 🛠️ Lokale Installation

### Voraussetzungen

- [Node.js](https://nodejs.org/) (empfohlen: Version 18 oder höher)
- [Git](https://git-scm.com/)

### Schritte

1. **Repository klonen**

```bash
git clone https://github.com/gruenwelt/af-fragen.git
cd af-fragen
```

2. **Static Adapter installieren**

```bash
npm i -D @sveltejs/adapter-static
```

3. **Abhängigkeiten installieren**

```bash
npm install
```

4. **Lokalen Entwicklungsserver starten**

```bash
npm run dev -- --host 0.0.0.0
```

> Die Anwendung ist dann erreichbar unter: [http://localhost:5173](http://localhost:5173)

### Weitere Befehle

1. **Build für Produktion erzeugen:**
  ```bash
  npm run build
  ```

2. **Generierte Seite lokal ansehen (nach Build):**
  ```bash
  npm run preview -- --host 0.0.0.0
  ```
