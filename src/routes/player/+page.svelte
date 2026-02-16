<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import PlayerCard from '$lib/components/PlayerCard.svelte';
	import type { Statuses, Character, SharedImage, Clock } from '$lib/types';

	const defaultStatuses: Statuses = {
		dazed: false,
		weak: false,
		poisoned: false,
		shaken: false,
		slow: false,
		enraged: false
	};

	function loadFromStorage<T>(key: string, fallback: T): T {
		if (!browser) return fallback;
		const stored = localStorage.getItem(key);
		return stored ? JSON.parse(stored) : fallback;
	}

	function migrateCharacters(characters: Character[]): Character[] {
		return characters.map(char => ({
			...char,
			statuses: char.statuses ?? { ...defaultStatuses }
		}));
	}

	let heroes = $state<Character[]>([]);
	let enemies = $state<Character[]>([]);
	let sharedImages = $state<SharedImage[]>([]);
	let clocks = $state<Clock[]>([]);

	let visibleClocks = $derived(clocks.filter(c => c.visible));

	function loadData() {
		heroes = migrateCharacters(loadFromStorage('heroes', []));
		enemies = migrateCharacters(loadFromStorage('enemies', []));
		sharedImages = loadFromStorage('shared-images', []);
		clocks = loadFromStorage('clocks', []);
	}

	onMount(() => {
		loadData();

		// Listen for storage changes from other tabs
		function handleStorage(e: StorageEvent) {
			if (e.key === 'heroes' || e.key === 'enemies' || e.key === 'shared-images' || e.key === 'clocks') {
				loadData();
			}
		}

		window.addEventListener('storage', handleStorage);

		return () => {
			window.removeEventListener('storage', handleStorage);
		};
	});
</script>

<svelte:head>
	<title>Player View - Combat Tracker</title>
</svelte:head>

<div class="h-screen rounded-none flex flex-col">
	<div class="grid grid-cols-[42%_1fr] gap-0">
		<div class="h-screen p-0 bg-neutral-content">
			<h1 class="mb-3">Fabula Ultima Combat Tracker</h1>
			<h2 class="text-center pl-6">Players</h2>
			<div class="flex flex-col gap-2 p-6">
				{#each heroes as hero (hero.id)}
					<PlayerCard
						name={hero.name}
						hp={hero.hp}
						maxHp={hero.maxHp}
						hasActed={hero.hasActed}
						statuses={hero.statuses}
					/>
				{/each}
			</div>

			<!-- Clocks Section -->
			{#if visibleClocks.length > 0}
				<div class="px-6 pb-4">
					<div class="flex items-center gap-2 mb-2">
						<h3 class="text-sm font-semibold">Clocks</h3>
					</div>
					<div class="flex flex-col gap-2">
						{#each visibleClocks as clock (clock.id)}
							<div class="flex items-center gap-1 bg-base-100 rounded px-2 py-1 text-sm w-full">
								<span class="flex-1">{clock.name}</span>
								<span class="font-mono min-w-[3ch] text-center">{clock.current}/{clock.max}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
		<div class="p-4 h-screen overflow-auto">
			<h2 class="text-base-100 bg-accent w-full text-right">Enemies</h2>
			<div class="flex p-4 flex-col gap-2">
				{#each enemies as enemy (enemy.id)}
					<PlayerCard
						name={enemy.name}
						hp={enemy.hp}
						maxHp={enemy.maxHp}
						hasActed={enemy.hasActed}
						statuses={enemy.statuses}
					/>
				{/each}
			</div>

			{#if sharedImages.length > 0}
				<div class="p-4 flex flex-wrap gap-2 items-start content-start">
					{#each sharedImages as image (image.id)}
						<img src={image.dataUrl} alt="Shared content" class="rounded-lg max-h-48 object-contain shadow-lg" />
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
