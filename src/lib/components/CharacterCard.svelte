<script lang="ts">
	import { browser } from '$app/environment';
	import { fade } from 'svelte/transition';
	import StatBlock from './StatBlock.svelte';
	import type { MonsterStatBlock } from '$lib/index'

	interface Statuses {
		dazed: boolean;
		weak: boolean;
		poisoned: boolean;
		shaken: boolean;
		slow: boolean;
		enraged: boolean;
	}

	interface Props {
		id: number;
		name: string;
		hp: number;
		maxHp: number;
		mp: number;
		maxMp: number;
		hasActed: boolean;
		player: boolean;
		statuses: Statuses;
		onremove?: () => void;
	}

	let { id, name = $bindable(), hp = $bindable(), maxHp = $bindable(), mp = $bindable(), maxMp = $bindable(), hasActed = $bindable(), player = $bindable(), statuses = $bindable(), onremove }: Props = $props();

	let modalOpen = $state(false);

	// Notion configuration
	let notionApiKey = $state('');
	let notionDatabaseId = $state('');
	let notionConfigured = $derived(!!notionApiKey && !!notionDatabaseId);

	// Notion search state
	let searchQuery = $state('');
	let searchResults = $state<Array<{ id: string; name: string, maxHp: number, maxMp: number }>>([]);
	let isSearching = $state(false);
	let searchError = $state('');

	// Stat block state
	let statBlockData = $state<MonsterStatBlock | null>(null);
	let isLoadingStatBlock = $state(false);

	// Legacy image state (fallback when Notion not configured)
	let statBlockImage = $state<string | null>(null);
	let imageWidth = $state<number | null>(null);
	let imageHeight = $state<number | null>(null);

	// Load Notion config and data on mount
	$effect(() => {
		if (browser) {
			notionApiKey = localStorage.getItem('notion-api-key') || '';
			notionDatabaseId = localStorage.getItem('notion-database-id') || '';
		}
	});

	// Save stat block to localStorage when it changes
	$effect(() => {
		if (browser && !player && modalOpen && statBlockData !== null) {
			localStorage.setItem(`enemy-statblock-${id}`, JSON.stringify(statBlockData));
		}
	});

	// Save image to localStorage when it changes
	$effect(() => {
		if (browser && !player && statBlockImage !== null) {
			const data = JSON.stringify({
				image: statBlockImage,
				width: imageWidth,
				height: imageHeight
			});
			localStorage.setItem(`enemy-image-${id}`, data);
		}
	});

	function openModal() {
		if (!player) {
			modalOpen = true;
			// Refresh Notion config when opening modal
			if (browser) {
				notionApiKey = localStorage.getItem('notion-api-key') || '';
				notionDatabaseId = localStorage.getItem('notion-database-id') || '';

				// Try to load stat block first
				const storedStatBlock = localStorage.getItem(`enemy-statblock-${id}`);
				if (storedStatBlock) {
					try {
						statBlockData = JSON.parse(storedStatBlock);
					} catch {
						statBlockData = null;
					}
				}

				// Load image as fallback
				const storedImage = localStorage.getItem(`enemy-image-${id}`);
				if (storedImage) {
					try {
						const data = JSON.parse(storedImage);
						statBlockImage = data.image;
						imageWidth = data.width;
						imageHeight = data.height;
					} catch {
						statBlockImage = storedImage;
					}
				}
			}
		}
	}

	function closeModal() {
		modalOpen = false;
		searchQuery = '';
		searchResults = [];
		searchError = '';
	}

	async function searchNotion() {
		if (!notionConfigured || !searchQuery.trim()) {
			searchResults = [];
			return;
		}

		isSearching = true;
		searchError = '';

		try {
			const response = await fetch('/api/notion/search', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					apiKey: notionApiKey,
					databaseId: notionDatabaseId,
					query: searchQuery
				})
			});

			if (response.ok) {
				const data = await response.json();
				searchResults = data.results || [];
			} else {
				const error = await response.json();
				searchError = error.message || 'Search failed';
				searchResults = [];
			}
		} catch (err) {
			searchError = 'Network error';
			searchResults = [];
		} finally {
			isSearching = false;
		}
	}

	async function importMonster(pageId: string, monsterName: string) {
		isLoadingStatBlock = true;
		searchError = '';

		try {
			const response = await fetch('/api/notion/fetch', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					apiKey: notionApiKey,
					pageId
				})
			});

			if (response.ok) {
				const data = await response.json();
				statBlockData = data.statBlock;
				// Update the enemy name to match the imported monster
				name = monsterName;
				maxHp = statBlockData?.maxHp || 0;
				hp = maxHp;
				maxMp = statBlockData?.maxMp || 0;
				mp = maxMp;
				// Clear search
				searchQuery = '';
				searchResults = [];
			} else {
				const error = await response.json();
				searchError = error.message || 'Failed to import monster';
			}
		} catch (err) {
			searchError = 'Network error';
		} finally {
			isLoadingStatBlock = false;
		}
	}

	function clearStatBlock() {
		statBlockData = null;
		if (browser) {
			localStorage.removeItem(`enemy-statblock-${id}`);
		}
	}

	function handlePaste(e: ClipboardEvent) {
		const items = e.clipboardData?.items;
		if (!items) return;

		for (const item of items) {
			if (item.type.startsWith('image/')) {
				const file = item.getAsFile();
				if (file) {
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
				break;
			}
		}
	}

	function clearImage() {
		statBlockImage = null;
		if (browser) {
			localStorage.removeItem(`enemy-image-${id}`);
		}
	}

	function handleCardClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (
			target.closest('button') ||
			target.closest('input') ||
			target.closest('a') ||
			target.tagName === 'BUTTON' ||
			target.tagName === 'INPUT'
		) {
			return;
		}
		openModal();
	}

	let searchTimeout: ReturnType<typeof setTimeout>;
	function handleSearchInput() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			searchNotion();
		}, 300);
	}

	let inCrisis = $derived.by(() => hp <= Math.floor(maxHp / 2));

	let editingName = $state(false);
	let editingHp = $state(false);
	let editingMp = $state(false);

	let hpInput = $state('');
	let mpInput = $state('');

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

	function startEditingName() {
		editingName = true;
	}

	function saveName() {
		editingName = false;
	}

	function handleNameKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') saveName();
	}

	function startEditingHp() {
		hpInput = String(hp);
		editingHp = true;
	}

	function saveHp() {
		hp = Math.round(evaluateMath(hpInput, hp));
		editingHp = false;
	}

	function handleHpKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') saveHp();
	}

	function startEditingMp() {
		mpInput = String(mp);
		editingMp = true;
	}

	function saveMp() {
		mp = Math.round(evaluateMath(mpInput, mp));
		editingMp = false;
	}

	function handleMpKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') saveMp();
	}

	function autofocus(node: HTMLInputElement) {
		node.focus();
		node.select();
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="card bg-base-100 rounded-lg {hasActed ? 'border-3 border-primary' : 'border border-base-content/10'} {!player ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}"
	onclick={!player ? handleCardClick : undefined}
>
	<div class="card-body p-3 flex-row items-center justify-between">
		{#if !player && onremove}
			<button type="button" class="btn btn-ghost btn-sm btn-square text-error" onclick={onremove} aria-label="Remove character">
				<svg class="w-[20px] h-[20px]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
				<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5v14m-6-8h6m-6 4h6m4.506-1.494L15.012 12m0 0 1.506-1.506M15.012 12l1.506 1.506M15.012 12l-1.506-1.506M20 19H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1Z"/>
				</svg>
			</button>
		{/if}
		<div class="flex-1">
		{#if editingName}
			<div class="flex items-center gap-1">
				{#if inCrisis}
					<svg class="w-[20px] h-[20px] text-error" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
					<path d="M17.133 12.632v-1.8a5.406 5.406 0 0 0-4.154-5.262.955.955 0 0 0 .021-.106V3.1a1 1 0 0 0-2 0v2.364a.955.955 0 0 0 .021.106 5.406 5.406 0 0 0-4.154 5.262v1.8C6.867 15.018 5 15.614 5 16.807 5 17.4 5 18 5.538 18h12.924C19 18 19 17.4 19 16.807c0-1.193-1.867-1.789-1.867-4.175ZM6 6a1 1 0 0 1-.707-.293l-1-1a1 1 0 0 1 1.414-1.414l1 1A1 1 0 0 1 6 6Zm-2 4H3a1 1 0 0 1 0-2h1a1 1 0 1 1 0 2Zm14-4a1 1 0 0 1-.707-1.707l1-1a1 1 0 1 1 1.414 1.414l-1 1A1 1 0 0 1 18 6Zm3 4h-1a1 1 0 1 1 0-2h1a1 1 0 1 1 0 2ZM8.823 19a3.453 3.453 0 0 0 6.354 0H8.823Z"/>
					</svg>
				{/if}
				<input
					bind:value={name}
					onkeydown={handleNameKeydown}
					onblur={saveName}
					class="input input-sm input-ghost text-base font-bold p-0 h-auto min-h-0"
					use:autofocus
				/>
			</div>
		{:else}
			<button
				type="button"
				class="card-title text-base cursor-text hover:text-primary text-left flex items-center gap-1"
				onclick={startEditingName}
			>
				{#if inCrisis}
					<svg class="w-[20px] h-[20px] text-error" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
					<path d="M17.133 12.632v-1.8a5.406 5.406 0 0 0-4.154-5.262.955.955 0 0 0 .021-.106V3.1a1 1 0 0 0-2 0v2.364a.955.955 0 0 0 .021.106 5.406 5.406 0 0 0-4.154 5.262v1.8C6.867 15.018 5 15.614 5 16.807 5 17.4 5 18 5.538 18h12.924C19 18 19 17.4 19 16.807c0-1.193-1.867-1.789-1.867-4.175ZM6 6a1 1 0 0 1-.707-.293l-1-1a1 1 0 0 1 1.414-1.414l1 1A1 1 0 0 1 6 6Zm-2 4H3a1 1 0 0 1 0-2h1a1 1 0 1 1 0 2Zm14-4a1 1 0 0 1-.707-1.707l1-1a1 1 0 1 1 1.414 1.414l-1 1A1 1 0 0 1 18 6Zm3 4h-1a1 1 0 1 1 0-2h1a1 1 0 1 1 0 2ZM8.823 19a3.453 3.453 0 0 0 6.354 0H8.823Z"/>
					</svg>
				{/if}
				{name}
			</button>
		{/if}

		<div class="flex gap-2 flex-wrap text-sm mt-2">
			{#if !player}
			<div class="flex items-center gap-1">
				<span class="font-semibold text-error">HP</span>
				{#if editingHp}
					<input
						bind:value={hpInput}
						onkeydown={handleHpKeydown}
						onblur={saveHp}
						class="input input-xs input-ghost w-16 p-0 h-auto min-h-0 text-center"
						use:autofocus
					/>
				{:else}
					<button
						type="button"
						class="cursor-text hover:text-primary"
						onclick={startEditingHp}
					>
						{hp}/{maxHp}
					</button>
				{/if}
			</div>
			<div class="flex items-center gap-1">
				<span class="font-semibold text-info">MP</span>
				{#if editingMp}
					<input
						bind:value={mpInput}
						onkeydown={handleMpKeydown}
						onblur={saveMp}
						class="input input-xs input-ghost w-16 p-0 h-auto min-h-0 text-center"
						use:autofocus
					/>
				{:else}
					<button
						type="button"
						class="cursor-text hover:text-primary"
						onclick={startEditingMp}
					>
						{mp}/{maxMp}
					</button>
				{/if}
			</div>
			{/if}
			<div class="join">
				<input class="join-item btn btn-ghost btn-xs btn-secondary rounded-none" type="checkbox" aria-label="dazed" bind:checked={statuses.dazed} />
				<input class="join-item btn btn-ghost btn-xs btn-secondary rounded-none" type="checkbox" aria-label="weak" bind:checked={statuses.weak} />
				<input class="join-item btn btn-ghost btn-xs btn-secondary rounded-none" type="checkbox" aria-label="poisoned" bind:checked={statuses.poisoned} />
				<input class="join-item btn btn-ghost btn-xs btn-secondary rounded-none" type="checkbox" aria-label="shaken" bind:checked={statuses.shaken} />
				<input class="join-item btn btn-ghost btn-xs btn-secondary rounded-none" type="checkbox" aria-label="slow" bind:checked={statuses.slow} />
				<input class="join-item btn btn-ghost btn-xs btn-secondary rounded-none" type="checkbox" aria-label="enraged" bind:checked={statuses.enraged} />
			</div>
		</div>

		</div>
		<input type="checkbox" class="checkbox checkbox-primary checkbox-lg rounded-sm" bind:checked={hasActed} />
	</div>
</div>

{#if modalOpen && !player}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
		onclick={closeModal}
		onkeydown={(e) => e.key === 'Escape' && closeModal()}
		transition:fade={{ duration: 150 }}
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="bg-base-100 rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-auto p-4"
			onclick={(e) => e.stopPropagation()}
			onpaste={handlePaste}
		>
			<div class="flex justify-between items-center mb-4">
				<h3 class="text-lg font-bold">{name} - Stat Block</h3>
				<button type="button" class="btn btn-ghost btn-sm btn-square" onclick={closeModal} aria-label="Close modal">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			{#if notionConfigured}
				<!-- Notion Search Mode -->
				{#if statBlockData}
					<!-- Display imported stat block -->
					<div class="relative">
						<button
							type="button"
							class="btn btn-ghost btn-sm absolute top-0 right-0 z-10"
							onclick={clearStatBlock}
							aria-label="Clear stat block"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
							Clear
						</button>
						<StatBlock statBlock={statBlockData} />
					</div>
				{:else}
					<!-- Search interface -->
					<div class="space-y-4">
						<div class="form-control">
							<div class="join w-full">
								<input
									type="text"
									bind:value={searchQuery}
									oninput={handleSearchInput}
									placeholder="Search for a monster..."
									class="input input-bordered join-item flex-1"
								/>
								<button
									type="button"
									class="btn btn-primary join-item"
									onclick={searchNotion}
									disabled={isSearching}
								>
									{#if isSearching}
										<span class="loading loading-spinner loading-sm"></span>
									{:else}
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
										</svg>
									{/if}
								</button>
							</div>
						</div>

						{#if searchError}
							<div class="alert alert-error">
								<span>{searchError}</span>
							</div>
						{/if}

						{#if searchResults.length > 0}
							<div class="border rounded-lg divide-y">
								{#each searchResults as result}
									<button
										type="button"
										class="w-full px-4 py-3 text-left hover:bg-base-200 transition-colors flex justify-between items-center"
										onclick={() => importMonster(result.id, result.name)}
										disabled={isLoadingStatBlock}
									>
										<span class="font-medium">{result.name}</span>
										{#if isLoadingStatBlock}
											<span class="loading loading-spinner loading-sm"></span>
										{:else}
											<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
											</svg>
										{/if}
									</button>
								{/each}
							</div>
						{:else if searchQuery && !isSearching}
							<div class="text-center text-base-content/60 py-8">
								No monsters found matching "{searchQuery}"
							</div>
						{:else}
							<div class="text-center text-base-content/60 py-8">
								<p class="text-lg mb-2">Search your Notion Bestiary</p>
								<p class="text-sm">Type a monster name above to search</p>
							</div>
						{/if}
					</div>
				{/if}
			{/if}
			<!-- Fallback: Image paste mode -->
				{#if statBlockImage}
					<div class="relative">
						<img
							src={statBlockImage}
							alt="Stat block for {name}"
							class="max-w-full rounded"
							width={imageWidth ? imageWidth / 2 : undefined}
							height={imageHeight ? imageHeight / 2 : undefined}
						/>
						<button
							type="button"
							class="btn btn-ghost btn-error btn-sm btn-square absolute top-2 right-2"
							onclick={clearImage}
							aria-label="Clear image"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				{:else}
					<div class="border-2 border-dashed border-base-300 rounded-lg p-8 text-center text-base-content/60">
						<p class="text-lg mb-2">Paste an image here</p>
						<p class="text-sm mb-4">Use Ctrl+V (or Cmd+V on Mac) to paste a stat block image</p>
					</div>
				{/if}
			
		</div>
	</div>
{/if}
