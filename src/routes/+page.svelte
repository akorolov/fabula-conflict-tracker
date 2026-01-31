<script lang="ts">
	import { browser } from '$app/environment';
	import CharacterCard from '$lib/components/CharacterCard.svelte';

	interface Character {
		id: number;
		name: string;
		hp: number;
		maxHp: number;
		mp: number;
		maxMp: number;
	}

	const defaultHeroes: Character[] = [
		{ id: 1, name: 'Momo', hp: 45, maxHp: 45, mp: 30, maxMp: 30 },
		{ id: 2, name: 'Yuuki', hp: 60, maxHp: 60, mp: 20, maxMp: 20 },
		{ id: 3, name: 'Lyra', hp: 35, maxHp: 35, mp: 50, maxMp: 50 },
		{ id: 7, name: 'Ainsley', hp: 35, maxHp: 35, mp: 50, maxMp: 50 }
	];

	const defaultEnemies: Character[] = [
		{ id: 4, name: 'Monster 1', hp: 20, maxHp: 20, mp: 5, maxMp: 5 },
		{ id: 5, name: 'Monster 2', hp: 40, maxHp: 40, mp: 10, maxMp: 10 },
		{ id: 6, name: 'Monster 3', hp: 25, maxHp: 25, mp: 40, maxMp: 40 }
	];

	function loadFromStorage<T>(key: string, fallback: T): T {
		if (!browser) return fallback;
		const stored = localStorage.getItem(key);
		return stored ? JSON.parse(stored) : fallback;
	}

	let heroes = $state<Character[]>(loadFromStorage('heroes', defaultHeroes));
	let enemies = $state<Character[]>(loadFromStorage('enemies', defaultEnemies));

	$effect(() => {
		if (browser) {
			localStorage.setItem('heroes', JSON.stringify(heroes));
		}
	});

	$effect(() => {
		if (browser) {
			localStorage.setItem('enemies', JSON.stringify(enemies));
		}
	});

	function resetAll() {
		heroes = structuredClone(defaultHeroes);
		enemies = structuredClone(defaultEnemies);
	}
</script>

<div class="container mx-auto p-4 pb-20">
	<h1 class="text-2xl font-bold mb-6 text-center">Fabula Ultima Combat Tracker</h1>

	<div class="grid grid-cols-2 gap-8">
		<div>
			<h2 class="text-lg font-semibold mb-3 text-success">Players</h2>
			<div class="flex flex-col gap-3">
				{#each heroes as hero (hero.id)}
					<CharacterCard
						bind:name={hero.name}
						bind:hp={hero.hp}
						maxHp={hero.maxHp}
						bind:mp={hero.mp}
						maxMp={hero.maxMp}
					/>
				{/each}
			</div>
		</div>

		<div>
			<h2 class="text-lg font-semibold mb-3 text-error">Enemies</h2>
			<div class="flex flex-col gap-3">
				{#each enemies as enemy (enemy.id)}
					<CharacterCard
						bind:name={enemy.name}
						bind:hp={enemy.hp}
						maxHp={enemy.maxHp}
						bind:mp={enemy.mp}
						maxMp={enemy.maxMp}
					/>
				{/each}
			</div>
		</div>
	</div>
</div>

<div class="fixed bottom-0 left-0 right-0 bg-base-200 border-t border-base-content/10 p-2">
	<div class="container mx-auto flex justify-center gap-2">
		<button type="button" class="btn btn-sm btn-outline" onclick={resetAll}>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
				<path fill-rule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0v2.43l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389 5.5 5.5 0 0 1 9.2-2.466l.312.311h-2.433a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z" clip-rule="evenodd" />
			</svg>
			Reset
		</button>
	</div>
</div>
