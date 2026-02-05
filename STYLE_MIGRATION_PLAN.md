# AXON Style Migration Plan
## From Postiz Dark Theme → WeKruit Warm Light Theme

---

## Executive Summary

This plan migrates AXON's styling from the current Postiz dark purple theme to match WeKruit's warm, elegant light theme. The migration also includes rebranding from "Postiz/Gitroom" to "AXON".

**WeKruit Design Characteristics:**
- Warm cream/beige backgrounds
- Dark brown accents (not black)
- Serif font for headings (Halant)
- Light mode primary design
- Minimal, elegant aesthetic
- 12px border-radius on buttons

---

## 1. Color Palette Migration

### WeKruit Colors (Target)

| Purpose | Hex | RGB | CSS Variable |
|---------|-----|-----|--------------|
| **Background (Primary)** | `#FCF6EF` | rgb(252, 246, 239) | `--wk-bg-primary` |
| **Background (Secondary)** | `#F6F0E9` | rgb(246, 240, 233) | `--wk-bg-secondary` |
| **Background (Tertiary)** | `#EFE7DD` | rgb(239, 231, 221) | `--wk-bg-tertiary` |
| **Dark Brown (Buttons/Headings)** | `#2B180A` | rgb(43, 24, 10) | `--wk-brown-dark` |
| **Medium Brown (Text)** | `#5C4A3D` | rgb(92, 74, 61) | `--wk-brown-medium` |
| **Light Brown (Secondary Text)** | `#94877C` | rgb(148, 135, 124) | `--wk-brown-light` |
| **Accent Cream** | `#FAF6F2` | rgb(250, 246, 242) | `--wk-cream` |
| **Frosted Glass** | `rgba(255,255,255,0.32)` | - | `--wk-glass` |
| **White** | `#FFFFFF` | rgb(255, 255, 255) | `--wk-white` |

### Files to Update

#### `apps/frontend/src/app/colors.scss`

Replace the `.light` theme variables:

```scss
:root {
  .light {
    // Backgrounds
    --new-back-drop: #FCF6EF;
    --new-settings: #F6F0E9;
    --new-border: #E8E0D6;
    --new-bgColor: #FCF6EF;
    --new-bgColorInner: #FFFFFF;
    --new-sep: #E0D6CC;
    --new-bgLineColor: #EFE7DD;

    // Text
    --new-textItemFocused: #2B180A;
    --new-textItemBlur: #94877C;
    --new-boxFocused: #F6F0E9;
    --new-textColor: 43 24 10;  // RGB for dark brown

    // Buttons
    --new-blockSeparator: #F6F0E9;
    --new-btn-simple: #F6F0E9;
    --new-btn-text: #2B180A;
    --new-btn-primary: #2B180A;  // Dark brown (was purple)
    --new-ai-btn: #8B6914;       // Warm gold accent

    // UI Elements
    --new-box-hover: #F0E8DE;
    --new-table-border: #E8E0D6;
    --new-table-header: #FAF6F2;
    --new-table-text: #94877C;
    --new-table-text-focused: #2B180A;
    --new-big-strips: #FAF6F2;
    --new-col-color: #F6F0E9;
    --new-menu-dots: #94877C;
    --new-menu-hover: #2B180A;

    // Shadows (warm tones)
    --menu-shadow: 0 8px 30px 0 rgba(43, 24, 10, 0.08);
    --popup-color: rgba(43, 24, 10, 0.1);
    --border-preview: #E8E0D6;
    --preview-box-shadow: 0 15px 34px 0 rgba(43, 24, 10, 0.05);
  }
}
```

---

## 2. Typography Migration

### Current Font
- **Body:** Helvetica Neue (sans-serif)

### Target Fonts
- **Headings:** Halant (serif) - from Google Fonts
- **Body:** Inter or system sans-serif

### Files to Update

#### `apps/frontend/src/app/(app)/layout.tsx`

Add Halant font import:

```typescript
import { Plus_Jakarta_Sans } from 'next/font/google';
import { Halant } from 'next/font/google';

const halant = Halant({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-halant',
});

const jakartaSans = Plus_Jakarta_Sans({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-sans',
});

// In body className:
className={clsx(jakartaSans.variable, halant.variable, '...')}
```

#### `apps/frontend/tailwind.config.js`

Update font configuration:

```javascript
fontFamily: {
  sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
  serif: ['var(--font-halant)', 'Halant', 'Georgia', 'serif'],
},
```

#### `apps/frontend/src/app/global.scss`

Add heading styles:

```scss
h1, h2, h3, .heading {
  font-family: var(--font-halant), 'Halant', Georgia, serif;
  font-weight: 400;
  color: var(--new-btn-text);
}
```

---

## 3. Component Style Updates

### Border Radius
WeKruit uses `12px` border-radius on buttons vs current varied sizes.

#### `apps/frontend/src/app/global.scss`

```scss
// Standardize button border-radius
.btn, button, [class*="button"] {
  border-radius: 12px;
}

// Card border-radius
.card, [class*="card"] {
  border-radius: 16px;
}
```

---

## 4. Theme Mode Change

WeKruit is **light mode primary**. Current AXON defaults to dark.

### Files to Update

#### `apps/frontend/src/app/(app)/layout.tsx`

Change default theme:

```typescript
// Change from:
className={clsx(jakartaSans.className, 'dark text-primary !bg-primary')}

// To:
className={clsx(jakartaSans.className, 'light text-primary !bg-primary')}
```

#### User Preference Storage
Update any theme preference logic to default to `'light'` instead of `'dark'`.

---

## 5. Branding Migration (Postiz/Gitroom → AXON)

### Critical Files to Update

#### A. Package Names
| File | Current | New |
|------|---------|-----|
| `apps/frontend/package.json` | `"name": "postiz-frontend"` | `"name": "axon-frontend"` |

#### B. Text Strings (40+ locations)

**Backend Services:**
```
libraries/nestjs-libraries/src/database/prisma/agencies/agencies.service.ts
- "added to Postiz" → "added to AXON"
- "Gitroom Limited" → "AXON" or your company name

libraries/nestjs-libraries/src/chat/start.mcp.ts
- name: 'Postiz MCP' → name: 'AXON MCP'

libraries/nestjs-libraries/src/integrations/social/mastodon.custom.provider.ts
- client_name: 'Postiz' → client_name: 'AXON'

libraries/nestjs-libraries/src/newsletter/providers/listmonk.provider.ts
- 'Welcome to Postiz' → 'Welcome to AXON'

libraries/nestjs-libraries/src/sentry/initialize.sentry.ts
- 'Postiz ${appName}' → 'AXON ${appName}'
```

**Frontend:**
```
libraries/react-shared-libraries/src/helpers/testomonials.tsx
- All "Postiz" references in testimonials

apps/frontend/src/app/(app)/(site)/settings/page.tsx
- title: `${isGeneralServerSide() ? 'Postiz' : 'Gitroom'} Settings`
- → title: 'AXON Settings'
```

#### C. Search & Replace Commands

```bash
# Find all Postiz references
grep -r "Postiz" --include="*.ts" --include="*.tsx" --include="*.json" .

# Find all Gitroom references
grep -r "Gitroom" --include="*.ts" --include="*.tsx" --include="*.json" .
grep -r "gitroom" --include="*.ts" --include="*.tsx" --include="*.json" .
```

---

## 6. Implementation Order

### Phase 1: Colors (Low Risk)
1. ✅ Update `colors.scss` light theme variables
2. ✅ Test in browser with `.light` class

### Phase 2: Typography (Medium Risk)
1. Add Halant font to layout
2. Update Tailwind font config
3. Add global heading styles
4. Test all pages for font rendering

### Phase 3: Component Polish (Low Risk)
1. Update border-radius values
2. Update shadows to warm tones
3. Test buttons, cards, modals

### Phase 4: Default Theme (Low Risk)
1. Change default from dark to light
2. Update theme toggle defaults
3. Test theme persistence

### Phase 5: Branding (High Touch)
1. Update package names
2. Search/replace Postiz → AXON
3. Search/replace Gitroom → AXON
4. Update testimonials
5. Update email templates
6. Test all user-facing strings

---

## 7. Testing Checklist

- [ ] All pages render correctly in light mode
- [ ] Buttons have correct brown color and 12px radius
- [ ] Headings use Halant serif font
- [ ] Body text uses Inter/system sans-serif
- [ ] Social media preview components still work (LinkedIn, Twitter, etc.)
- [ ] Forms and inputs have correct styling
- [ ] Modals and popups use new color scheme
- [ ] No "Postiz" or "Gitroom" text visible to users
- [ ] Email templates show "AXON" branding
- [ ] Dark mode toggle still works (as secondary option)

---

## 8. Rollback Plan

Keep a git branch with current styling:
```bash
git checkout -b backup/postiz-styling
git push origin backup/postiz-styling
```

If issues arise, revert:
```bash
git checkout backup/postiz-styling -- apps/frontend/src/app/colors.scss
git checkout backup/postiz-styling -- apps/frontend/tailwind.config.js
```

---

## Quick Reference: Color Mapping

| Current (Postiz) | New (WeKruit) | Usage |
|------------------|---------------|-------|
| `#612bd3` (purple) | `#2B180A` (dark brown) | Primary buttons |
| `#d82d7e` (pink) | `#8B6914` (gold) | AI/accent features |
| `#f0f2f4` (gray) | `#FCF6EF` (cream) | Background |
| `#ffffff` (white) | `#FFFFFF` (white) | Cards |
| `#0e0e0e` (black text) | `#2B180A` (brown text) | Primary text |
| `#777b7f` (gray text) | `#94877C` (brown-gray) | Secondary text |
