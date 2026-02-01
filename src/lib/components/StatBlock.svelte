<script lang="ts">
	import type { MonsterStatBlock } from '$lib/index'

	interface Props {
		statBlock: MonsterStatBlock;
	}

	let { statBlock }: Props = $props();

	function getAffinityClass(value: string): string {
		const v = value.toUpperCase();
		if (v === 'RS') return 'bg-base-200 text-base-content/60';
		if (v === 'VU') return 'bg-error text-error-content';
		if (v === 'IM') return 'bg-info text-info-content';
		if (v === 'AB') return 'bg-secondary text-secondary-content';
		return 'bg-success text-success-content';
	}

	function getAffinityLabel(value: string): string {
		const v = value.toUpperCase();
		if (v === 'RS') return 'RS';
		if (v === 'VU') return 'VU';
		if (v === 'IM') return 'IM';
		if (v === 'AB') return 'AB';
		return '—';
	}

	const affinityOrder = ['physical', 'air', 'bolt', 'dark', 'earth', 'fire', 'ice', 'light', 'poison'] as const;
</script>

<div class="stat-block space-y-4">
	<!-- Header -->
	<div class="bg-primary text-primary-content px-4 py-2 rounded-sm">
		<h3 class="text-xl font-bold text-base-100">{statBlock.name}</h3>
		<div class="text-sm opacity-90">
			Lv. {statBlock.level} {statBlock.rank} • {statBlock.species}
			<div class="text-sm italic">
			{statBlock.description}
		</div>
		</div>
	</div>

	<!-- Traits -->
	{#if statBlock.traits}
		<div class="text-sm">
			<span class="font-semibold">Traits:</span>
			<span class="italic">{statBlock.traits}</span>
		</div>
	{/if}

	<!-- Core Stats -->
	<div class="grid grid-cols-4 gap-2 text-center text-sm">
		<div class="bg-base-200 rounded p-2">
			<div class="font-semibold text-error">HP</div>
			<div>{statBlock.maxHp}</div>
		</div>
		<div class="bg-base-200 rounded p-2">
			<div class="font-semibold text-warning">Crisis</div>
			<div>{statBlock.crisis}</div>
		</div>
		<div class="bg-base-200 rounded p-2">
			<div class="font-semibold text-info">MP</div>
			<div>{statBlock.maxMp}</div>
		</div>
		<div class="bg-base-200 rounded p-2">
			<div class="font-semibold">Init</div>
			<div>{statBlock.initiative}</div>
		</div>
		<div class="bg-accent/30 rounded p-2">
			<div class="font-bold text-xs">DEX</div>
			<div class="text-lg font-semibold">{statBlock.attributes.dex}</div>
		</div>
		<div class="bg-accent/30 rounded p-2">
			<div class="font-bold text-xs">INS</div>
			<div class="text-lg font-semibold">{statBlock.attributes.ins}</div>
		</div>
		<div class="bg-accent/30 rounded p-2">
			<div class="font-bold text-xs">MIG</div>
			<div class="text-lg font-semibold">{statBlock.attributes.mig}</div>
		</div>
		<div class="bg-accent/30 rounded p-2">
			<div class="font-bold text-xs">WLP</div>
			<div class="text-lg font-semibold">{statBlock.attributes.wlp}</div>
		</div>
		<div class="bg-base-200 rounded p-2">
			<div class="font-semibold">DEF</div>
			<div>+{statBlock.defBonus}</div>
		</div>
		<div class="bg-base-200 rounded p-2">
			<div class="font-semibold">M.DEF</div>
			<div>+{statBlock.mDefBonus}</div>
		</div>
	</div>

	<!-- Affinities -->
	<div>
		<div class="font-semibold text-sm mb-1">Affinities</div>
		<div class="grid grid-cols-9 gap-1 text-center text-xs">
			{#each affinityOrder as aff (aff)}
				<div class="flex flex-col">
					<div class="font-medium capitalize mb-0.5">{aff.slice(0, 3)}</div>
					<div class="rounded px-1 py-0.5 {getAffinityClass(statBlock.affinities[aff])}">
						{getAffinityLabel(statBlock.affinities[aff])}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Basic Attacks -->
	{#if statBlock.basicAttacks.length > 0}
		<div>
			<div class="font-semibold text-sm bg-secondary/20 px-2 py-1 rounded-t">Basic Attacks</div>
			<div class="border border-secondary/20 border-t-0 rounded-b p-2 space-y-2">
				{#each statBlock.basicAttacks as attack, i (i)}
					<div class="text-sm">{attack}</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- spells -->
	{#if statBlock.spells.length > 0}
		<div>
			<div class="font-semibold text-sm bg-secondary/20 px-2 py-1 rounded-t">Spells</div>
			<div class="border border-secondary/20 border-t-0 rounded-b p-2 space-y-2">
				{#each statBlock.spells as attack, i (i)}
					<div class="text-sm">{attack}</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Other Actions -->
	{#if statBlock.otherActions.length > 0}
		<div>
			<div class="font-semibold text-sm bg-accent/20 px-2 py-1 rounded-t">Other Actions</div>
			<div class="border border-accent/20 border-t-0 rounded-b p-2 space-y-2">
				{#each statBlock.otherActions as attack, i (i)}
					<div class="text-sm">{attack}</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Special Rules -->
	{#if statBlock.specialRules.length > 0}
		<div>
			<div class="font-semibold text-sm bg-accent/20 px-2 py-1 rounded-t">Special Rules</div>
			<div class="border border-accent/20 border-t-0 rounded-b p-2 space-y-2">
				{#each statBlock.specialRules as rule, i (i)}
					<div class="text-sm">{rule}</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
