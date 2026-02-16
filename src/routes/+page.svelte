<script lang="ts">
	import { browser } from '$app/environment';
	import CharacterCard from '$lib/components/CharacterCard.svelte';
	import type { Statuses, Character, Clock } from '$lib/types';

	const defaultStatuses: Statuses = {
		dazed: false,
		weak: false,
		poisoned: false,
		shaken: false,
		slow: false,
		enraged: false
	};

	let highest_id = $state<number>(loadFromStorage('highest_id', 7));
	
	const defaultHeroes: Character[] = [
		{ id: 1, name: 'Momo', hp: 45, maxHp: 45, mp: 30, maxMp: 30, hasActed: false, player: true, statuses: { ...defaultStatuses } },
		{ id: 2, name: 'Yuuki', hp: 60, maxHp: 60, mp: 20, maxMp: 20, hasActed: false, player: true, statuses: { ...defaultStatuses } },
		{ id: 3, name: 'Lyra', hp: 35, maxHp: 35, mp: 50, maxMp: 50, hasActed: false, player: true, statuses: { ...defaultStatuses } },
		{ id: 7, name: 'Ainsley', hp: 35, maxHp: 35, mp: 50, maxMp: 50, hasActed: false, player: true, statuses: { ...defaultStatuses } }
	];

	const defaultEnemies: Character[] = [
		{ id: 4, name: 'Monster 1', hp: 20, maxHp: 20, mp: 5, maxMp: 5, hasActed: false, player: false, statuses: { ...defaultStatuses } },
		{ id: 5, name: 'Monster 2', hp: 40, maxHp: 40, mp: 10, maxMp: 10, hasActed: false, player: false, statuses: { ...defaultStatuses } },
		{ id: 6, name: 'Monster 3', hp: 25, maxHp: 25, mp: 40, maxMp: 40, hasActed: false, player: false, statuses: { ...defaultStatuses } }
	];

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

	let heroes = $state<Character[]>(migrateCharacters(loadFromStorage('heroes', defaultHeroes)));
	let enemies = $state<Character[]>(migrateCharacters(loadFromStorage('enemies', defaultEnemies)));

	let dmScratchpad = $state<string>(loadFromStorage('dm-scratchpad', ''));
	let sharedScratchpad = $state<string>(loadFromStorage('shared-scratchpad', ''));

	// Clocks (not persisted to localStorage)
	let clockId = $state(0);
	let clocks = $state<Clock[]>([]);

	function addClock() {
		clockId++;
		clocks.push({ id: clockId, name: 'Clock', current: 0, max: 4, visible: false });
	}

	// Sync clocks to localStorage for player page (but don't restore on refresh)
	$effect(() => {
		if (browser) {
			localStorage.setItem('clocks', JSON.stringify(clocks));
		}
	});

	function removeClock(id: number) {
		const index = clocks.findIndex(c => c.id === id);
		if (index !== -1) {
			clocks.splice(index, 1);
		}
	}

	function incrementClock(clock: Clock) {
		if (clock.current < clock.max) {
			clock.current++;
		}
	}

	function decrementClock(clock: Clock) {
		if (clock.current > 0) {
			clock.current--;
		}
	}

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

	$effect(() => {
		if (browser) {
			localStorage.setItem('highest_id', JSON.stringify(highest_id));
		}
	});

	$effect(() => {
		if (browser) {
			localStorage.setItem('dm-scratchpad', JSON.stringify(dmScratchpad));
		}
	});

	$effect(() => {
		if (browser) {
			localStorage.setItem('shared-scratchpad', JSON.stringify(sharedScratchpad));
		}
	});

	function resetAll() {
		enemies.forEach((enemy) => {
			localStorage.removeItem(`enemy-statblock-${enemy.id}`);
			localStorage.removeItem(`enemy-image-${enemy.id}`);
		});
		heroes = structuredClone(defaultHeroes);
		enemies = []
		newEnemy()
		newEnemy()
		newEnemy()
		newEnemy()
	}

	function newRound() {
		heroes.forEach(hero => hero.hasActed = false);
		enemies.forEach(enemy => enemy.hasActed = false);
	}

	function newEnemy() {
		highest_id += 1;
		enemies.push({ id: highest_id, name: 'New Monster', hp: 25, maxHp: 25, mp: 40, maxMp: 40, hasActed: false, player: false, statuses: { ...defaultStatuses } });
	}

	function removeEnemy(id: number) {
		const index = enemies.findIndex(e => e.id === id);
		if (index !== -1) {
			enemies.splice(index, 1);
		}
	}

</script>

<div class="h-screen rounded-none flex flex-col">
		<div class="grid grid-cols-[42%_1fr] gap-0">
			<div class="h-screen p-0 bg-neutral-content">
				<h1 class="mb-3">Fabula Ultima Combat Tracker</h1>
				<h2 class="text-center pl-6">Players</h2>
				<div class="flex flex-col gap-2 p-6">
					{#each heroes as hero (hero.id)}
						<CharacterCard
							id={hero.id}
							bind:name={hero.name}
							bind:hp={hero.hp}
							maxHp={hero.maxHp}
							bind:mp={hero.mp}
							maxMp={hero.maxMp}
							bind:hasActed={hero.hasActed}
							bind:player={hero.player}
							bind:statuses={hero.statuses}
						/>
					{/each}
				</div>

				<!-- Clocks Section -->
				<div class="px-6 pb-4">
					<div class="flex items-center gap-2 mb-2">
						<h3 class="text-sm font-semibold">Clocks</h3>
						<button type="button" class="btn btn-xs btn-circle btn-ghost" onclick={addClock} title="Add Clock">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
								<path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
							</svg>
						</button>
					</div>
					{#if clocks.length > 0}
						<div class="flex flex-col gap-2">
							{#each clocks as clock (clock.id)}
								<div class="flex items-center gap-1 bg-base-100 rounded px-2 py-1 text-sm w-full">
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
										onclick={() => decrementClock(clock)}
										disabled={clock.current === 0}
									>−</button>
									<span class="font-mono min-w-[3ch] text-center">{clock.current}/{clock.max}</span>
									<button
										type="button"
										class="btn btn-xs btn-ghost btn-circle"
										onclick={() => incrementClock(clock)}
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
										onclick={() => removeClock(clock.id)}
										title="Remove clock"
									>×</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
			<div class="p-4 mr-10 h-screen overflow-auto">
				<h2 class="text-base-100 bg-accent w-full text-right">Enemies</h2>
				<div class="flex p-4 flex-col gap-2">
					{#each enemies as enemy (enemy.id)}
						<CharacterCard
							id={enemy.id}
							bind:name={enemy.name}
							bind:hp={enemy.hp}
							bind:maxHp={enemy.maxHp}
							bind:mp={enemy.mp}
							bind:maxMp={enemy.maxMp}
							bind:hasActed={enemy.hasActed}
							bind:player={enemy.player}
							bind:statuses={enemy.statuses}
							onremove={() => removeEnemy(enemy.id)}
						/>
					{/each}
				</div>
				<div class="p-4 overflow-auto flex flex-col gap-2">
					<textarea placeholder="DM Scratchpad (private)" bind:value={dmScratchpad} class="textarea textarea-primary h-40 w-full"></textarea>
					<textarea placeholder="Shared Scratchpad (visible to players)" bind:value={sharedScratchpad} class="textarea textarea-secondary h-40 w-full"></textarea>
				</div>
				
			</div>
		</div>
</div>

<div class="group fixed top-0 right-0 bottom-0 bg-primary p-1 pl-0 pr-0 flex flex-col justify-center gap-2 w-10 hover:w-36 transition-all duration-200 overflow-hidden">
	<button type="button" class="btn btn-xs btn-ghost btn-success rounded-none text-primary-content justify-start gap-2 min-w-max" onclick={newEnemy}>
		<svg class="w-[20px] h-[20px] shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
		<path fill-rule="evenodd" d="M4.857 3A1.857 1.857 0 0 0 3 4.857v4.286C3 10.169 3.831 11 4.857 11h4.286A1.857 1.857 0 0 0 11 9.143V4.857A1.857 1.857 0 0 0 9.143 3H4.857Zm10 0A1.857 1.857 0 0 0 13 4.857v4.286c0 1.026.831 1.857 1.857 1.857h4.286A1.857 1.857 0 0 0 21 9.143V4.857A1.857 1.857 0 0 0 19.143 3h-4.286Zm-10 10A1.857 1.857 0 0 0 3 14.857v4.286C3 20.169 3.831 21 4.857 21h4.286A1.857 1.857 0 0 0 11 19.143v-4.286A1.857 1.857 0 0 0 9.143 13H4.857ZM18 14a1 1 0 1 0-2 0v2h-2a1 1 0 1 0 0 2h2v2a1 1 0 1 0 2 0v-2h2a1 1 0 1 0 0-2h-2v-2Z" clip-rule="evenodd"/>
		</svg>
		<span class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-sm">New Enemy</span>
	</button>
	<button type="button" class="btn btn-xs btn-ghost btn-success rounded-none text-primary-content justify-start gap-2 min-w-max" onclick={newRound}>
		<svg class="w-[20px] h-[20px] shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
		<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3M3.22302 14C4.13247 18.008 7.71683 21 12 21c4.9706 0 9-4.0294 9-9 0-4.97056-4.0294-9-9-9-3.72916 0-6.92858 2.26806-8.29409 5.5M7 9H3V5"/>
		</svg>
		<span class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-sm">Reset Round</span>
	</button>
	<a class="btn btn-xs btn-ghost btn-success rounded-none text-primary-content justify-start gap-2 min-w-max" href="/player" target="_blank">
		<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24" class="shrink-0">
		<path fill-rule="evenodd" d="M12 6a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm-1.5 8a4 4 0 0 0-4 4 2 2 0 0 0 2 2h7a2 2 0 0 0 2-2 4 4 0 0 0-4-4h-3Zm6.82-3.096a5.51 5.51 0 0 0-2.797-6.293 3.5 3.5 0 1 1 2.796 6.292ZM19.5 18h.5a2 2 0 0 0 2-2 4 4 0 0 0-4-4h-1.1a5.503 5.503 0 0 1-.471.762A5.998 5.998 0 0 1 19.5 18ZM4 7.5a3.5 3.5 0 0 1 5.477-2.889 5.5 5.5 0 0 0-2.796 6.293A3.501 3.501 0 0 1 4 7.5ZM7.1 12H6a4 4 0 0 0-4 4 2 2 0 0 0 2 2h.5a5.998 5.998 0 0 1 3.071-5.238A5.505 5.505 0 0 1 7.1 12Z" clip-rule="evenodd"/>
		</svg>
		<span class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-sm">Player View</span>
	</a>
	<a class="btn btn-xs btn-ghost btn-success rounded-none text-primary-content justify-start gap-2 min-w-max" href="/images">
		<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24" class="shrink-0">
		<path fill-rule="evenodd" d="M13 10a1 1 0 0 1 1-1h.01a1 1 0 1 1 0 2H14a1 1 0 0 1-1-1Z" clip-rule="evenodd"/>
		<path fill-rule="evenodd" d="M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6Zm6.9 12 3.8-5.4-4-2.667L4 16v2h4.9Zm-4.9-5.6V6h16v5.5l-4.5-3.667-5.2 6.5-2.4-1.6L4 12.4ZM20 18v-3.5l-4.5-3.667-5.714 7.143L10 18h10Z" clip-rule="evenodd"/>
		</svg>
		<span class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-sm">Images</span>
	</a>
	<a class="btn btn-xs btn-ghost btn-success rounded-none text-primary-content justify-start gap-2 min-w-max" href="/settings">
		<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24" class="shrink-0">
		<path fill-rule="evenodd" d="M17 10v1.126c.367.095.714.24 1.032.428l.796-.797 1.415 1.415-.797.796c.188.318.333.665.428 1.032H21v2h-1.126c-.095.367-.24.714-.428 1.032l.797.796-1.415 1.415-.796-.797a3.979 3.979 0 0 1-1.032.428V20h-2v-1.126a3.977 3.977 0 0 1-1.032-.428l-.796.797-1.415-1.415.797-.796A3.975 3.975 0 0 1 12.126 16H11v-2h1.126c.095-.367.24-.714.428-1.032l-.797-.796 1.415-1.415.796.797A3.977 3.977 0 0 1 15 11.126V10h2Zm-1 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0-3a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" clip-rule="evenodd"/>
		<path d="M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5h-2V6H4v12h5v2H4a2 2 0 0 1-2-2V6Z"/>
		</svg>
		<span class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-sm">Settings</span>
	</a>
	<span class="divider divider-success"></span>
		<button type="button" class="btn btn-xs btn-ghost btn-success rounded-none text-primary-content justify-start gap-2 min-w-max" onclick={resetAll}>
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 shrink-0">
			<path fill-rule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0v2.43l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389 5.5 5.5 0 0 1 9.2-2.466l.312.311h-2.433a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z" clip-rule="evenodd" />
		</svg>
		<span class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-sm">Reset All</span>
	</button>
</div>
