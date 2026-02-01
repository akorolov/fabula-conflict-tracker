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
		hasActed: boolean;
		statuses: Statuses;
	}

	let { name, hp, maxHp, hasActed, statuses }: Props = $props();

	let inCrisis = $derived(hp <= Math.floor(maxHp / 2));

	const statusLabels: { key: keyof Statuses; label: string }[] = [
		{ key: 'dazed', label: 'dazed' },
		{ key: 'weak', label: 'weak' },
		{ key: 'poisoned', label: 'poisoned' },
		{ key: 'shaken', label: 'shaken' },
		{ key: 'slow', label: 'slow' },
		{ key: 'enraged', label: 'enraged' }
	];

	let activeStatuses = $derived(statusLabels.filter(s => statuses[s.key]));
</script>

<div class="card border border-base-content/10 rounded-lg {hasActed ? 'bg-primary' : 'bg-base-100 '}">
	<div class="card-body p-3 flex-row items-center justify-between">
		<div class="flex-1">
			<h3 class="card-title text-base flex items-center gap-1 {hasActed ? 'text-base-100' : ''}">
				{#if inCrisis}
					<svg class="w-[20px] h-[20px] {hasActed ? 'text-base-100' : 'text-error'}" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
					<path d="M17.133 12.632v-1.8a5.406 5.406 0 0 0-4.154-5.262.955.955 0 0 0 .021-.106V3.1a1 1 0 0 0-2 0v2.364a.955.955 0 0 0 .021.106 5.406 5.406 0 0 0-4.154 5.262v1.8C6.867 15.018 5 15.614 5 16.807 5 17.4 5 18 5.538 18h12.924C19 18 19 17.4 19 16.807c0-1.193-1.867-1.789-1.867-4.175ZM6 6a1 1 0 0 1-.707-.293l-1-1a1 1 0 0 1 1.414-1.414l1 1A1 1 0 0 1 6 6Zm-2 4H3a1 1 0 0 1 0-2h1a1 1 0 1 1 0 2Zm14-4a1 1 0 0 1-.707-1.707l1-1a1 1 0 1 1 1.414 1.414l-1 1A1 1 0 0 1 18 6Zm3 4h-1a1 1 0 1 1 0-2h1a1 1 0 1 1 0 2ZM8.823 19a3.453 3.453 0 0 0 6.354 0H8.823Z"/>
					</svg>

				{/if}
				{name}
			</h3>
			{#if activeStatuses.length > 0}
				<div class="flex gap-1 flex-wrap mt-2">
					{#each activeStatuses as status (status.key)}
						<span class="badge badge-info badge-sm">{status.label}</span>
					{/each}
				</div>
			{/if}
		</div>
		{#if hasActed}
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-10 h-10 text-base-100">
				<path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clip-rule="evenodd" />
			</svg>
		{/if}
	</div>
</div>
