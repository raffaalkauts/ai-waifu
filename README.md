# AI Waifu Chat

A production-ready AI chat webapp with anime-themed characters, persistent conversations, and automatic summarization. Built with Vite + React + TypeScript + Tailwind CSS.

https://github.com/user-attachments/assets/placeholder-screenshot

## Features

- **3 Default Characters** — Mika (tsundere), Yuki (kuudere), Sakura (deredere) with full backstories and catchphrases
- **Custom Characters** — Create your own waifu with emoji avatars, personality type, interests, and system prompt
- **Persistent Chat** — All messages stored in IndexedDB via Dexie; conversations survive page refreshes
- **Auto-Summarization** — After 15+ messages, older messages get compressed into a summary to stay within token limits
- **Token Budget Tracking** — 100K token/month limit with visual progress bar and 80K warning threshold
- **Export & Import** — Backup conversations as JSON or plain text; restore from JSON files
- **Dark / Light Mode** — Toggle via sun/moon button, persists preference, defaults to system setting
- **Mobile Responsive** — Adaptive grid, compact token bar on mobile, full controls on desktop
- **OpenRouter API** — Uses the free `meta-llama/llama-3.1-8b-instruct` model (no local GPU required)

## Prerequisites

- Node.js 18+
- npm (or pnpm / yarn)
- An [OpenRouter](https://openrouter.ai) account (free tier available)

## Getting Started

```bash
# 1. Clone the repository
git clone <repo-url>
cd ai-waifu

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your OpenRouter API key
```

### Getting an OpenRouter API Key

1. Go to [openrouter.ai/keys](https://openrouter.ai/keys)
2. Sign in (or create a free account)
3. Click "Create Key"
4. Copy the key (starts with `sk-or-v1-`)
5. Paste it into `.env.local`:
   ```
   VITE_OPENROUTER_API_KEY=sk-or-v1-your-key-here
   ```

The default model is `google/gemma-4-31b-it:free`. To change the model, set `VITE_OPENROUTER_MODEL` in `.env.local`. Browse all models at [openrouter.ai/models](https://openrouter.ai/models).

Popular free models (2026):

| Model | Notes |
|---|---|
| `google/gemma-4-31b-it:free` | **Default** — 31B, strong all-rounder, 256K context |
| `google/gemma-4-26b-a4b-it:free` | 26B MoE, multimodal (text+image), lightweight |
| `deepseek/deepseek-r1:free` | Reasoning, math, coding — GPT-4 class |
| `meta-llama/llama-4-maverick:free` | 1M context, vision support |

### Run in Development

```bash
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm run preview
```

The production build is output to the `dist/` directory and can be deployed to any static host (Vercel, Netlify, Cloudflare Pages, etc.).

## Project Structure

```
src/
├── api/           # OpenRouter API client
├── components/    # UI components (ChatWindow, CharacterSelect, etc.)
├── data/          # Default character definitions
├── db/            # IndexedDB schema & operations (Dexie)
├── hooks/         # React hooks (useWaifuChat, useDarkMode)
├── store/         # Zustand state management
├── types/         # TypeScript type re-exports
├── utils/         # Export, summarization, token tracking
└── App.tsx        # Root component
```

## Tech Stack

| Tool | Purpose |
|---|---|
| **Vite 5** | Build tool & dev server |
| **React 18** | UI framework |
| **TypeScript** | Type safety (strict mode) |
| **Tailwind CSS 3** | Styling & responsive design |
| **Dexie** | IndexedDB wrapper for persistent storage |
| **Zustand** | Lightweight state management |
| **Axios** | HTTP client for OpenRouter API |

## Screenshots

| Screen | Description |
|---|---|
| **Character Select** | Grid of available characters with avatars, personality tags, and "Chat now" buttons. Create Character card at the end. Theme toggle in top-right. Token budget at bottom. |
| **Chat View** | Messages in bubble layout (user right, assistant left). Typing indicator. Input field with send button. Header has character info, theme toggle, and overflow menu (export/import/clear). |
| **Create Character** | Modal form with emoji avatar picker, personality selector, interests tags, and system prompt editor. |
| **Light Mode** | Same screens with white background, gray-900 text, and lighter card borders. |
| **Mobile** | Single-column character grid, compact token bar, floating "+" FAB for character creation, full-width message bubbles. |

## Deployment

### Deploy to Vercel (Recommended)

The app is a static Vite SPA — it deploys to Vercel with zero config.

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "Initial commit"
gh repo create ai-waifu --public --push
# Or manually: create repo on github.com, then:
# git remote add origin https://github.com/<user>/ai-waifu.git
# git push -u origin main
```

2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click **Add New → Project**
4. Import the `ai-waifu` repository
5. Under **Environment Variables**, add:

   | Name | Value |
   |---|---|
   | `VITE_OPENROUTER_API_KEY` | `sk-or-v1-...` (your key) |
   | `VITE_OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1` |
   | `VITE_OPENROUTER_MODEL` | `google/gemma-4-31b-it:free` (optional) |

6. Click **Deploy** — Vercel auto-detects Vite and uses the correct build command (`npm run build`) and output directory (`dist`)
7. Once deployed, Vercel gives you a URL like `https://ai-waifu.vercel.app`

### Post-Deploy Checklist

- [ ] Chat sends messages and gets responses
- [ ] Characters load from IndexedDB
- [ ] Dark/light mode toggle works
- [ ] Export/import functions work
- [ ] No CORS or mixed-content errors in console

### Other Hosting Options

Any static host works (Netlify, Cloudflare Pages, GitHub Pages). Build with `npm run build` and deploy the `dist/` folder. Set the same environment variables in the hosting dashboard.

## Test Checklist

- [x] Chat works end-to-end (send → API → receive → persist)
- [x] Characters load from IndexedDB (seeded on first run)
- [x] Messages persist across page refreshes
- [x] Auto-summarization triggers after 15 messages
- [x] Mobile responsive (single column, compact UI)
- [x] No console errors
- [x] Dark / light mode toggle works and persists
- [x] Export as JSON downloads valid file
- [x] Import JSON restores conversation
- [x] Custom character creation saves and navigates to chat

## License

MIT
