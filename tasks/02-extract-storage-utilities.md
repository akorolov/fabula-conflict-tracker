# Task 2: Extract Storage Utilities

**Depends on:** Task 1 (shared types must exist first)

## Goal

Consolidate all duplicated localStorage helper functions into `src/lib/storage.ts`.

## Problem

Three functions are duplicated across multiple files:

### `loadFromStorage<T>()` — 3 copies

Identical in all three files:

- `src/routes/+page.svelte` (L59-63)
- `src/routes/player/+page.svelte` (L49-53)
- `src/routes/images/+page.svelte` (L9-13)

```typescript
function loadFromStorage<T>(key: string, fallback: T): T {
    if (!browser) return fallback;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
}
```

### `migrateCharacters()` — 2 copies

Identical in both files:

- `src/routes/+page.svelte` (L65-70)
- `src/routes/player/+page.svelte` (L55-60)

```typescript
function migrateCharacters(characters: Character[]): Character[] {
    return characters.map(char => ({
        ...char,
        statuses: char.statuses ?? { ...defaultStatuses }
    }));
}
```

### Repeated `$effect` save pattern — 5+ instances

This exact pattern (`if (browser) { localStorage.setItem(key, JSON.stringify(value)); }`) appears in:

- `src/routes/+page.svelte` L85-89 (clocks), L110-114 (heroes), L116-120 (enemies), L122-126 (highest_id)
- `src/routes/images/+page.svelte` L19-23 (shared-images), L25-29 (shared-images-next-id)

### Notion config loading — 2 copies

- `src/lib/components/CharacterCard.svelte` L54-58 and L84-86
- `src/routes/settings/+page.svelte` L11-16

## Steps

### 1. Create `src/lib/storage.ts`

```typescript
import { browser } from '$app/environment';
import type { Character } from '$lib/types';
import { defaultStatuses } from '$lib/constants';

/**
 * Load a value from localStorage, returning fallback if not found or not in browser.
 */
export function loadFromStorage<T>(key: string, fallback: T): T {
    if (!browser) return fallback;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
}

/**
 * Save a value to localStorage (no-op outside browser).
 */
export function saveToStorage(key: string, value: unknown): void {
    if (!browser) return;
    localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Ensure older Character records without statuses get default values.
 */
export function migrateCharacters(characters: Character[]): Character[] {
    return characters.map(char => ({
        ...char,
        statuses: char.statuses ?? { ...defaultStatuses }
    }));
}

/**
 * Load Notion API key and database ID from localStorage.
 */
export function loadNotionConfig(): { apiKey: string; databaseId: string } {
    return {
        apiKey: loadFromStorage('notion-api-key', '') || (browser ? localStorage.getItem('notion-api-key') || '' : ''),
        databaseId: loadFromStorage('notion-database-id', '') || (browser ? localStorage.getItem('notion-database-id') || '' : '')
    };
}
```

Note: `loadNotionConfig` uses `localStorage.getItem` directly because these values are stored as plain strings, not JSON. Adjust implementation to match how the settings page saves them (it uses `localStorage.setItem('notion-api-key', apiKey)` directly, not `JSON.stringify`).

A simpler version:

```typescript
export function loadNotionConfig(): { apiKey: string; databaseId: string } {
    if (!browser) return { apiKey: '', databaseId: '' };
    return {
        apiKey: localStorage.getItem('notion-api-key') || '',
        databaseId: localStorage.getItem('notion-database-id') || ''
    };
}
```

### 2. Update `src/routes/+page.svelte`

- Remove local `loadFromStorage` (L59-63) and `migrateCharacters` (L65-70)
- Add import: `import { loadFromStorage, saveToStorage, migrateCharacters } from '$lib/storage';`
- Optionally replace the repeated `$effect` blocks (L85-89, L110-126) with `saveToStorage()` calls:

```typescript
// Before (repeated 4 times):
$effect(() => {
    if (browser) {
        localStorage.setItem('heroes', JSON.stringify(heroes));
    }
});

// After:
$effect(() => { saveToStorage('heroes', heroes); });
$effect(() => { saveToStorage('enemies', enemies); });
$effect(() => { saveToStorage('highest_id', highest_id); });
$effect(() => { saveToStorage('clocks', clocks); });
```

The `import { browser }` can be removed from this file if no other code uses it directly.

### 3. Update `src/routes/player/+page.svelte`

- Remove local `loadFromStorage` (L49-53) and `migrateCharacters` (L55-60)
- Add import: `import { loadFromStorage, migrateCharacters } from '$lib/storage';`
- The `import { browser }` can be removed if no other code uses it.

### 4. Update `src/routes/images/+page.svelte`

- Remove local `loadFromStorage` (L9-13)
- Add import: `import { loadFromStorage, saveToStorage } from '$lib/storage';`
- Replace the two `$effect` save blocks (L19-29) with `saveToStorage()` calls
- The `import { browser }` can be removed if no other code uses it.

### 5. Update `src/lib/components/CharacterCard.svelte`

- Replace the Notion config loading at L54-58 and L84-86 with `loadNotionConfig()`:
  ```typescript
  import { loadNotionConfig } from '$lib/storage';
  // ...
  $effect(() => {
      const config = loadNotionConfig();
      notionApiKey = config.apiKey;
      notionDatabaseId = config.databaseId;
  });
  ```
- Do the same for the `openModal()` function (L84-86)

### 6. Update `src/routes/settings/+page.svelte`

- Replace L11-16 with `loadNotionConfig()`:
  ```typescript
  import { loadNotionConfig } from '$lib/storage';
  // ...
  $effect(() => {
      const config = loadNotionConfig();
      apiKey = config.apiKey;
      databaseId = config.databaseId;
  });
  ```

## Verification

- `npm run check` passes
- `npm run build` succeeds
- Grep for `function loadFromStorage` should find only 1 result (in `src/lib/storage.ts`)
- Grep for `function migrateCharacters` should find only 1 result (in `src/lib/storage.ts`)
- Test: DM view state persists across page refresh
- Test: Player view syncs when DM makes changes in another tab
- Test: Images page saves/loads images correctly
- Test: Settings page loads and saves Notion config
- Test: CharacterCard modal loads Notion config when opened
