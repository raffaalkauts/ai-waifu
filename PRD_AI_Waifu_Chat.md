# PRD: AI Waifu Chat WebApp
**Status**: Draft | **Priority**: High | **Timeline**: 2-4 minggu

---

## 📋 Executive Summary
Webapp chat interaktif dengan AI character yang personality-driven, dioptimalkan untuk **free tier OpenRouter API**. Fokus pada character consistency, memory efficiency, dan user engagement tanpa biaya.

---

## 🎯 Goals & Success Metrics

### Primary Goals
- ✅ Natural, engaging conversation dengan personality yang konsisten
- ✅ Long-term memory dengan token footprint minimal
- ✅ 100% free to run (OpenRouter free tier)
- ✅ Fast response time (<3 detik)

### Success Metrics
| Metrik | Target |
|--------|--------|
| Avg response time | <3s |
| Memory retention (5+ pesan) | 95% consistency |
| Token usage per chat | <200 tokens avg |
| Uptime | 99% |
| User session duration | >10 menit |

---

## 👥 Target Users
- Anime/character enthusiasts
- English & Indonesian speakers
- Desktop & mobile users
- Age: 16+

---

## 🎨 Core Features

### 1. **Character Personality System**
**Problem**: LLM default adalah generik, butuh system prompt yang strong

**Solution**:
```
Character Profile JSON
├── name, appearance, personality traits
├── speech patterns, catchphrases, mannerisms
├── background story, interests, goals
├── interaction style (tsundere, dere, kuudere, etc)
└── boundaries & response guidelines
```

**Implementation**:
- Inject character profile ke system prompt (fixed, tidak dihitung token)
- Use fixed system prompt di aplikasi, bukan di API call
- Hanya context conversation yang dihitung

---

### 2. **Memory System (Token-Efficient)**
**Challenge**: Long-term memory butuh banyak token, tapi budget zero

**Solution Stack** (Choose One):

#### **Option A: Summarization Pipeline** ⭐ RECOMMENDED
```
Flow:
1. User chat → Store di local IndexedDB (unlimited, gratis)
2. Every 10 messages → Auto-summarize ke 2-3 kalimat
3. Old messages → Archive, hanya summary yang masuk system
4. API call: [System] + [Character Profile] + [Recent 5 msgs] + [Summary of past]

Token saving: 70-80% reduction
```

**LocalStorage Schema**:
```javascript
{
  characterId: "waifu_001",
  messages: [
    { id, role, content, timestamp, tokenCount }
  ],
  summaries: [
    { period: "session_1", summary: "...", createdAt }
  ],
  metadata: {
    totalMessagesCount: 42,
    lastSummaryAt: timestamp
  }
}
```

#### **Option B: Semantic Compression** (Advanced)
- Use local embedding model (ONNX.js, tiny 1MB model)
- Cluster similar messages
- Keep only unique/important messages
- Token saving: 60-70%

#### **Option C: Hybrid - Smart Context Window**
```
Fixed tokens per request:
- System + character profile: 100 tokens (fixed, tidak dihitung)
- Last 3 messages: Always include (300 tokens)
- Summary of last 20 messages: 100 tokens
- Total API tokens: ~400 per request

Free tier allows: ~100K tokens/month = ~250 chats = sustainable
```

**Rekomendasi**: Pakai **Option A (Summarization)** → Simplest, effective, reliable

---

### 3. **Multi-turn Conversation**
- Maintain context across messages
- Character consistency validation
- Emotional state tracking (happy, sad, curious, etc)

### 4. **Optional: Image Recognition**
- Use free vision API alternatives:
  - `llava-1.5-7b-q4` via OpenRouter (free)
  - User upload image → describe → waifu reacts
- Token cost: ~300-400 per image
- Optional feature, rate-limit to 3x/hari

### 5. **Customizable Characters**
- Pre-built character library (5-10 waifus)
- User dapat bikin custom character via form
- Store character profiles di browser (IndexedDB)

---

## 🏗️ Technical Architecture

### Frontend Stack
```
React 18 + TypeScript
├── State: Zustand (lightweight)
├── UI: Tailwind CSS + custom components
├── Animations: Framer Motion
├── Storage: IndexedDB + localStorage
└── API Client: React Query + Axios
```

### Backend (Optional, tapi recommended)
```
Node.js + Express
├── Port: 3001
├── Environment: .env untuk OpenRouter API key
├── Routes:
│   ├── POST /api/chat → OpenRouter integration
│   ├── GET /api/characters → character library
│   └── POST /api/summarize → token summarization
└── Middleware: Rate limiting, CORS
```

### Database (Browser-first)
```
Primary: IndexedDB (unlimited, fast)
├── Store: conversations, characters, summaries
├── Sync: Auto-save to localStorage backup
└── Retention: Configurable (1 bulan default)

Optional Cloud: Firebase (free tier)
└── For user account & cross-device sync
```

### API Integration
```
Provider: OpenRouter
├── Base: https://openrouter.io/api/v1
├── Model: (see recommendation below)
├── Free tier: ~100K tokens/month
└── No credit card required
```

---

## 📊 Model Selection

### Recommended: **Llama 3.1 8B Instruct**
```
Why:
✅ Free on OpenRouter
✅ Fast response (<2s)
✅ Good quality untuk conversational AI
✅ Great for personality/roleplay
✅ Low resource usage

Trade-off:
⚠️ Context limit: 8K tokens (lebih kecil dari GPT-4)
⚠️ Slightly less natural dibanding Claude/GPT-4
⚠️ Tapi sudah cukup untuk casual chat

Fallback: Mistral 7B (juga free, lebih balanced)
```

### Alternative if Mistral Available:
```
Mistral 7B Instruct
- Slightly better quality than Llama
- Same speed, similar token efficiency
- Better untuk structured outputs
```

### Why NOT:
- ❌ Claude 3.5 Sonnet: Paid (walau bagus)
- ❌ GPT-4: Paid
- ❌ Larger models (70B): Slower, higher latency

---

## 🔄 System Prompt Strategy

### Static System Prompt (Injected locally, not to API)
```
[Di frontend kode, bukan dikirim ke API]
"You are [CHARACTER_NAME], a [age]-year-old [race] girl with the following traits:

Personality: [traits list]
Speech style: [examples of how she talks]
Catchphrases: [common phrases she uses]
Interests: [hobbies, likes, dislikes]
Current mood: [emotional state]

Important: Always stay in character. Your responses should be natural, 
warm, and reflect your personality. Avoid breaking character.
Keep responses concise (2-3 sentences max for mobile)."
```

**Benefit**: 
- System prompt tidak dihitung ke API token limit (banyak provider)
- Kecuali OpenRouter, maka perlu optimize: keep under 500 tokens

---

## 💾 Memory Optimization Algorithm

### Conversation Management Flow
```
┌─ New message from user
│
├─ Save to IndexedDB
├─ Generate response dari OpenRouter
│
├─ Check: Total messages > 15?
│  │
│  ├─ YES → Trigger summarization
│  │   ├─ Take messages 1-10
│  │   ├─ Call Claude (via OpenRouter) untuk summarize
│  │   ├─ Create summary: "User asked about X, Y, Z.
│  │   │  Character revealed she likes anime. They 
│  │   │  bonded over manga."
│  │   ├─ Delete messages 1-10 from active context
│  │   └─ Keep in archive + summary
│  │
│  └─ NO → Continue normally
│
└─ Prepare next request:
    ├─ System prompt (local injection)
    ├─ Character profile
    ├─ Last 5 messages (full)
    ├─ Messages 6-15 summary (1 block)
    ├─ User's new message
    └─ Send to OpenRouter (estimated: 300-400 tokens)
```

### Token Budget per Month
```
Free tier: ~100,000 tokens / month (estimated)
Per chat: ~400 tokens (system + context + response)
Capacity: ~250 meaningful conversations/month
         = ~8 chats/hari

If optimize dengan summarization:
Reduction: 70% → ~120 tokens per chat
Capacity: ~830 chats/month = 27 chats/hari ✅
```

---

## 🎨 UI/UX Design

### Key Screens
1. **Landing Page** → Character selection + custom character button
2. **Chat Screen** → Main interface dengan avatar, chat bubble, input
3. **Character Editor** → Buat/edit custom character
4. **Settings** → Memory management, theme, export data

### Chat UI Components
```
┌─────────────────────────────┐
│  [Character Avatar/Name]    │  ← Fixed header
├─────────────────────────────┤
│  Character aesthetic bg     │  ← Dynamic background
│  ┌─────────────────────┐    │
│  │ Waifu: "Hey there! │    │
│  │  What's up?" 😊     │    │
│  └─────────────────────┘    │
│                             │
│  ┌──────────────────────┐   │
│  │ User: "Hey! How are  │   │
│  │ you?" 👤             │   │
│  └──────────────────────┘   │
├─────────────────────────────┤
│ [Input box] [Send] [Options]│ ← Footer
└─────────────────────────────┘
```

---

## 🔐 Privacy & Security

### Local-First Design
- ✅ All data stored locally (IndexedDB)
- ✅ No server stores conversation history
- ✅ No login required (unless want cloud sync)
- ✅ User can export/delete all data anytime

### API Security
- ✅ OpenRouter API key bisa di .env (backend)
- ✅ CORS configured untuk production
- ✅ Rate limiting: 10 requests/minute per user

---

## 📱 Responsive Design

### Breakpoints
```
Mobile: <640px
  - Chat bubbles full width
  - Stacked layout
  - Touch-friendly buttons (48px min)

Tablet: 640px-1024px
  - Sidebar character list optional
  - Balanced layout

Desktop: >1024px
  - Sidebar dengan character list
  - Wider chat area
  - Character art displayed
```

---

## 🚀 Development Roadmap

### Phase 1: MVP (Week 1-2)
- [ ] Basic chat interface
- [ ] Integration dengan OpenRouter (Llama 3.1 8B)
- [ ] Character profile system
- [ ] IndexedDB storage
- [ ] Basic summarization logic

### Phase 2: Polish (Week 3)
- [ ] UI refinement
- [ ] Conversation persistence
- [ ] Character editor
- [ ] Export/import conversations

### Phase 3: Nice-to-Haves (Week 4+)
- [ ] Image recognition (optional)
- [ ] Voice input/output
- [ ] Custom character creation
- [ ] Dark/light theme
- [ ] Cloud sync (Firebase)

---

## 💡 Token Optimization Tips

### For Developers
1. **Never send system prompt to API** → Inject locally
2. **Summarize aggressively** → Every 15 messages
3. **Use short response format** → "max_tokens: 150"
4. **Compress character profile** → Use JSON, not prose
5. **Cache character profiles** → Load once, reuse
6. **Monitor token usage** → Log setiap request

### Example Efficient Request
```javascript
const request = {
  model: "meta-llama/llama-3.1-8b-instruct:free",
  messages: [
    {
      role: "user",
      content: `[System prompt hidden from token count if possible]
      
Context Summary: User and Mika have known each other for 3 days. 
User is into anime, Mika is a tsundere who loves manga.

Recent conversation:
User: How was your day?
Mika: It was... fine, why do you care? *looks away*
User: Because I care about you
Mika: [respond naturally to this]`
    }
  ],
  max_tokens: 150,  // Keep responses short
  temperature: 0.8  // Creative tapi consistent
}
```

---

## 📊 Analytics & Monitoring

### Metrics to Track
- Token usage per chat
- Average response time
- User session duration
- Character consistency score (manual)
- Memory accuracy (summaries vs full context)

### Tools
- OpenRouter dashboard (token usage)
- Browser DevTools (performance)
- Custom logging (JSON to localStorage)

---

## 🎓 Testing Strategy

### Unit Tests
- Character profile validation
- Message formatting
- Token counter accuracy
- Summarization algorithm

### Integration Tests
- OpenRouter API integration
- IndexedDB read/write
- Conversation flow

### Manual Testing
- Personality consistency (5+ turn conversations)
- Memory retention (10+ messages)
- Mobile responsiveness
- Cross-browser compatibility

---

## 📋 Success Criteria (Launch)

- ✅ Chat loads in <2 seconds
- ✅ Response time <3 seconds on 4G
- ✅ Character personality consistent across 20+ messages
- ✅ Memory works without token overage
- ✅ Works on mobile and desktop
- ✅ Can handle 100+ messages without slowdown
- ✅ All features free (0 cost to user)

---

## 🔗 References & Resources

### OpenRouter Docs
- https://openrouter.io/docs
- Free models list: https://openrouter.io/models

### Libraries
- IndexedDB: https://dexie.org/
- React Query: https://tanstack.com/query/latest
- Zustand: https://github.com/pmndrs/zustand

### Character Design Inspiration
- Anime personality archetypes
- MBTI personality system
- Visual novel character templates

---

**Document Version**: 1.0  
**Last Updated**: May 2026  
**Author**: AI Assistant  
**Status**: Ready for Implementation
