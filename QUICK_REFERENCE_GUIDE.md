# 🚀 AI Waifu Chat - Quick Reference Guide

## ⚡ TL;DR (untuk yang terburu-buru)

### Best Stack for Free Tier
```
Frontend:   React 18 + TypeScript + Tailwind CSS
Backend:    Express.js + Node.js (optional, tapi recommended)
Database:   IndexedDB (local) + optional: Firebase
AI Model:   Llama 3.1 8B Instruct (free on OpenRouter)
Cost:       $0/month ✅
Time:       2-4 minggu untuk MVP
```

### Token Budget Calculation
```
Monthly free: ~100K tokens
Per chat: ~400 tokens (dengan context)
Dengan summarization: ~150 tokens (70% reduction)

Result: ~250-600 chats/month = sustainable ✅
```

---

## 📋 Project Setup Checklist

### Week 1: Foundation
```
☐ Create OpenRouter account (free, no credit card)
☐ Generate API key from OpenRouter
☐ Setup React + Vite + TypeScript project
☐ Install dependencies: dexie, axios, zustand, tailwindcss
☐ Create .env.local dengan API key
☐ Test OpenRouter API connection
```

### Week 2: Core Features
```
☐ Implement IndexedDB database schema
☐ Create chat hook (useWaifuChat)
☐ Build ChatWindow component
☐ Test character personality system
☐ Implement message storage
```

### Week 3: Memory & Optimization
```
☐ Implement summarization algorithm
☐ Add token tracking & monitoring
☐ Optimize API requests
☐ Test memory persistence
☐ Add character selection UI
```

### Week 4: Polish
```
☐ Add more character profiles
☐ Implement UI refinements
☐ Add animations & transitions
☐ Test on mobile
☐ Deploy to Vercel/Netlify
```

---

## 🎯 Decision Tree: Which Approach?

### Should I use Backend or Frontend API?

```
┌─ Development?
│  ├─ YES → Frontend direct (easier, faster)
│  └─ NO → Go to production check
│
├─ Production?
│  ├─ YES, public→ Use Backend proxy (secure API key)
│  └─ YES, private → Can use frontend (but not ideal)
│
└─ Conclusion:
   DEV:  Frontend direct (easier iteration)
   PROD: Backend proxy (secure)
```

### Should I implement summarization?

```
┌─ Use case?
│  ├─ Casual chat (<5min sessions) → Optional
│  └─ Long-term chat (>10min) → Required
│
└─ Recommendation:
   Do it anyway - future-proof your app ✅
```

### Which character personality type?

```
TSUNDERE    → "Act tough, actually caring"
KUUDERE     → "Cool and calm on surface"
YANDERE     → "Sweet but possessive" (use carefully)
DEREDERE    → "Pure affection, no wall"
DANDERE     → "Shy and quiet"

Easiest to implement: Tsundere or Deredere
```

---

## 💻 Code Snippets - Copy & Paste Ready

### 1. Initialize Project
```bash
npm create vite@latest my-waifu-chat -- --template react-ts
cd my-waifu-chat
npm install dexie axios zustand tailwindcss postcss autoprefixer

# Initialize Tailwind
npx tailwindcss init -p
```

### 2. .env.local
```
VITE_OPENROUTER_API_KEY=sk-or-your-key-here
VITE_OPENROUTER_BASE_URL=https://openrouter.io/api/v1
```

### 3. Quick Chat Request (Copy from boilerplate)
```typescript
const response = await fetch("https://openrouter.io/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${API_KEY}`,
    "HTTP-Referer": window.location.origin,
  },
  body: JSON.stringify({
    model: "meta-llama/llama-3.1-8b-instruct:free",
    messages: [...],
    max_tokens: 150,
    temperature: 0.8,
  }),
});
```

### 4. Character Profile Template
```typescript
const character = {
  name: "Character Name",
  systemPrompt: `You are [NAME], a [AGE]-year-old [TYPE].
  
Personality: [Describe personality]
Speech style: [How they talk]
Catchphrases: [Common phrases]
Mannerisms: [Physical habits]

Keep responses short (2-3 sentences max).`,
  personality: "tsundere" | "kuudere" | "deredere",
  interests: ["interest1", "interest2"],
};
```

### 5. Save Message to IndexedDB
```typescript
const message = {
  conversationId: "conv_001",
  role: "assistant",
  content: "Hello!",
  timestamp: Date.now(),
  tokens: 42,
};

await db.messages.add(message);
```

---

## 🔧 Troubleshooting Guide

### Problem: "401 Unauthorized" from OpenRouter
```
Solution:
1. Check API key is correct in .env.local
2. Check header: "Authorization": `Bearer ${KEY}`
3. Check HTTP-Referer header is included
4. Restart dev server after .env change
```

### Problem: Messages disappear after refresh
```
Solution:
1. Check IndexedDB is working (DevTools → Storage)
2. Check browser allows IndexedDB for your domain
3. Check conversation is saved: 
   console.log(await db.conversations.toArray())
```

### Problem: Token usage too high
```
Solution:
1. Reduce max_tokens from 150 to 100
2. Reduce context window (keep last 3 messages instead of 5)
3. Summarize more aggressively (every 10 messages)
4. Keep character profile concise
```

### Problem: Response is generic/not in character
```
Solution:
1. Make system prompt more specific
2. Add examples of speech patterns
3. Reduce temperature from 0.8 to 0.7
4. Test with shorter context first
```

### Problem: App is slow
```
Solution:
1. Check DevTools Network tab for API latency
2. Reduce max_tokens (faster response)
3. Use smaller context window
4. Consider backend caching
```

---

## 📊 Performance Targets

### Should achieve by Week 4:
```
API Response Time:        <3 seconds
First Message Load:       <5 seconds
Character Consistency:    95% (over 20+ messages)
Token Usage:              <150 tokens per chat (with summarization)
Monthly Sustainability:   250+ conversations ✅
Mobile Performance:       Smooth scrolling, no jank
Mobile Load Time:         <2 seconds
```

### How to measure:
```javascript
// In browser console
console.time("api-response");
await chatWithWaifu(...);
console.timeEnd("api-response");

// Monitor in DevTools Performance tab
// Check Lighthouse scores: Target 90+
```

---

## 🎨 UI Customization Ideas

### Character Avatar Display
```
Option A: Emoji (simplest) 👱‍♀️
Option B: ASCII art (fun) 
Option C: Simple SVG (custom)
Option D: Image placeholder (no real images - copyright)

Recommendation: Start with emoji, upgrade to SVG
```

### Chat Bubble Styling
```
User bubbles:    Right-aligned, purple/blue
Character bubbles: Left-aligned, white/pink
Typing indicator: Animated dots
System messages: Centered, gray
```

### Background Themes
```
Default:  Soft pink → purple gradient
Themes:   Dark mode, light mode, anime-inspired
Emoji:    Change background emoji per character
```

### Responsive Breakpoints
```
Mobile (<640px):    Full width, stacked layout
Tablet (640-1024px): Sidebar optional
Desktop (>1024px):   Sidebar + chat + settings
```

---

## 🔐 Security Checklist

```
☐ API key in .env.local, NEVER in .git
☐ .env.local added to .gitignore
☐ Use backend proxy for production (don't expose key)
☐ CORS configured on backend
☐ Rate limiting implemented (10 req/min)
☐ Input sanitization (prevent injection)
☐ No sensitive data in localStorage
☐ Auto-clear old conversations periodically
```

---

## 📈 Scaling Ideas (After MVP)

### Short term (Month 2):
```
✅ Add more character profiles (10+)
✅ Character customization UI
✅ Conversation export/import
✅ Dark mode
✅ Voice input (optional)
```

### Medium term (Month 3-4):
```
✅ Cloud sync (Firebase)
✅ User accounts (optional)
✅ Multi-language support
✅ Image recognition (optional)
✅ Emotional state tracking
```

### Long term (Month 5+):
```
✅ Multiplayer chat (2+ characters)
✅ Character creation marketplace
✅ Voice output (text-to-speech)
✅ Better memory system (vector DB)
✅ Integration with other platforms
```

---

## 🎓 Learning Resources

### Must-read:
```
OpenRouter Docs:        https://openrouter.io/docs
React Hooks Guide:      https://react.dev/reference/react
IndexedDB Tutorial:     https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
Prompt Engineering:     https://platform.openai.com/docs/guides/prompt-engineering
```

### Optional but helpful:
```
Zustand State Mgmt:     https://github.com/pmndrs/zustand
Dexie Docs:            https://dexie.org/
TypeScript Handbook:    https://www.typescriptlang.org/docs/
Tailwind CSS:          https://tailwindcss.com/docs
```

---

## 💰 Cost Analysis (Monthly)

```
OpenRouter Free Tier:
├─ Model cost: $0
├─ API calls: $0
└─ Total: $0 ✅

Optional Upgrades:
├─ Vercel (hosting): $0 (free tier) or $20/month
├─ Firebase (if using): $0 (free tier) to $20+/month
├─ Domain: ~$10/year
└─ Total: $0-30/month (OPTIONAL)

Your MVP Budget: $0 🎉
```

---

## 📝 Feature Checklist (MVP)

### Must-have:
```
✅ Chat interface
✅ Character selection
✅ Message history persistence
✅ Personality consistency
✅ Token tracking
✅ Mobile responsive
```

### Nice-to-have:
```
⭕ Summarization (recommended but complex)
⭕ Dark mode
⭕ Export conversations
⭕ Custom characters
⭕ Sound effects
```

### Can ignore for v1:
```
❌ Voice input/output
❌ Image recognition
❌ Cloud sync
❌ Multiplayer
❌ Monetization
```

---

## 🚀 Deployment Checklist

### Before deploying:
```
☐ Remove .env.local (add to .gitignore)
☐ Use backend proxy instead of frontend API key
☐ Set environment variables in deployment platform
☐ Test on production URL
☐ Check CORS settings
☐ Verify SSL certificate
☐ Test on mobile devices
☐ Check Lighthouse scores
```

### Deployment options:
```
Frontend:   Vercel (easiest), Netlify, GitHub Pages
Backend:    Railway, Render, Heroku
Database:   Firebase (optional), Supabase
```

### Vercel deployment:
```bash
npm install -g vercel
vercel
# Follow prompts, add env vars in project settings
```

---

## ⚠️ Common Mistakes to Avoid

```
❌ Hardcoding API key in frontend
❌ Forgetting to implement rate limiting
❌ Using too long context window (wastes tokens)
❌ Not testing on mobile early
❌ Ignoring token costs (even if free)
❌ Over-complicating character profiles
❌ Not using IndexedDB for persistence
❌ Forgetting to handle API errors
❌ Not implementing auto-save
❌ Comparing to GPT-4 quality (it's 7/10, not 10/10)
```

---

## ✅ Final Checklist Before Launch

```
Code Quality:
☐ No console errors
☐ TypeScript strict mode
☐ Linted code (ESLint)
☐ No hardcoded values

Functionality:
☐ Chat works end-to-end
☐ Messages persist
☐ Character stays in role
☐ Memory works (summarization)
☐ Mobile is responsive
☐ No jank on animations

Security:
☐ No API key exposed
☐ Rate limiting working
☐ CORS configured
☐ Input sanitization

Performance:
☐ API response <3s
☐ Page load <2s
☐ Lighthouse >90

Documentation:
☐ README.md
☐ Setup instructions
☐ Character template doc
☐ Deployment guide

Testing:
☐ Desktop browser (Chrome, Firefox, Safari)
☐ Mobile browser
☐ Slow 4G network simulation
☐ With summarization enabled
☐ With 20+ messages
```

---

## 🎉 Success Criteria

Your project is **DONE** when:

1. ✅ Can chat with AI character on desktop & mobile
2. ✅ Character personality is consistent across conversations
3. ✅ Messages are saved and persist after refresh
4. ✅ Token usage is tracked and under budget
5. ✅ No API costs (free tier only)
6. ✅ Response time <3 seconds
7. ✅ UI is responsive and polished
8. ✅ You can deploy and share the link

---

**Good luck! You got this! 🚀**

Questions? Check:
1. PRD_AI_Waifu_Chat.md (what to build)
2. MODEL_RECOMMENDATION_&_SETUP.md (how OpenRouter works)
3. COMPLETE_BOILERPLATE.ts (code to copy)
