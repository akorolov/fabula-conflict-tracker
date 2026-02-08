# Task 1: Extract Shared Type Definitions

## Goal

Consolidate all duplicated TypeScript interfaces into a single `src/lib/types.ts` file and update every import site.

## Problem

The following interfaces are defined multiple times across the codebase:

| Interface | Defined in |
|-----------|-----------|
| `Statuses` | `CharacterCard.svelte` (L7-14), `PlayerCard.svelte` (L2-9), `+page.svelte` (L6-13), `player/+page.svelte` (L6-13) |
| `Character` | `+page.svelte` (L23-33), `player/+page.svelte` (L15-25) |
| `Clock` | `+page.svelte` (L15-21), `player/+page.svelte` (L32-38) |
| `SharedImage` | `player/+page.svelte` (L27-30), `images/+page.svelte` (L4-7) |

`MonsterStatBlock` is already exported from `src/lib/index.ts` (L2-36) but is declared as a bare `interface` rather than an `export interface`.

## Steps

### 1. Create `src/lib/types.ts`

Add the following exported interfaces (canonical versions):

```typescript
export interface Statuses {
    dazed: boolean;
    weak: boolean;
    poisoned: boolean;
    shaken: boolean;
    slow: boolean;
    enraged: boolean;
}

export interface Character {
    id: number;
    name: string;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    hasActed: boolean;
    player: boolean;
    statuses: Statuses;
}

export interface Clock {
    id: number;
    name: string;
    current: number;
    max: number;
    visible: boolean;
}

export interface SharedImage {
    id: number;
    dataUrl: string;
}
```

### 2. Move `MonsterStatBlock` from `src/lib/index.ts` into `src/lib/types.ts`

Then update `src/lib/index.ts` to re-export from types:

```typescript
export type { MonsterStatBlock, Statuses, Character, Clock, SharedImage } from './types';
```

This preserves the existing `$lib` import alias (`import type { MonsterStatBlock } from '$lib/index'`) used in `CharacterCard.svelte` (L5) and `notion.ts` (L1).

### 3. Update each file to import from `$lib/types` (or `$lib`) instead of defining locally

**Files to update:**

- `src/lib/components/CharacterCard.svelte` — Remove the `Statuses` interface (L7-14). Add `import type { Statuses } from '$lib/types';`
- `src/lib/components/PlayerCard.svelte` — Remove the `Statuses` interface (L2-9). Add `import type { Statuses } from '$lib/types';`
- `src/routes/+page.svelte` — Remove `Statuses` (L6-13), `Clock` (L15-21), `Character` (L23-33). Add `import type { Statuses, Character, Clock } from '$lib/types';`
- `src/routes/player/+page.svelte` — Remove `Statuses` (L6-13), `Character` (L15-25), `SharedImage` (L27-30), `Clock` (L32-38). Add `import type { Statuses, Character, SharedImage, Clock } from '$lib/types';`
- `src/routes/images/+page.svelte` — Remove `SharedImage` (L4-7). Add `import type { SharedImage } from '$lib/types';`

### 4. Keep component-local `Props` interfaces where they are

The `Props` interfaces in `CharacterCard.svelte` (L16-27) and `PlayerCard.svelte` (L11-17) are specific to each component and should stay local. They can reference the imported `Statuses` type.

## Verification

- `npm run check` passes with no type errors
- `npm run build` succeeds
- `npm run dev` — both DM view (`/`) and player view (`/player`) render correctly
- Grep for `interface Statuses` should find only 1 result (in `src/lib/types.ts`)
- Grep for `interface Character` should find only 1 result (in `src/lib/types.ts`)
- Grep for `interface Clock` should find only 1 result (in `src/lib/types.ts`)
- Grep for `interface SharedImage` should find only 1 result (in `src/lib/types.ts`)
