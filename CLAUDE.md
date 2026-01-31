# Fabula Ultima Combat Tracker

A combat tracker for the Fabula Ultima TTRPG, built with SvelteKit, Tailwind CSS, and DaisyUI.

## Tech Stack

- **Framework**: SvelteKit with Svelte 5 (using runes: `$state`, `$derived`, `$bindable`, `$props`, `$effect`)
- **Styling**: Tailwind CSS 4 + DaisyUI 5
- **Theme**: garden (configured in `app.html` via `data-theme="garden"`)
- **Persistence**: localStorage for client-side data storage

## Project Structure

- `src/routes/+page.svelte` - Main combat tracker page with heroes and enemies columns
- `src/lib/components/CharacterCard.svelte` - Reusable character card component
- `src/app.css` - Global styles and DaisyUI theme configuration
- `src/app.html` - HTML template with theme attribute

## Key Features

- **Editable character names**: Click to edit, Enter or blur to save
- **Editable HP/MP**: Click to edit with math expression support (`+5`, `-10`, `60+5`, `44-10`)
- **Crisis indicator**: Red exclamation icon appears when HP <= half of max HP (rounded down)
- **localStorage persistence**: All changes are automatically saved and restored on page refresh

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
