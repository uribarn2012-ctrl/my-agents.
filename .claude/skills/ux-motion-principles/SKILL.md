---
name: "ux-motion-principles"
description: "Use whenever building or redesigning any website, web app, mobile app, landing page or UI component, to apply 20 UX and animation principles (motion, feedback, Fitts, Hick, Doherty, Jakob)."
---

# 20 Principles of UX & Animation

Apply these by default to every site or app you build — without being asked. They are what separates "it works" from "it feels good". Don't announce them to the user; just build them in. At the end, mention in one line which ones shaped the result.

## Global rules
- Animate only `transform` and `opacity` (GPU-friendly). Never animate width/height/top/left.
- Keep UI motion short: micro-interactions 120–250ms, panels/modals 250–400ms. Nothing over 500ms unless it's a hero moment.
- Always respect `prefers-reduced-motion`: replace movement with a quick fade or nothing.
- Motion must explain something (state change, cause → effect, where something went). Decorative motion that slows the user down gets cut.

Shared tokens to drop into every project:
```css
:root{
  --ease-out: cubic-bezier(.22,1,.36,1);      /* entering, responding */
  --ease-in-out: cubic-bezier(.65,0,.35,1);   /* moving on screen */
  --ease-spring: cubic-bezier(.34,1.56,.64,1);/* playful overshoot */
  --dur-fast: 150ms; --dur-base: 240ms; --dur-slow: 400ms;
}
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important;}
}
```

## Part A — Animation principles (1–12)

1. **Squash & stretch** — things squish on impact to show weight. On press/tap: `transform: scale(.96)`; on a selected chip/icon, a quick `scaleX(1.08) scaleY(.92)` → back to 1. Subtle (≤10%).
2. **Anticipation (wind-up)** — a small wind-up before the big move. Before something flies off (send button, swipe-dismiss), move it 2–4px or a few degrees the *opposite* way first, ~80ms, then go.
3. **Staging the focus** — one thing moves at a time; the important element gets the motion and the rest stay still or dim. Use a backdrop dim behind modals; stagger lists by 30–50ms so the eye is led, not flooded.
4. **Pose to pose** — define the key poses (start, key pose, end) and let easing fill in between. Use `@keyframes` with explicit key states rather than ad-hoc chained transitions.
5. **Follow through** — parts don't all stop at once. A card lands, its contents/shadow settle 40–80ms later; a drawer slightly overshoots and settles (use `--ease-spring`).
6. **Slow in & slow out** — speed up and slow down, never constant. Never use `linear` for movement (only for spinners/progress). Entering = ease-out, exiting = ease-in, moving across = ease-in-out.
7. **Moving in arcs** — natural things travel on curves, not straight lines. For "add to cart" / fly-to-target effects, animate X and Y with different easings (or use `offset-path`) so the path curves.
8. **Secondary action** — a small flourish that backs up the main one. "Saved" button + a check that draws in or a tiny sparkle; a like + a small burst. Never stronger than the main action.
9. **Snappy timing** — fast beats slow. Default 150–250ms; hover feedback ≤150ms. If it feels sluggish, cut the duration before anything else.
10. **Exaggerated feedback** — push it past real so the moment lands. Wrong password → horizontal shake (±6px, 3 cycles, ~300ms) + red state; success → a clear pop, not a faint color change.
11. **Solid drawing in 3D** — give flat things depth and volume. Cards that tilt use `perspective: 700px` on the parent and `rotateX/rotateY` on the child; layered shadows (one tight, one soft) instead of a single flat one.
12. **Overall appeal** — the sum of every detail done with care: consistent radii, spacing scale, type scale, real loading/empty/error states, no layout shift, polished button states (rest/hover/active/focus/disabled/loading).

## Part B — UX laws (13–20)

13. **Fitts's law** — targets that are big and close are fast to hit. Primary actions large and near where the thumb/cursor already is; on mobile put main actions in the bottom thumb zone.
14. **Bigger hit areas** — the clickable zone can be bigger than it looks. Minimum 44×44px tap target even for a 24px icon (padding or a `::before` with negative inset). Space adjacent targets ≥8px apart.
15. **Hick's law** — more choices = slower decisions. One clear primary CTA per screen, progressive disclosure, hide advanced options, keep menus short and grouped.
16. **Miller's law** — we hold about 7 things at once, so chunk it. Format long numbers (`4532 0151 1283 0366`, `415-555-0132`), group form fields into sections, break long lists into categories.
17. **Doherty threshold** — respond within 400ms or it feels slow. Give instant visual feedback (<100ms) on every action; use optimistic UI (show "Saved" immediately, reconcile later); skeletons instead of spinners for loads; anything >1s gets progress indication.
18. **Postel's law** — be liberal in what you accept, strict in what you show. Accept phone numbers with spaces/dashes, emails with stray whitespace, dates in multiple formats; normalize silently; give helpful, specific error messages.
19. **Jakob's law** — people expect your app to work like the others they use. Logo top-left links home, cart/account top-right, search where expected, standard icons and gestures. Be original in visuals, conventional in layout and interaction.
20. **Frequency of use** — put the most-used things closest. The most common action gets the most prominent, fastest-to-reach spot; rare settings go deeper. Remember last choices and recent items.

## Workflow
1. While planning the UI, decide: the one primary action per screen (15, 20), layout conventions (19), and target sizes (13, 14).
2. Add the shared tokens above to the stylesheet first.
3. Build every interactive element with full states and the press/feedback motion (1, 9, 10, 17).
4. Add transitions for state changes (3, 4, 5, 6, 7) and one secondary flourish on key moments like save/submit/purchase (8).
5. Handle inputs forgivingly and chunk displayed data (16, 18).
6. Final pass — check against this list:
   - [ ] No `linear` movement, no animation over ~500ms on routine UI
   - [ ] Every action gives feedback in <100ms; nothing waits >400ms silently
   - [ ] All tap targets ≥44px
   - [ ] One clear primary action per screen
   - [ ] Long numbers/forms chunked
   - [ ] Inputs accept messy formats
   - [ ] Layout follows common conventions
   - [ ] `prefers-reduced-motion` respected
   - [ ] Loading, empty, error and success states all exist and look designed

For React projects, the same rules apply via CSS or Framer Motion (`transition={{type:'spring', stiffness:400, damping:30}}` for snappy springs). For native mobile, use the platform's spring animations with the same durations.