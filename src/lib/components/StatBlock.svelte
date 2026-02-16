<script lang="ts">
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
		statBlock: MonsterStatBlock;
		statuses?: Statuses;
	}

	let { statBlock, statuses }: Props = $props();

	const dieScale = ['d6', 'd8', 'd10', 'd12', 'd20'] as const;

	function reduceDie(die: string, steps: number): string {
		const lower = die.toLowerCase();
		const idx = dieScale.indexOf(lower as typeof dieScale[number]);
		if (idx === -1) return die;
		const newIdx = Math.max(0, idx - steps);
		return dieScale[newIdx];
	}

	// Compute reductions per attribute based on active statuses
	let attrReductions = $derived.by(() => {
		const r = { dex: 0, ins: 0, mig: 0, wlp: 0 };
		if (!statuses) return r;
		if (statuses.slow) r.dex++;
		if (statuses.enraged) { r.dex++; r.ins++; }
		if (statuses.dazed) r.ins++;
		if (statuses.weak) r.mig++;
		if (statuses.poisoned) { r.mig++; r.wlp++; }
		if (statuses.shaken) r.wlp++;
		return r;
	});

	let dex = $derived.by(() => {
		const reduction = attrReductions.dex;
		return reduction === 0
			? { value: statBlock.attributes.dex, modified: false }
			: { value: reduceDie(statBlock.attributes.dex, reduction), modified: true };
	});
	let ins = $derived.by(() => {
		const reduction = attrReductions.ins;
		return reduction === 0
			? { value: statBlock.attributes.ins, modified: false }
			: { value: reduceDie(statBlock.attributes.ins, reduction), modified: true };
	});
	let mig = $derived.by(() => {
		const reduction = attrReductions.mig;
		return reduction === 0
			? { value: statBlock.attributes.mig, modified: false }
			: { value: reduceDie(statBlock.attributes.mig, reduction), modified: true };
	});
	let wlp = $derived.by(() => {
		const reduction = attrReductions.wlp;
		return reduction === 0
			? { value: statBlock.attributes.wlp, modified: false }
			: { value: reduceDie(statBlock.attributes.wlp, reduction), modified: true };
	});

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
			<div class="text-lg font-semibold" class:text-error={dex.modified}>{dex.value}{#if dex.modified}*{/if}</div>
		</div>
		<div class="bg-accent/30 rounded p-2">
			<div class="font-bold text-xs">INS</div>
			<div class="text-lg font-semibold" class:text-error={ins.modified}>{ins.value}{#if ins.modified}*{/if}</div>
		</div>
		<div class="bg-accent/30 rounded p-2">
			<div class="font-bold text-xs">MIG</div>
			<div class="text-lg font-semibold" class:text-error={mig.modified}>{mig.value}{#if mig.modified}*{/if}</div>
		</div>
		<div class="bg-accent/30 rounded p-2">
			<div class="font-bold text-xs">WLP</div>
			<div class="text-lg font-semibold" class:text-error={wlp.modified}>{wlp.value}{#if wlp.modified}*{/if}</div>
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
