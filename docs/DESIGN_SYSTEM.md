# DESIGN SYSTEM & UI TOKENS

## 1. Color Palette (Tailwind Config)
Use these semantic names in code.
- `primary`: `#FF9EB5` (Pastel Pink - Brand Color)
- `primary-foreground`: `#FFFFFF`
- `secondary`: `#AEC6CF` (Pastel Blue)
- `accent`: `#FFB347` (Pastel Orange - Highlight/Sale)
- `background`: `#FFF9FA` (Warm White - Background base)
- `text-main`: `#4A4A4A` (Dark Gray - softer than black)
- `text-muted`: `#888888`

## 2. Typography
- **Font Family:** 'Nunito' (Rounded, friendly) for Headings, 'Inter' for Body.
- **Mobile Scale:**
  - H1: `text-2xl` (Keep it compact on mobile)
  - H2: `text-xl`
  - Body: `text-[15px]` (Readable size)

## 3. Components Styling Rules
- **Buttons:**
  - Always `rounded-full` (Pill shape).
  - Minimum height `h-12` (48px) for touch targets.
  - Hover effects: `active:scale-95` (Mobile friendly feedback).
- **Cards (Product):**
  - `rounded-2xl` (Extra rounded).
  - `shadow-sm` default, `shadow-md` on active.
  - Must have "Add to Cart" button visible on mobile grid.
- **Images:**
  - Always use `object-cover`.
  - Border radius `rounded-xl`.

## 4. Spacing (Mobile First)
- Container padding: `px-4` (Mobile) -> `md:px-8` (Desktop).
- Section gap: `py-8` (Mobile) -> `md:py-16`.