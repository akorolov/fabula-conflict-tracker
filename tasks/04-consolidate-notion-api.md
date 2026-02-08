# Task 4: Consolidate Notion API Logic

**Depends on:** Task 3 (Notion constants must be in `$lib/constants`)

## Goal

Remove duplicated Notion API query + result-mapping logic from the search server route by reusing the function already in `src/lib/notion.ts`.

## Problem

The search server route (`src/routes/api/notion/search/+server.ts`) duplicates the entire database query and result-mapping logic that already exists in `src/lib/notion.ts` as `searchNotionDatabase()`.

### Duplicated code in `search/+server.ts` (L15-54):

```typescript
const response = await fetch(`${NOTION_API_URL}/databases/${databaseId}/query`, {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': NOTION_VERSION
    },
    body: JSON.stringify({
        filter: query ? {
            property: 'Name',
            title: { contains: query }
        } : undefined,
        page_size: 50
    })
});
// ... error handling ...
const data = await response.json();
const results = data.results.map((page: any) => {
    const titleProp = Object.values(page.properties).find(
        (prop: any) => prop.type === 'title'
    ) as any;
    const name = titleProp?.title?.[0]?.plain_text || 'Unknown';
    return { id: page.id, name };
});
```

### Same logic already in `notion.ts` `searchNotionDatabase()` (L268-312):

```typescript
export async function searchNotionDatabase(
    apiKey: string,
    databaseId: string,
    query?: string
): Promise<{ results: NotionSearchResult[] }> {
    // ... identical query + mapping logic ...
}
```

## Steps

### 1. Update `src/routes/api/notion/search/+server.ts`

Replace the entire file contents with:

```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { searchNotionDatabase } from '$lib/notion';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { apiKey, databaseId, query } = await request.json();

        if (!apiKey || !databaseId) {
            return json({ message: 'API key and database ID are required' }, { status: 400 });
        }

        const data = await searchNotionDatabase(apiKey, databaseId, query);
        return json(data);
    } catch (error) {
        console.error('Notion search error:', error);
        return json({ message: 'Internal server error' }, { status: 500 });
    }
};
```

This:
- Removes the duplicated `NOTION_API_URL` and `NOTION_VERSION` constants (already handled by Task 3)
- Removes the duplicated fetch + result-mapping code (~40 lines)
- Reuses `searchNotionDatabase()` from `$lib/notion.ts`
- Preserves the same request/response contract (input: `{ apiKey, databaseId, query }`, output: `{ results }`)
- Keeps the input validation and error wrapping that the server route adds

### 2. Verify `searchNotionDatabase` error behavior

Currently `searchNotionDatabase()` in `notion.ts` (L291-293) throws on non-OK responses:

```typescript
if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to query Notion database');
}
```

The server route's `catch` block will catch this and return a 500. The old code returned the original Notion status code (`response.status`). If preserving the original status code matters, you could update `searchNotionDatabase` to throw a custom error that includes the status, or adjust the server route's error handling. For simplicity, a generic 500 is acceptable — the fetch endpoint's only consumer is the frontend `CharacterCard.svelte`, which just displays the error message.

### 3. Consider: does `notion.ts` need both client and server usage?

Currently:
- `notion.ts` `searchNotionDatabase()` calls the Notion API directly (server-side capable)
- `notion.ts` `fetchMonsterStatBlock()` calls the Notion API directly (already used by `fetch/+server.ts`)
- The server routes exist to proxy these calls from the browser

The `searchNotionDatabase()` function in `notion.ts` is designed for server-side use. Using it in the server route is correct and intended. The frontend (`CharacterCard.svelte`) calls `/api/notion/search` which then calls `searchNotionDatabase()`.

No changes needed to the fetch endpoint — it already uses `fetchMonsterStatBlock` from `$lib/notion` (see `src/routes/api/notion/fetch/+server.ts` L3, L13).

## Verification

- `npm run check` passes
- `npm run build` succeeds
- Test: Open any enemy's modal in DM view → search for a monster → results appear
- Test: Import a monster → stat block loads correctly
- Test: Settings page "Test Connection" still works (it calls the same `/api/notion/search` endpoint)
- The search server route file should be ~15 lines instead of ~60
