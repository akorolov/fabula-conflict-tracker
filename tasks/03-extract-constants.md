# Task 3: Extract Shared Constants

**Depends on:** Task 1 (shared types must exist first)

## Goal

Consolidate duplicated constants into `src/lib/constants.ts`.

## Problem

### `defaultStatuses` — 2 copies

- `src/routes/+page.svelte` (L35-42)
- `src/routes/player/+page.svelte` (L40-47)

```typescript
const defaultStatuses: Statuses = {
    dazed: false,
    weak: false,
    poisoned: false,
    shaken: false,
    slow: false,
    enraged: false
};
```

### `statusLabels` — defined only once but useful to share

Currently only in `PlayerCard.svelte` (L23-30), but `CharacterCard.svelte` (L439-444) hard-codes the same six statuses inline in its template. If status names ever change, you'd need to update both.

### Notion API constants — 2 copies

- `src/lib/notion.ts` (L3-4)
- `src/routes/api/notion/search/+server.ts` (L4-5)

```typescript
const NOTION_API_URL = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';
```

## Steps

### 1. Create `src/lib/constants.ts`

```typescript
import type { Statuses } from '$lib/types';

export const defaultStatuses: Statuses = {
    dazed: false,
    weak: false,
    poisoned: false,
    shaken: false,
    slow: false,
    enraged: false
};

export const statusLabels: { key: keyof Statuses; label: string }[] = [
    { key: 'dazed', label: 'dazed' },
    { key: 'weak', label: 'weak' },
    { key: 'poisoned', label: 'poisoned' },
    { key: 'shaken', label: 'shaken' },
    { key: 'slow', label: 'slow' },
    { key: 'enraged', label: 'enraged' }
];

export const NOTION_API_URL = 'https://api.notion.com/v1';
export const NOTION_VERSION = '2022-06-28';
```

### 2. Update `src/routes/+page.svelte`

- Remove local `defaultStatuses` (L35-42)
- Add import: `import { defaultStatuses } from '$lib/constants';`

### 3. Update `src/routes/player/+page.svelte`

- Remove local `defaultStatuses` (L40-47)
- Add import: `import { defaultStatuses } from '$lib/constants';`

### 4. Update `src/lib/components/PlayerCard.svelte`

- Remove local `statusLabels` (L23-30)
- Add import: `import { statusLabels } from '$lib/constants';`

### 5. Update `src/lib/notion.ts`

- Remove local `NOTION_API_URL` and `NOTION_VERSION` (L3-4)
- Add import: `import { NOTION_API_URL, NOTION_VERSION } from '$lib/constants';`

### 6. Update `src/routes/api/notion/search/+server.ts`

- Remove local `NOTION_API_URL` and `NOTION_VERSION` (L4-5)
- Add import: `import { NOTION_API_URL, NOTION_VERSION } from '$lib/constants';`

### 7. Update `src/lib/storage.ts` (created in Task 2)

- If `migrateCharacters` references `defaultStatuses`, update the import to come from `$lib/constants`

## Verification

- `npm run check` passes
- `npm run build` succeeds
- Grep for `const defaultStatuses` should find only 1 result (in `src/lib/constants.ts`)
- Grep for `NOTION_API_URL` as a `const` declaration should find only 1 result (in `src/lib/constants.ts`)
- Grep for `NOTION_VERSION` as a `const` declaration should find only 1 result (in `src/lib/constants.ts`)
- Test: Creating new characters/enemies still gets correct default statuses
- Test: Notion search still works from CharacterCard modal
- Test: Player view still renders status badges correctly
