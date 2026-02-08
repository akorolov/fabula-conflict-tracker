# Task 6: Extract Shared UI Components

**Depends on:** Tasks 1-5 (types, storage, constants, utils should all be in place)

## Goal

Extract duplicated SVG icons and UI patterns into reusable Svelte components to reduce template duplication.

## Problem

### 1. Crisis bell SVG icon — 3 inline copies

The exact same SVG path (`M17.133 12.632v-1.8a5.406...`) appears in:

- `src/lib/components/CharacterCard.svelte` L368-370 (inside `editingName` block)
- `src/lib/components/CharacterCard.svelte` L387-389 (inside name display block)
- `src/lib/components/PlayerCard.svelte` L40-42

Each is ~4 lines of SVG markup. The only variation is the CSS class for color:
- CharacterCard: `class="w-[20px] h-[20px] text-error"`
- PlayerCard: `class="w-[20px] h-[20px] {hasActed ? 'text-base-100' : 'text-error'}"`

### 2. Two-column layout — 2 copies

The DM page and player page share nearly identical layout structure:

**`src/routes/+page.svelte`** (L160-262):
```html
<div class="h-screen rounded-none flex flex-col">
    <div class="grid grid-cols-[42%_1fr] gap-0">
        <div class="h-screen p-0 bg-neutral-content">
            <h1 class="mb-3">Fabula Ultima Combat Tracker</h1>
            <h2 class="text-center pl-6">Players</h2>
            <!-- left column content -->
        </div>
        <div class="p-4 ... h-screen overflow-auto">
            <h2 class="text-base-100 bg-accent w-full text-right">Enemies</h2>
            <!-- right column content -->
        </div>
    </div>
</div>
```

**`src/routes/player/+page.svelte`** (L98-155): Same structure, minor class differences (`mr-10` only on DM).

### 3. Clock display — structurally similar in 2 files

- DM view (`+page.svelte` L182-236): Full editable clock with visibility toggle, name input, increment/decrement, max input, remove button
- Player view (`player/+page.svelte` L116-130): Read-only display with name and current/max

These differ enough that a shared component would need an `editable` prop, but the base structure is similar.

## Steps

### 1. Create `src/lib/components/CrisisIcon.svelte`

```svelte
<script lang="ts">
    interface Props {
        class?: string;
    }

    let { class: className = 'text-error' }: Props = $props();
</script>

<svg class="w-[20px] h-[20px] {className}" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.133 12.632v-1.8a5.406 5.406 0 0 0-4.154-5.262.955.955 0 0 0 .021-.106V3.1a1 1 0 0 0-2 0v2.364a.955.955 0 0 0 .021.106 5.406 5.406 0 0 0-4.154 5.262v1.8C6.867 15.018 5 15.614 5 16.807 5 17.4 5 18 5.538 18h12.924C19 18 19 17.4 19 16.807c0-1.193-1.867-1.789-1.867-4.175ZM6 6a1 1 0 0 1-.707-.293l-1-1a1 1 0 0 1 1.414-1.414l1 1A1 1 0 0 1 6 6Zm-2 4H3a1 1 0 0 1 0-2h1a1 1 0 1 1 0 2Zm14-4a1 1 0 0 1-.707-1.707l1-1a1 1 0 1 1 1.414 1.414l-1 1A1 1 0 0 1 18 6Zm3 4h-1a1 1 0 1 1 0-2h1a1 1 0 1 1 0 2ZM8.823 19a3.453 3.453 0 0 0 6.354 0H8.823Z"/>
</svg>
```

### 2. Update `src/lib/components/CharacterCard.svelte`

Add import:
```typescript
import CrisisIcon from './CrisisIcon.svelte';
```

Replace the 2 inline crisis SVGs:

**L367-371** (inside `editingName`):
```svelte
<!-- Before -->
{#if inCrisis}
    <svg class="w-[20px] h-[20px] text-error" aria-hidden="true" ...>
    <path d="M17.133 12.632v-1.8a5.406..."/>
    </svg>
{/if}

<!-- After -->
{#if inCrisis}
    <CrisisIcon />
{/if}
```

**L386-390** (inside name display):
```svelte
<!-- Before -->
{#if inCrisis}
    <svg class="w-[20px] h-[20px] text-error" aria-hidden="true" ...>
    <path d="M17.133 12.632v-1.8a5.406..."/>
    </svg>
{/if}

<!-- After -->
{#if inCrisis}
    <CrisisIcon />
{/if}
```

### 3. Update `src/lib/components/PlayerCard.svelte`

Add import:
```typescript
import CrisisIcon from './CrisisIcon.svelte';
```

Replace the inline crisis SVG (L39-42):
```svelte
<!-- Before -->
{#if inCrisis}
    <svg class="w-[20px] h-[20px] {hasActed ? 'text-base-100' : 'text-error'}" aria-hidden="true" ...>
    <path d="M17.133 12.632v-1.8a5.406..."/>
    </svg>
{/if}

<!-- After -->
{#if inCrisis}
    <CrisisIcon class={hasActed ? 'text-base-100' : 'text-error'} />
{/if}
```

### 4. (Optional) Create `src/lib/components/CombatLayout.svelte`

This is a bigger refactor. The layout component would use Svelte 5 snippets to accept content for each section:

```svelte
<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Props {
        leftContent: Snippet;
        rightContent: Snippet;
        rightClass?: string;
    }

    let { leftContent, rightContent, rightClass = '' }: Props = $props();
</script>

<div class="h-screen rounded-none flex flex-col">
    <div class="grid grid-cols-[42%_1fr] gap-0">
        <div class="h-screen p-0 bg-neutral-content">
            <h1 class="mb-3">Fabula Ultima Combat Tracker</h1>
            <h2 class="text-center pl-6">Players</h2>
            {@render leftContent()}
        </div>
        <div class="p-4 h-screen overflow-auto {rightClass}">
            <h2 class="text-base-100 bg-accent w-full text-right">Enemies</h2>
            {@render rightContent()}
        </div>
    </div>
</div>
```

Usage in `src/routes/+page.svelte`:
```svelte
<CombatLayout rightClass="mr-10">
    {#snippet leftContent()}
        <div class="flex flex-col gap-2 p-6">
            {#each heroes as hero (hero.id)}
                <CharacterCard ... />
            {/each}
        </div>
        <!-- Clocks Section -->
        ...
    {/snippet}

    {#snippet rightContent()}
        <div class="flex p-4 flex-col gap-2">
            {#each enemies as enemy (enemy.id)}
                <CharacterCard ... />
            {/each}
        </div>
        ...
    {/snippet}
</CombatLayout>
```

Usage in `src/routes/player/+page.svelte`:
```svelte
<CombatLayout>
    {#snippet leftContent()}
        <div class="flex flex-col gap-2 p-6">
            {#each heroes as hero (hero.id)}
                <PlayerCard ... />
            {/each}
        </div>
        <!-- Visible Clocks -->
        ...
    {/snippet}

    {#snippet rightContent()}
        <div class="flex p-4 flex-col gap-2">
            {#each enemies as enemy (enemy.id)}
                <PlayerCard ... />
            {/each}
        </div>
        ...
    {/snippet}
</CombatLayout>
```

**Note:** The `CombatLayout` extraction is optional. It saves ~10 lines per page but adds indirection. The `CrisisIcon` extraction (steps 1-3) is the high-value change. Use your judgment on whether the layout component is worth the added abstraction.

### 5. (Optional) Create `src/lib/components/ClockDisplay.svelte`

A unified clock component with an `editable` prop:

```svelte
<script lang="ts">
    import type { Clock } from '$lib/types';

    interface Props {
        clock: Clock;
        editable?: boolean;
        onincrement?: () => void;
        ondecrement?: () => void;
        onremove?: () => void;
    }

    let { clock, editable = false, onincrement, ondecrement, onremove }: Props = $props();
</script>

<div class="flex items-center gap-1 bg-base-100 rounded px-2 py-1 text-sm w-full">
    {#if editable}
        <input
            type="checkbox"
            bind:checked={clock.visible}
            class="checkbox checkbox-xs checkbox-primary"
            title="Show on player view"
        />
        <input
            type="text"
            bind:value={clock.name}
            class="input input-xs flex-1 bg-transparent border-none p-0 focus:outline-none"
        />
        <button
            type="button"
            class="btn btn-xs btn-ghost btn-circle"
            onclick={ondecrement}
            disabled={clock.current === 0}
        >-</button>
    {:else}
        <span class="flex-1">{clock.name}</span>
    {/if}

    <span class="font-mono min-w-[3ch] text-center">{clock.current}/{clock.max}</span>

    {#if editable}
        <button
            type="button"
            class="btn btn-xs btn-ghost btn-circle"
            onclick={onincrement}
            disabled={clock.current === clock.max}
        >+</button>
        <input
            type="number"
            bind:value={clock.max}
            min="1"
            class="input input-xs w-10 bg-transparent border-none p-0 text-center focus:outline-none"
            title="Max value"
        />
        <button
            type="button"
            class="btn btn-xs btn-ghost btn-circle text-error"
            onclick={onremove}
            title="Remove clock"
        >x</button>
    {/if}
</div>
```

**Note:** Like the layout, this is optional. The clock UI differs enough between DM and player views that a shared component adds complexity. Prioritize `CrisisIcon` first.

## Verification

- `npm run check` passes
- `npm run build` succeeds
- Test: Crisis bell icon appears on DM view when character HP <= half max
- Test: Crisis bell icon appears on player view with correct color (red normally, white when acted)
- Test: Both DM and player pages render with correct two-column layout (if CombatLayout was extracted)
- Test: Clocks work correctly in both views (if ClockDisplay was extracted)
- Grep for the SVG path `M17.133 12.632` should find only 1 result (in `CrisisIcon.svelte`)
