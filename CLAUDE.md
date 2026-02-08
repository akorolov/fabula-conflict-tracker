# Fabula Ultima Combat Tracker

A combat tracker for the Fabula Ultima TTRPG, built with SvelteKit, Tailwind CSS, and DaisyUI.

## Tech Stack

- **Framework**: SvelteKit 2 with Svelte 5 (using runes: `$state`, `$derived`, `$derived.by`, `$bindable`, `$props`, `$effect`)
- **Styling**: Tailwind CSS 4 + DaisyUI 5
- **Theme**: autumn (custom colors configured in `app.css`, set via `data-theme="autumn"` in `app.html`)
- **Fonts**: Ghibli (custom, `static/assets/`) for headings, PT Sans (Google Fonts) for body
- **Persistence**: localStorage for all client-side data
- **External API**: Notion API (v2022-06-28) for monster stat block imports
- **Deployment**: Vercel via `@sveltejs/adapter-vercel`
- **Rendering**: SSR disabled, static prerendering (`+layout.ts`: `ssr = false`, `prerender = true`)

## Project Structure

```
src/
├── app.css                              # Global styles, DaisyUI theme config, custom fonts
├── app.html                             # Root HTML template (autumn theme)
├── app.d.ts                             # TypeScript declarations
├── lib/
│   ├── index.ts                         # Type exports (MonsterStatBlock)
│   ├── notion.ts                        # Notion API integration (search, fetch, parse)
│   ├── assets/
│   │   └── favicon.svg
│   └── components/
│       ├── CharacterCard.svelte         # Editable character card (DM view)
│       ├── PlayerCard.svelte            # Read-only character card (player view)
│       └── StatBlock.svelte             # Monster stat block display
└── routes/
    ├── +layout.svelte                   # Root layout (CSS imports)
    ├── +layout.ts                       # Prerender + SSR config
    ├── +page.svelte                     # Main combat tracker (DM view)
    ├── layout.css                       # Tailwind imports
    ├── player/
    │   └── +page.svelte                 # Player view (read-only, cross-tab sync)
    ├── settings/
    │   └── +page.svelte                 # Notion API key/database configuration
    ├── images/
    │   └── +page.svelte                 # Drag-and-drop image sharing
    └── api/notion/
        ├── search/+server.ts            # POST: Search Notion database by name
        └── fetch/+server.ts             # POST: Fetch monster stat block from Notion
```

## Architecture

### Pages & Routes

| Route | Purpose |
|-------|---------|
| `/` | DM combat tracker — two-column layout (heroes left, enemies right) with full editing, clocks, scratchpad, and action menu |
| `/player` | Player view — read-only display synced from DM view via `storage` events. Shows character status, visible clocks, and shared images |
| `/settings` | Notion API configuration — API key and database ID input with connection test |
| `/images` | Image sharing — drag-and-drop/paste upload, stored as base64 data URLs, displayed on player view |

### Components

- **`CharacterCard.svelte`** — Full-featured editable card used in DM view. Props are `$bindable` for two-way binding. Supports inline name/HP/MP editing with math expressions, status condition toggles, crisis indicator, and per-enemy modal with Notion search or image paste fallback.
- **`PlayerCard.svelte`** — Simplified read-only card for player view. Shows name, HP bar, active statuses, and acted state.
- **`StatBlock.svelte`** — Renders a `MonsterStatBlock` with stats grid, affinity colors, attacks, spells, actions, and special rules.

### Key Data Types

```typescript
interface Character {
  id: number; name: string;
  hp: number; maxHp: number;
  mp: number; maxMp: number;
  hasActed: boolean; player: boolean;
  statuses: Statuses;
}

interface Statuses {
  dazed: boolean; weak: boolean; poisoned: boolean;
  shaken: boolean; slow: boolean; enraged: boolean;
}

interface Clock {
  id: number; name: string;
  current: number; max: number; visible: boolean;
}

interface MonsterStatBlock {
  name: string; level: number; rank: string; species: string;
  traits: string; description: string;
  maxHp: number; maxMp: number; crisis: number;
  initiative: number; defBonus: number; mDefBonus: number;
  attributes: { mig: string; dex: string; ins: string; wlp: string };
  affinities: { air, bolt, dark, earth, fire, ice, light, physical, poison: string };
  basicAttacks: string[]; spells: string[];
  otherActions: string[]; specialRules: string[];
}
```

### State Management

All state uses Svelte 5 runes. Key patterns:

- **`$state`** for reactive variables (heroes, enemies, clocks, scratchpad)
- **`$bindable()`** on CharacterCard props for two-way parent-child binding
- **`$derived` / `$derived.by()`** for computed values (crisis state, active statuses)
- **`$effect`** for localStorage persistence — state changes auto-save to localStorage
- **Cross-tab sync**: Player view listens to `window.storage` events to react to DM changes in real time

### localStorage Keys

| Key | Data |
|-----|------|
| `heroes` | Hero character array |
| `enemies` | Enemy character array |
| `highest_id` | ID counter for new characters |
| `clocks` | Clock array (synced but not restored on refresh) |
| `shared-images` | Image array `{ id, dataUrl }` |
| `shared-images-next-id` | Image ID counter |
| `notion-api-key` | Notion API key |
| `notion-database-id` | Notion database ID |
| `enemy-statblock-{id}` | Per-enemy parsed stat block |
| `enemy-image-{id}` | Per-enemy fallback image |

### Notion Integration

`src/lib/notion.ts` handles all Notion API communication:

1. **Search** — queries a Notion database by monster name via title filter
2. **Fetch** — retrieves page properties + child blocks, parses into `MonsterStatBlock`
3. **Property parsing** — handles multiple naming conventions (e.g., `level`/`lvl`, `max hp`/`maxhp`/`hp`)
4. **Block parsing** — extracts name from h1, sections from h2, abilities from paragraphs

API endpoints in `src/routes/api/notion/` proxy requests to the Notion API, accepting `apiKey` in the POST body.

### Data Flow

```
DM Input → $state → Component Rendering
                  → $effect → localStorage
                                ├→ Player View (onMount + storage events)
                                └→ Notion API endpoints → notion.ts → Notion API
```

## Key Features

- **Editable character names**: Click to edit, Enter or blur to save
- **Editable HP/MP**: Click to edit with math expression support (`+5`, `-10`, `60+5`, `44-10`)
- **Crisis indicator**: Red exclamation icon when HP <= floor(maxHp / 2)
- **Status conditions**: 6 toggleable conditions (dazed, weak, poisoned, shaken, slow, enraged)
- **Turn tracking**: hasActed checkbox per character, Reset Round to clear all
- **Clock system**: Named progress clocks with visibility toggle for player view
- **Notion monster import**: Search and import stat blocks from a Notion database
- **Image sharing**: Drag-and-drop/paste images visible on player view
- **Cross-tab player view**: Real-time sync via localStorage events
- **localStorage persistence**: All changes auto-saved and restored on refresh

## Development

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run check    # Run type checking
```

---

## Svelte MCP Tools

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.
