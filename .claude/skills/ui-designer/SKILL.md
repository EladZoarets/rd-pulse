---
name: ui-designer
description: >
  Design a UI/UX page following modern best practices.
  Produces a structured design spec ready for a frontend developer or agent to implement.
trigger: >
  User asks to design, mock up, wireframe, layout, or plan a page, screen, or view.
  Also triggered when a developer or frontend agent needs a design spec before building.
version: 1.0.0
---

# UI Designer Skill

When activated, run the following design process in order. Do not skip phases.

---

## Phase 1 — Clarify Intent (ask if not already known)

Before designing, answer:
- **Who is the user?** (role, technical level, context)
- **What is the primary goal of this page?** (one sentence)
- **What is the one action the user must be able to complete?**
- **What data does this page consume?** (list fields/entities)

If the user's request already answers these, proceed directly to Phase 2.

---

## Phase 2 — Information Architecture

Define the content hierarchy:

1. **Primary content** — what must be visible above the fold
2. **Secondary content** — supporting details, visible on scroll or expand
3. **Actions** — primary CTA, secondary actions, destructive actions (list separately)
4. **Navigation context** — where does this page sit in the app? What links in/out?

Output this as a numbered outline, not prose.

---

## Phase 3 — Layout & Grid

Specify:
- **Layout pattern**: (e.g., single-column, sidebar + main, dashboard grid, split-pane)
- **Breakpoints**: mobile (< 768px), tablet (768–1024px), desktop (> 1024px)
- **Spacing scale**: use 4px base unit — specify padding/gap values
- **Max content width** and centering strategy

Draw an ASCII wireframe for the desktop layout. Keep it simple — boxes and labels only.

---

## Phase 4 — Component Inventory

List every UI component needed. For each, specify:

| Component | Variant / State | Props / Data |
|-----------|----------------|--------------|
| e.g. DataTable | sortable, paginated | columns[], rows[], isLoading |
| e.g. Button | primary, destructive | label, onClick, disabled |

Use shadcn/ui component names where applicable. If a custom component is needed, flag it with `[CUSTOM]`.

---

## Phase 5 — States

Every page must handle all four states. Define the UI for each:

- **Loading** — skeleton screens preferred over spinners for content areas
- **Empty** — zero-data state with a clear call to action (never a blank screen)
- **Error** — inline error with recovery action (retry, contact support, go back)
- **Populated** — the happy path (Phase 4 covers this)

---

## Phase 6 — Accessibility Checklist

Verify the design satisfies:
- [ ] All interactive elements reachable by keyboard (Tab order defined)
- [ ] Focus indicators visible (never `outline: none` without replacement)
- [ ] Color contrast >= 4.5:1 for text, >= 3:1 for UI components (WCAG AA)
- [ ] No information conveyed by color alone
- [ ] All images and icons have alt text or `aria-label`
- [ ] Page has a single `<h1>`, logical heading hierarchy
- [ ] Form fields have associated `<label>` elements

Flag any design decisions that risk failing these checks.

---

## Phase 7 — Output Format

Deliver the design spec as a structured document with these sections:
1. **Page Summary** (2-3 sentences: goal, user, primary action)
2. **IA Outline**
3. **ASCII Wireframe** (desktop)
4. **Component Table**
5. **State Definitions**
6. **Accessibility Notes**
7. **Implementation Notes** — Tailwind classes, shadcn imports, or data-fetching hints for the developer/agent picking this up

Do NOT write implementation code unless the user explicitly asks. The output is a spec, not code.
