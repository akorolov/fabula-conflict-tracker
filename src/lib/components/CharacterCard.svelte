<script lang="ts">
	interface Statuses {
		dazed: boolean;
		weak: boolean;
		poisoned: boolean;
		shaken: boolean;
		slow: boolean;
		enraged: boolean;
	}

	interface Props {
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

	let { name = $bindable(), hp = $bindable(), maxHp, mp = $bindable(), maxMp, hasActed = $bindable(), player = $bindable(), statuses = $bindable(), onremove }: Props = $props();

	let inCrisis = $derived.by(() => hp <= Math.floor(maxHp / 2));

	let editingName = $state(false);
	let editingHp = $state(false);
	let editingMp = $state(false);

	let hpInput = $state('');
	let mpInput = $state('');

	function evaluateMath(expr: string, currentValue: number): number {
		const trimmed = expr.trim();
		if (!trimmed) return currentValue;

		// Check for simple addition/subtraction at the start
		if (trimmed.startsWith('+') || trimmed.startsWith('-')) {
			const num = parseFloat(trimmed);
			if (!isNaN(num)) {
				return currentValue + num;
			}
		}

		// Try to evaluate expressions like "60+5" or "44-10"
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

		// Just a number
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

<div class="card bg-base-100 rounded-lg {hasActed ? 'border-3 border-primary' : 'border border-base-content/10'}">
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
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 text-error shrink-0">
						<path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd" />
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
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 text-error shrink-0">
						<path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd" />
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
