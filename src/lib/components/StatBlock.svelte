<script lang="ts">
	import type { MonsterStatBlock } from '$lib/index'
	import type { Statuses } from '$lib/types';

	interface Props {
		statBlock: MonsterStatBlock;
		statuses?: Statuses;
	}

	let { statBlock = $bindable(), statuses }: Props = $props();

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
	const affinityValues = ['', 'RS', 'VU', 'IM', 'AB'];

	function updateText(e: FocusEvent, field: keyof MonsterStatBlock) {
		const el = e.target as HTMLElement;
		const text = el.textContent?.trim() ?? '';
		(statBlock as any)[field] = text;
	}

	function updateNumber(e: FocusEvent, field: keyof MonsterStatBlock) {
		const el = e.target as HTMLElement;
		const text = (el.textContent?.trim() ?? '').replace(/^[+]/, '');
		const num = parseInt(text);
		if (!isNaN(num)) {
			(statBlock as any)[field] = num;
		} else {
			el.textContent = String((statBlock as any)[field]);
		}
	}

	function updateAttribute(e: FocusEvent, attr: keyof MonsterStatBlock['attributes']) {
		const el = e.target as HTMLElement;
		const text = el.textContent?.trim() ?? '';
		if (text) {
			statBlock.attributes[attr] = text;
		} else {
			el.textContent = statBlock.attributes[attr];
		}
	}

	function cycleAffinity(aff: keyof MonsterStatBlock['affinities']) {
		const current = statBlock.affinities[aff].toUpperCase();
		const idx = affinityValues.indexOf(current);
		const next = affinityValues[(idx + 1) % affinityValues.length];
		statBlock.affinities[aff] = next;
	}

	function updateArrayItem(e: FocusEvent, field: 'basicAttacks' | 'spells' | 'otherActions' | 'specialRules', index: number) {
		const el = e.target as HTMLElement;
		const text = el.textContent?.trim() ?? '';
		if (text) {
			statBlock[field][index] = text;
		} else {
			el.textContent = statBlock[field][index];
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			(e.target as HTMLElement).blur();
		}
	}
</script>

<div class="stat-block space-y-4">
	<!-- Header -->
	<div class="bg-primary text-primary-content px-4 py-2 rounded-sm">
		<h3 class="text-xl font-bold text-base-100">
			<span contenteditable="true" role="textbox" tabindex="0" class="editable" onblur={(e) => updateText(e, 'name')} onkeydown={handleKeydown}>{statBlock.name}</span>
		</h3>
		<div class="text-sm opacity-90">
			Lv. <span contenteditable="true" role="textbox" tabindex="0" class="editable" onblur={(e) => updateNumber(e, 'level')} onkeydown={handleKeydown}>{statBlock.level}</span>
			{' '}<span contenteditable="true" role="textbox" tabindex="0" class="editable" onblur={(e) => updateText(e, 'rank')} onkeydown={handleKeydown}>{statBlock.rank}</span>
			{' • '}<span contenteditable="true" role="textbox" tabindex="0" class="editable" onblur={(e) => updateText(e, 'species')} onkeydown={handleKeydown}>{statBlock.species}</span>
			<div class="text-sm italic">
				<span contenteditable="true" role="textbox" tabindex="0" class="editable" onblur={(e) => updateText(e, 'description')} onkeydown={handleKeydown}>{statBlock.description}</span>
			</div>
		</div>
	</div>

	<!-- Traits -->
	{#if statBlock.traits}
		<div class="text-sm">
			<span class="font-semibold">Traits:</span>
			<span class="italic editable" contenteditable="true" role="textbox" tabindex="0" onblur={(e) => updateText(e, 'traits')} onkeydown={handleKeydown}>{statBlock.traits}</span>
		</div>
	{/if}

	<!-- Core Stats -->
	<div class="grid grid-cols-4 gap-2 text-center text-sm">
		<div class="bg-base-200 rounded p-2">
			<div class="font-semibold text-error">HP</div>
			<div contenteditable="true" role="textbox" tabindex="0" class="editable" onblur={(e) => updateNumber(e, 'maxHp')} onkeydown={handleKeydown}>{statBlock.maxHp}</div>
		</div>
		<div class="bg-base-200 rounded p-2">
			<div class="font-semibold text-warning">Crisis</div>
			<div contenteditable="true" role="textbox" tabindex="0" class="editable" onblur={(e) => updateNumber(e, 'crisis')} onkeydown={handleKeydown}>{statBlock.crisis}</div>
		</div>
		<div class="bg-base-200 rounded p-2">
			<div class="font-semibold text-info">MP</div>
			<div contenteditable="true" role="textbox" tabindex="0" class="editable" onblur={(e) => updateNumber(e, 'maxMp')} onkeydown={handleKeydown}>{statBlock.maxMp}</div>
		</div>
		<div class="bg-base-200 rounded p-2">
			<div class="font-semibold">Init</div>
			<div contenteditable="true" role="textbox" tabindex="0" class="editable" onblur={(e) => updateNumber(e, 'initiative')} onkeydown={handleKeydown}>{statBlock.initiative}</div>
		</div>
		<div class="bg-accent/30 rounded p-2">
			<div class="font-bold text-xs">DEX</div>
			<div class="text-lg font-semibold editable" class:text-error={dex.modified} contenteditable="true" role="textbox" tabindex="0" onblur={(e) => updateAttribute(e, 'dex')} onkeydown={handleKeydown}>{dex.value}{#if dex.modified}*{/if}</div>
		</div>
		<div class="bg-accent/30 rounded p-2">
			<div class="font-bold text-xs">INS</div>
			<div class="text-lg font-semibold editable" class:text-error={ins.modified} contenteditable="true" role="textbox" tabindex="0" onblur={(e) => updateAttribute(e, 'ins')} onkeydown={handleKeydown}>{ins.value}{#if ins.modified}*{/if}</div>
		</div>
		<div class="bg-accent/30 rounded p-2">
			<div class="font-bold text-xs">MIG</div>
			<div class="text-lg font-semibold editable" class:text-error={mig.modified} contenteditable="true" role="textbox" tabindex="0" onblur={(e) => updateAttribute(e, 'mig')} onkeydown={handleKeydown}>{mig.value}{#if mig.modified}*{/if}</div>
		</div>
		<div class="bg-accent/30 rounded p-2">
			<div class="font-bold text-xs">WLP</div>
			<div class="text-lg font-semibold editable" class:text-error={wlp.modified} contenteditable="true" role="textbox" tabindex="0" onblur={(e) => updateAttribute(e, 'wlp')} onkeydown={handleKeydown}>{wlp.value}{#if wlp.modified}*{/if}</div>
		</div>
		<div class="bg-base-200 rounded p-2">
			<div class="font-semibold">DEF</div>
			<div contenteditable="true" role="textbox" tabindex="0" class="editable" onblur={(e) => updateNumber(e, 'defBonus')} onkeydown={handleKeydown}>+{statBlock.defBonus}</div>
		</div>
		<div class="bg-base-200 rounded p-2">
			<div class="font-semibold">M.DEF</div>
			<div contenteditable="true" role="textbox" tabindex="0" class="editable" onblur={(e) => updateNumber(e, 'mDefBonus')} onkeydown={handleKeydown}>+{statBlock.mDefBonus}</div>
		</div>
	</div>

	<!-- Affinities -->
	<div>
		<div class="font-semibold text-sm mb-1">Affinities</div>
		<div class="grid grid-cols-9 gap-1 text-center text-xs">
			{#each affinityOrder as aff (aff)}
				<div class="flex flex-col">
					<div class="font-medium capitalize mb-0.5">{aff.slice(0, 3)}</div>
					<button
						type="button"
						class="rounded px-1 py-0.5 cursor-pointer transition-opacity hover:opacity-80 {getAffinityClass(statBlock.affinities[aff])}"
						onclick={() => cycleAffinity(aff)}
						title="Click to cycle: —/RS/VU/IM/AB"
					>
						{getAffinityLabel(statBlock.affinities[aff])}
					</button>
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
					<div class="text-sm editable" contenteditable="true" role="textbox" tabindex="0" onblur={(e) => updateArrayItem(e, 'basicAttacks', i)} onkeydown={handleKeydown}>{attack}</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- spells -->
	{#if statBlock.spells.length > 0}
		<div>
			<div class="font-semibold text-sm bg-secondary/20 px-2 py-1 rounded-t">Spells</div>
			<div class="border border-secondary/20 border-t-0 rounded-b p-2 space-y-2">
				{#each statBlock.spells as spell, i (i)}
					<div class="text-sm editable" contenteditable="true" role="textbox" tabindex="0" onblur={(e) => updateArrayItem(e, 'spells', i)} onkeydown={handleKeydown}>{spell}</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Other Actions -->
	{#if statBlock.otherActions.length > 0}
		<div>
			<div class="font-semibold text-sm bg-accent/20 px-2 py-1 rounded-t">Other Actions</div>
			<div class="border border-accent/20 border-t-0 rounded-b p-2 space-y-2">
				{#each statBlock.otherActions as action, i (i)}
					<div class="text-sm editable" contenteditable="true" role="textbox" tabindex="0" onblur={(e) => updateArrayItem(e, 'otherActions', i)} onkeydown={handleKeydown}>{action}</div>
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
					<div class="text-sm editable" contenteditable="true" role="textbox" tabindex="0" onblur={(e) => updateArrayItem(e, 'specialRules', i)} onkeydown={handleKeydown}>{rule}</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.editable {
		cursor: text;
		border-radius: 2px;
		transition: outline-color 0.15s;
		outline: 1px solid transparent;
		min-width: 1em;
	}
	.editable:hover {
		outline-color: oklch(var(--bc) / 0.2);
	}
	.editable:focus {
		outline-color: oklch(var(--bc) / 0.5);
		outline-offset: 1px;
	}
</style>
