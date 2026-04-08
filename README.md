# CXology — The Post-Sale Operating System
### Interactive Book Hub · GitHub Pages Site

---

## 🚀 Deploy to GitHub Pages (Step-by-Step)

### Step 1: Clone your repo locally
```bash
git clone https://github.com/TimConder79/cxology-the-post-sale-operating-system.git
cd cxology-the-post-sale-operating-system
```

### Step 2: Copy the site files into the repo
Copy these 4 files into the root of your repo:
- `index.html`
- `style.css`
- `frameworks.html`
- `chapter.html`

### Step 3: Commit and push
```bash
git add .
git commit -m "Add CXology interactive book hub"
git push origin main
```

### Step 4: Enable GitHub Pages
1. Go to your repo on GitHub: https://github.com/TimConder79/cxology-the-post-sale-operating-system
2. Click **Settings** (top menu)
3. Click **Pages** (left sidebar)
4. Under **Source**, select **Deploy from a branch**
5. Set Branch to **main** and folder to **/ (root)**
6. Click **Save**

### Step 5: Your site will be live at:
```
https://TimConder79.github.io/cxology-the-post-sale-operating-system/
```
(takes ~2 minutes to go live after enabling Pages)

---

## 📁 Site Structure

```
/
├── index.html          ← Main homepage (hero, chapter nav, ROI calc, plays grid)
├── style.css           ← All styles (shared across all pages)
├── frameworks.html     ← Interactive frameworks (maturity, pipeline, 5 questions, value blocks, health score, capacity)
├── chapter.html        ← Dynamic chapter reader (all 22 chapters, driven by ?ch=N URL param)
└── README.md           ← This file
```

## 🎯 What's in the Site

### Homepage (index.html)
- Hero section with key stats
- All 4 Parts with chapter links
- Framework cards linking to interactive tools
- NRR Impact Calculator (fully interactive)
- All 8 Lifecycle Plays

### Frameworks Hub (frameworks.html)
- **CS Maturity Curve** — Reactive/Proactive/Strategic tabs with traits and metrics
- **IKT Framework** — Four-question cards
- **Post-Sales Pipeline** — Five clickable stages with actions and best practices
- **The Five Questions** — Expandable accordion with insights and purpose for each question
- **Value Blocks** — Interactive checklist with progress tracking
- **5-Step Insights Formula** — Visual breakdown with example Win Report
- **Health Score Matrix** — Full weighted scoring table
- **Capacity Planning Calculator** — Interactive sliders showing utilization status

### Chapter Reader (chapter.html)
- All 22 chapters with full content
- Reading progress bar
- Previous/Next navigation
- Callout boxes for key principles
- Links to related interactive frameworks

---

Built by Tim Conder · CXology · 2026
