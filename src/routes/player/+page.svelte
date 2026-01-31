<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import PlayerCard from '$lib/components/PlayerCard.svelte';

	interface Statuses {
		dazed: boolean;
		weak: boolean;
		poisoned: boolean;
		shaken: boolean;
		slow: boolean;
		enraged: boolean;
	}

	interface Character {
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

	function loadData() {
		heroes = migrateCharacters(loadFromStorage('heroes', []));
		enemies = migrateCharacters(loadFromStorage('enemies', []));
	}

	onMount(() => {
		loadData();

		// Listen for storage changes from other tabs
		function handleStorage(e: StorageEvent) {
			if (e.key === 'heroes' || e.key === 'enemies') {
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
		</div>
	</div>
</div>
