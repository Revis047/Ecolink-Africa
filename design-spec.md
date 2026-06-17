# EcoLink Africa — UI Redesign Specification

## Design Concept: "Junction"

*Where African warmth meets Chinese precision — a UI that never existed before.*

The name **Junction** reflects the app's purpose: the intersection of African farmers and Chinese markets, of voice and text, of local knowledge and global trade. The design language synthesizes organic African textures with structured Chinese layout grids, creating something neither fully Western, African, nor Asian — but distinctly its own.

---

## 1. Design Principles

| # | Principle | Why |
|---|-----------|-----|
| 1 | **Voice-first hierarchy** | Farmers may be low-literacy; voice is primary, text is secondary |
| 2 | **Generous whitespace** | Reduces cognitive load; feels premium, not cluttered |
| 3 | **One action per screen** | Every screen has exactly one primary action, visually dominant |
| 4 | **Earthy + digital** | Warm natural colors with crisp modern typography |
| 5 | **Familiar to both cultures** | Chinese buyers see structured grids; farmers see large clear elements |
| 6 | **48pt minimum touch targets** | Accessibility for rough hands, any device |

---

## 2. Color Palette

A warm-earth base with jewel-toned accents. No pure black, no pure white.

```
Primary:     #0F766E  (Teal-700)   — Trust, growth, nature
PrimaryLight:#14B8A6  (Teal-500)   — Highlights
PrimaryDark: #115E59  (Teal-800)   — Deep backgrounds

Secondary:   #D97706  (Amber-600)  — Warmth, sun, premium
SecondaryLt: #F59E0B  (Amber-500)  — Accents, badges
SecondaryDk: #92400E  (Amber-800)  — Deep warmth

Accent:      #E85D3A  (Coral)      — Calls to action, urgency
AccentLight: #F47560              — Hover/pressed states

Surface:     #FFFFFF               — Cards, sheets
SurfaceAlt:  #FAFAF9               — Alternate backgrounds
Background:  #F5F5F0               — Page backgrounds (warm off-white)

Text:        #18181B  (Zinc-900)   — Primary text
TextSec:     #52525B  (Zinc-600)   — Secondary text
TextMuted:   #A1A1AA  (Zinc-400)   — Placeholders, captions

Border:      #E4E4E7  (Zinc-200)  — Subtle borders
BorderLight: #F4F4F5  (Zinc-100)  — Very subtle

Success:     #059669  (Emerald-600)
Warning:     #D97706  (Amber-600)
Error:       #DC2626  (Red-600)
Info:        #2563EB  (Blue-600)

Overlay:     rgba(0,0,0,0.4)
```

### Usage rules
- Primary actions → `#0F766E` (teal)
- Voice/AI features → `#D97706` (amber)  
- Urgent/critical → `#E85D3A` (coral)
- Never use pure `#000000` or `#FFFFFF` for text or backgrounds
- All shadows use `rgba(0,0,0,0.08)` base

---

## 3. Typography System

System fonts only (San Francisco / Roboto). No custom fonts — ensures performance, instant load, native feel.

### Type scale

```
H1:  fontSize: 28, fontWeight: 700, lineHeight: 34, letterSpacing: -0.3
H2:  fontSize: 22, fontWeight: 700, lineHeight: 28, letterSpacing: -0.2
H3:  fontSize: 18, fontWeight: 600, lineHeight: 24
H4:  fontSize: 16, fontWeight: 600, lineHeight: 22

Body:    fontSize: 15, fontWeight: 400, lineHeight: 22
BodyBd:  fontSize: 15, fontWeight: 600, lineHeight: 22
Small:   fontSize: 13, fontWeight: 400, lineHeight: 18
Caption: fontSize: 11, fontWeight: 500, lineHeight: 16, letterSpacing: 0.3, textTransform: uppercase

Button:  fontSize: 15, fontWeight: 600, lineHeight: 20
BtnSm:   fontSize: 13, fontWeight: 600, lineHeight: 18

Price:   fontSize: 22, fontWeight: 700, lineHeight: 26  (tabular figures)
Metric:  fontSize: 20, fontWeight: 300, lineHeight: 24  (large numbers, light weight)
```

### Key changes from current
- Reduced base body size from 16→15 for better density
- Removed `voice` size (20) — use H3 or BodyBd instead
- Reduced H1 from 32→28 for better mobile fit
- Added `Metric` style for large numbers (weather, prices, quantities)
- `Caption` is now always uppercase with tracking

---

## 4. Spacing & Layout Grid

Base unit: 4px. All spacing is multiples of 4.

```
xs:  4
sm:  8
md:  12
lg:  16
xl:  20
xxl: 28
xxxl: 40
huge: 56
```

### Layout rules
- Content padding: `spacing.xxl` (28px) horizontal
- Section spacing: `spacing.xxxl` (40px) vertical
- Card padding: `spacing.lg` (16px)
- Card gap in grids: `spacing.md` (12px)
- Touch target minimum: 48px (use `paddingVertical` to reach this)

### Border Radius

```
sm:   8
md:   12
lg:   16
xl:   20
round: 999
```

---

## 5. Component Library

Every reusable component redesigned for the new system.

### 5a. Button

| Variant | Style |
|---------|-------|
| **Primary** | Teal bg, white text, `borderRadius.md`, 48px min height |
| **Secondary** | White bg, teal border, teal text, same sizing |
| **Ghost** | No bg/border, teal text, subtle press opacity |
| **Icon** | 44x44 circle, teal or amber tinted bg, centered emoji |
| **Pill** | `borderRadius.round`, for filters/tags |

All buttons: `activeOpacity: 0.8`, no uppercase, no letter-spacing except Caption.

### 5b. Card

```
borderRadius: lg
backgroundColor: surface
padding: lg
marginBottom: md
```

Card elevation: subtle `shadowSm` (shadowColor: rgba(0,0,0,0.06), offset 0/2, radius 8, elevation 2).

Variants:
- **Default card** — full width, content padded
- **Compact card** — reduced padding for dense lists
- **Feature card** — left accent border (4px) in teal/amber/coral
- **Stat card** — centered metric display, large number

### 5c. Input

```
borderRadius: md
borderWidth: 1.5 (not 1 — visible for farmers)
borderColor: border (focused: primary)
backgroundColor: surface
fontSize: 15
paddingVertical: 12 (ensures 48pt touch)
```

- Focus state: teal border, subtle teal shadow
- Error state: coral border + message below
- Multiline: rounded corners, no border on bottom sheet inputs

### 5d. Avatar

- User avatar: 36px circle, tinted background with emoji
- AI avatar: 32px circle, amber-tinted background with 🌍
- Conversation list avatar: 44px circle

### 5e. Badge

- Compact: 4px horizontal padding, `borderRadius.sm`, font Caption
- Metric: larger pill for prices/stats

### 5f. TopBar / Header

Standard header pattern:
```
height: 52 + safeAreaTop
paddingHorizontal: xxl
backgroundColor: background / surface
borderBottomWidth: 0 (use shadow instead)
```
Contains: back button (optional) | centered/baseline title | action button (optional)

### 5g. Bottom Tab Bar

```
height: 52 + safeAreaBottom
backgroundColor: surface (with blur on iOS)
borderTopWidth: 0
shadowSm (upward)
```

Tab items: icon-only (no labels below 360px width), active indicator dot above icon.

### 5h. Skeleton / Loading

- Placeholder shimmer: animated gradient sweep
- Card skeleton: gray rounded rects matching card layout
- Text skeleton: thinner rounded rects matching line heights

---

## 6. Screen-by-Screen Redesign

### 6a. SplashScreen

**Layout:**
- Full-screen gradient background: `#0F766E` (teal) → `#115E59` (deep teal) top-to-bottom
- **Central mark**: A custom geometric mark (not emoji) — interlocking circles symbolizing Africa + China meeting. Use `◈` diamond or create with two overlapping circles using absolute Views.
- App name: "EcoLink" (H1, white) + "Africa" (H2, amber-300, letterSpacing: 6)
- Thin accent line: 40px wide, 2px, `colors.secondary` amber
- Tagline: "Voice. Trade. Grow." (Body, white/70% opacity)
- Bottom: animated wave pattern (SVG-free — use overlapping absolute-positioned rounded Views)

**Animations:**
1. 0–600ms: Background fade in
2. 200–900ms: Central mark scale up (0.3→1) with spring
3. 500–1100ms: App name slide up (20px→0, fade 0→1)
4. 900–1400ms: Line width expand (0→40px)
5. 1200–1700ms: Tagline fade in
6. 1400–2000ms: Wave pattern slide up
7. Total: ~2.5s, then `onComplete`

### 6b. OnboardingScreen

**4 steps** (keep current flow, new visuals):

**Design pattern:** Full-bleed card layout. Each step fills the screen above the footer. Progress dots use teal (active) / zinc-200 (inactive).

**Step 0 — Language:**
- Top half: 🌍 large emoji (64px) centered, pulsing gently
- "What language do you speak?" (H2, centered)
- LanguagePicker redesigned: full-width card, flag + language name + chevron, selection opens a clean bottom sheet

**Step 1 — Profile:**
- Large 👋 (64px) centered
- "What's your name?" (H2)
- TextInput full-width, focused auto
- "Continue" primary button, disabled until input filled

**Step 2 — Farm:**
- 🌱 large (64px) centered
- "Tell us about your farm" (H2)
- Farm name input (optional), phone input (optional)
- Skip link ("Skip for now") in muted text

**Step 3 — Complete:**
- 🚀 large (64px) centered, animate scale-in on mount
- "You're all set!" (H2)
- Summary card with fields
- "🌍 Enter Village Square" === "🌍 Enter Village Square" primary button, full width

**Footer:** Progress dots (3 active dots for 4 steps, where step=current). "Continue" primary button fixed at bottom with 28px horizontal padding. "Back" ghost link.

### 6c. VillageSquareScreen (Home)

**Layout flow (top to bottom):**

1. **Header** (compact, 52px):
   - Left: greeting (localized, "Mwaramutse 👋" or "你好 👋")
   - Right: user avatar circle + notification dot

2. **Quick Voice Prompt** (feature card, amber left border):
   - Left: 🎤 large icon in amber circle
   - Content: "Ask EcoLink anything about farming" (H4) + "Tap to speak" (Small)
   - Right: → arrow
   - Tap → navigates to VoiceInquiry tab

3. **Weather + Network Row** (2 stat cards side by side):
   - Left: "🌤 27°C" metric + "Kigali, Rwanda" caption
   - Right: "📡 Strong" metric + "Network" caption

4. **Quick Actions Grid** (2×2 grid, compact cards):
   - Scan Crop 📷 | Market 📊 | Messages 💬 | Weather 🌤
   - Each: icon on tinted circle bg + label (Small, bold)

5. **Live Market Prices** (horizontal scroll, no wrap):
   - Section header: "Market Prices →" (H4 + arrow, tappable)
   - Price pills: crop emoji | name | $price | ▲/▼ %change
   - Pills: `borderRadius.round`, `surface` bg, `border` border

6. **Farm Health** (2 stat cards):
   - "Soil Moisture" with mini bar (same concept, refined styling)
   - "Crop Health" with mini bar

7. **Recent Listings** (section):
   - Section header: "Fresh Listings →" (H4, tappable → Market tab)
   - 2-3 compact CropCards

**Animations:**
- Staggered fade-in on mount (each section, 100ms delay between, 400ms duration)
- Pull-to-refresh with haptic
- Price pills: subtle pulse when data refreshes

### 6d. VoiceInquiryScreen (AI Chat)

**This is the flagship screen — most important redesign.**

**Layout:**

1. **TopBar:**
   - Left: "AI Assistant" (H4) with pulsing green dot
   - Right: "+ New" ghost button

2. **Message area** (flex: 1, ScrollView):
   - Empty state hero (only on fresh chat):
     - Large 🌾 (64px) centered
     - "Ask me about farming" (H2)
     - "Crops · Weather · Prices · Diseases" (Body, textSec)
     - 4 suggestion pills (horizontal scroll): "Plant maize?", "Avocado price?", "Cassava disease?", "Rain this week?"
   - Message bubbles:
     - User: right-aligned, teal bg (`#0F766E`), white text, no avatar
     - AI: left-aligned, `surface` bg with `border` border, amber label "EcoLink AI", globe avatar (32px amber circle)
     - Both bubbles: `borderRadius: 16`, `borderBottomLeftRadius: 4` (AI) / `borderBottomRightRadius: 4` (user)
     - AI text: typewriter animation (25ms per char, amber cursor `|`)

3. **Thinking indicator** (during isProcessing):
   - Compact card, amber left border
   - 4 mini steps horizontally (not vertically):
     - 🧠 Think | 🔍 Search | 🌐 Gather | ✍️ Write
     - Active step: amber dot, bold label
     - Done step: green check, faded label
     - Future step: muted label
   - Steps advance every 800ms (not 1200 — faster feel)

4. **Input bar** (fixed bottom):
   - Mic button (44px, amber tinted circle, 🎤 icon)
   - TextInput (flex: 1, `borderRadius: 22` pill shape, `surfaceAlt` bg)
   - Send button (44px, teal circle, ➤, disabled when empty at 40% opacity)

**Key interactions:**
- Keyboard pushes input bar (KeyboardAvoidingView)
- Typing indicator hides when AI response starts
- Suggestion taps fill input (don't send immediately)
- Empty state replaces with messages after first send

### 6e. CropScannerScreen

**Layout:**

1. **Header** (compact): ← Back (if needed) | "Crop Scanner" (H4)

2. **Camera area** (flex: 2, dark bg `#115E59`):
   - Viewfinder frame: rounded rect (3:4 aspect), 2px amber border, scanning corners (L-shaped brackets)
   - Scanning state: amber line sweeping top→bottom (1.2s cycle)
   - Image preview after capture

3. **Control area** (flex: 1, `background`):
   - Pre-scan: "📸 Take a photo" primary pill button, centered
     - Below: "of the affected leaf" (caption, textSec)
   - Scanning: "Analyzing..." amber spinner + text
   - Result:
     - Status badge: ✅ Healthy (emerald) or ⚠️ Disease Detected (coral)
     - Result card: Crop type, disease name (local + English), confidence bar (teal fill)
     - Treatment card (if diseased): amber left border, local treatment text, English below
     - "Scan Another" secondary button

**Animations:**
- Scan line: `Animated.timing` loop, amber 2px line, 1.2s up/down
- Result card: fade in (300ms) + slide up (20px→0)
- Status badge: scale bounce on mount

### 6f. MarketScreen

**Layout:**

1. **TopBar**: "Market" (H3) | filter icon button (right)

2. **Price Ticker** (horizontal scroll):
   - Section: "Live Prices" caption
   - Price cards (compact, 120px wide): crop emoji | name | $price | ▲/▼ trend%
   - Tapping a card refreshes that price (calls checkPrice)

3. **Search + Filters**:
   - Search bar: 🔍 icon + TextInput "Search crops..." (rounded, `surface` bg)
   - Filter pills: horizontal scroll of `borderRadius.round` buttons
   - Categories: All | Fruits | Grains | Vegetables | Cash Crops
   - Active filter: teal bg, white text
   - Inactive: `surface` bg, `border` border

4. **Listings** (ScrollView, no flatlist needed for < 50 items):
   - Compact CropCards, 2 per row on wider screens (>400px), else full width
   - Empty state: "📭 No listings yet" centered

### 6g. ChatScreen

**Layout — two views:**

**Conversation List (default):**
- TopBar: "Messages" (H3)
- Conversation cards: avatar (44px) | name + role badge | last message (1 line) | time | unread dot (coral, 10px)
- Empty: 💬 "No messages yet" centered

**Chat View (when conversation selected):**
- TopBar: ← back | avatar + name | "ZH → RW" translation badge (compact pill)
- Messages: alternating left/right bubbles
  - Their messages: `surface` bg, `border` border, `borderRadius: 16`, `borderBottomLeftRadius: 4`
  - My messages: teal bg, white text, `borderRadius: 16`, `borderBottomRightRadius: 4`
  - Translation original: italic, smaller, muted, below translated text
- Input bar: TextInput (pill shape) + send button (teal circle)

---

## 7. Animation & Interaction Spec

| Screen | Animation | Timing | Driver |
|--------|-----------|--------|--------|
| Splash | Staggered entrance | 2.5s total | native |
| Onboarding | Slide + fade step transitions | 300ms | native |
| VillageSquare | Staggered section entrance | 100ms delay each | native |
| VillageSquare | Header shrink on scroll | Animated.event | native |
| VoiceInquiry | Typewriter effect | 25ms/char | JS timer |
| VoiceInquiry | Wave bars | randomized loop | native |
| VoiceInquiry | Thinking steps progress | 800ms each | JS timer |
| CropScanner | Scan line sweep | 1.2s loop | native |
| CropScanner | Result card entrance | 300ms spring | native |
| ChatScreen | Bubble entrance | 200ms stagger | native |
| VoiceButton | Pulse + ring | 1.2s loop | native |
| Tab bar | Active dot indicator | 200ms spring | native |

### Shared interaction patterns
- **Press feedback**: All touchables reduce opacity to 0.8 on press
- **Navigation transitions**: Use default native stack (slide from right)
- **Tab switch**: Instant, no animation
- **Pull to refresh**: Default RN RefreshControl, styled teal

---

## 8. Implementation Plan

### Phase 1: Theme Update
1. Update `colors.ts` — new palette
2. Update `typography.ts` — new type scale  
3. Update `spacing.ts` — border radius values

### Phase 2: Shared Components
1. Rewrite `VoiceButton.tsx` — new size defaults, color tokens
2. Rewrite `CropCard.tsx` — compact variant, new tokens
3. Rewrite `AnimatedHeader.tsx` — match new typography
4. Rewrite `LanguagePicker.tsx` — match new tokens
5. Add new component: `Button` (primary/secondary/ghost variants)
6. Add new component: `Card` with variants (default/compact/feature/stat)
7. Add new component: `Badge` / `PricePill`
8. Add new component: `Skeleton` placeholder

### Phase 3: Screens (in order of impact)
1. VoiceInquiryScreen — flagship, most used
2. SplashScreen — first impression
3. OnboardingScreen — first setup experience
4. VillageSquareScreen — home screen
5. CropScannerScreen — feature screen
6. MarketScreen — data listing
7. ChatScreen — messaging

### Phase 4: Polish
1. Animated transitions between screens
2. Haptic feedback on key actions
3. Dark mode prep (CSS custom properties for future)
4. Accessibility audit

---

## 9. Design Decisions Log

| Decision | Rationale |
|----------|-----------|
| Teal primary instead of gold | Gold is associated with cheap "deal" aesthetics; teal suggests trust, nature, premium |
| System fonts only | No FOUT, instant render, native feel, smaller bundle |
| 15px body instead of 16px | Better line lengths on mobile; 16px felt juvenile |
| No pure white/black | Reduces eye strain, feels more premium |
| VoiceButton inline in screen | It's only used in VoiceInquiry; no need for shared component overhead |
| Amber for AI/voice features | Warm, human, distinct from teal (actions) and coral (urgency) |
| Pills instead of rectangular chips | Softer, more approachable for farmers |
| Bottom sheet for language picker | Familiar mobile pattern, doesn't block context |
