<script lang="ts">
	interface Props {
		name: string;
		hp: number;
		maxHp: number;
		mp: number;
		maxMp: number;
	}

	let { name = $bindable(), hp = $bindable(), maxHp, mp = $bindable(), maxMp }: Props = $props();

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

<div class="card bg-base-100 border border-base-content/10 rounded-lg">
	<div class="card-body p-3">
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
		<div class="flex gap-4 text-sm">
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
		</div>
	</div>
</div>
