# Task 5: Extract Utility Functions and Svelte Actions

**Depends on:** Tasks 1-3 (types/constants/storage should be in place)

## Goal

Extract duplicated utility functions and reusable Svelte actions into shared modules.

## Problem

### 1. Crisis calculation — 2 copies

- `src/lib/components/CharacterCard.svelte` (L263): `let inCrisis = $derived.by(() => hp <= Math.floor(maxHp / 2));`
- `src/lib/components/PlayerCard.svelte` (L21): `let inCrisis = $derived(hp <= Math.floor(maxHp / 2));`

### 2. `evaluateMath()` — exists only in CharacterCard but is general-purpose

- `src/lib/components/CharacterCard.svelte` (L272-302)

```typescript
function evaluateMath(expr: string, currentValue: number): number {
    const trimmed = expr.trim();
    if (!trimmed) return currentValue;

    if (trimmed.startsWith('+') || trimmed.startsWith('-')) {
        const num = parseFloat(trimmed);
        if (!isNaN(num)) {
            return currentValue + num;
        }
    }

    const match = trimmed.match(/^(\d+)\s*([+\-*/])\s*(\d+)$/);
    if (match) {
        const a = parseFloat(match[1]);
        const op = match[2];
        const b = parseFloat(match[3]);
        switch (op) {
            case '+': return a + b;
            case '-': return a - b;
            case '*': return a * b;
            case '/': return b !== 0 ? a / b : currentValue;
        }
    }

    const num = parseFloat(trimmed);
    if (!isNaN(num)) {
        return num;
    }

    return currentValue;
}
```

### 3. `autofocus` Svelte action — only in CharacterCard but reusable

- `src/lib/components/CharacterCard.svelte` (L344-347)

```typescript
function autofocus(node: HTMLInputElement) {
    node.focus();
    node.select();
}
```

### 4. Image extraction from clipboard — partially duplicated

- `src/lib/components/CharacterCard.svelte` (L201-232): Complex version with WebP canvas conversion
- `src/routes/images/+page.svelte` (L31-42): Simple version that delegates to `addImageFile()`

Both iterate `clipboardData.items` looking for `image/*` types.

## Steps

### 1. Create `src/lib/utils.ts`

```typescript
/**
 * Check if a character is in crisis (HP at or below half max).
 */
export function isInCrisis(hp: number, maxHp: number): boolean {
    return hp <= Math.floor(maxHp / 2);
}

/**
 * Evaluate a math expression for HP/MP editing.
 * Supports: relative (+5, -10), absolute (50), and expressions (60+5, 44-10).
 */
export function evaluateMath(expr: string, currentValue: number): number {
    const trimmed = expr.trim();
    if (!trimmed) return currentValue;

    if (trimmed.startsWith('+') || trimmed.startsWith('-')) {
        const num = parseFloat(trimmed);
        if (!isNaN(num)) {
            return currentValue + num;
        }
    }

    const match = trimmed.match(/^(\d+)\s*([+\-*/])\s*(\d+)$/);
    if (match) {
        const a = parseFloat(match[1]);
        const op = match[2];
        const b = parseFloat(match[3]);
        switch (op) {
            case '+': return a + b;
            case '-': return a - b;
            case '*': return a * b;
            case '/': return b !== 0 ? a / b : currentValue;
        }
    }

    const num = parseFloat(trimmed);
    if (!isNaN(num)) {
        return num;
    }

    return currentValue;
}

/**
 * Extract the first image File from a ClipboardEvent, or null if none found.
 */
export function extractImageFromClipboard(e: ClipboardEvent): File | null {
    const items = e.clipboardData?.items;
    if (!items) return null;

    for (const item of items) {
        if (item.type.startsWith('image/')) {
            return item.getAsFile();
        }
    }
    return null;
}
```

### 2. Create `src/lib/actions.ts`

```typescript
/**
 * Svelte action: focuses and selects the input on mount.
 * Usage: <input use:autofocus />
 */
export function autofocus(node: HTMLInputElement) {
    node.focus();
    node.select();
}
```

### 3. Update `src/lib/components/CharacterCard.svelte`

- Add imports:
  ```typescript
  import { isInCrisis, evaluateMath, extractImageFromClipboard } from '$lib/utils';
  import { autofocus } from '$lib/actions';
  ```

- Replace crisis `$derived` (L263):
  ```typescript
  // Before:
  let inCrisis = $derived.by(() => hp <= Math.floor(maxHp / 2));
  // After:
  let inCrisis = $derived(isInCrisis(hp, maxHp));
  ```

- Remove local `evaluateMath` function (L272-302). The `saveHp` (L321-323) and `saveMp` (L335-337) functions already call `evaluateMath()` — they'll now use the imported version.

- Remove local `autofocus` function (L344-347). The `use:autofocus` directives in the template (L377, L405, L424) will use the imported version.

- Simplify `handlePaste` (L201-232) using `extractImageFromClipboard`:
  ```typescript
  function handlePaste(e: ClipboardEvent) {
      const file = extractImageFromClipboard(e);
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
              imageWidth = img.width;
              imageHeight = img.height;

              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                  ctx.drawImage(img, 0, 0);
                  statBlockImage = canvas.toDataURL('image/webp', 0.8);
              }
          };
          img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
  }
  ```

### 4. Update `src/lib/components/PlayerCard.svelte`

- Add import: `import { isInCrisis } from '$lib/utils';`
- Replace crisis `$derived` (L21):
  ```typescript
  // Before:
  let inCrisis = $derived(hp <= Math.floor(maxHp / 2));
  // After:
  let inCrisis = $derived(isInCrisis(hp, maxHp));
  ```

### 5. Update `src/routes/images/+page.svelte`

- Add import: `import { extractImageFromClipboard } from '$lib/utils';`
- Simplify `handlePaste` (L31-42):
  ```typescript
  function handlePaste(e: ClipboardEvent) {
      const file = extractImageFromClipboard(e);
      if (file) {
          e.preventDefault();
          addImageFile(file);
      }
  }
  ```

## Verification

- `npm run check` passes
- `npm run build` succeeds
- Test: Click an enemy name in DM view → edit it → Enter saves. Confirms `autofocus` action works.
- Test: Click HP/MP values → type `+5` → value increases by 5. Confirms `evaluateMath` works.
- Test: Characters show crisis bell when HP <= half max. Confirms `isInCrisis` works.
- Test: Paste an image in enemy modal → image appears. Confirms clipboard extraction works.
- Test: Paste an image on `/images` page → image appears.
- Grep for `function evaluateMath` should find only 1 result (in `src/lib/utils.ts`)
- Grep for `function autofocus` should find only 1 result (in `src/lib/actions.ts`)
