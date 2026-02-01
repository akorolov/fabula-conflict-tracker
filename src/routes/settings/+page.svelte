<script lang="ts">
	import { browser } from '$app/environment';

	let apiKey = $state('');
	let databaseId = $state('');
	let testStatus = $state<'idle' | 'testing' | 'success' | 'error'>('idle');
	let testMessage = $state('');
	let saved = $state(false);

	// Load from localStorage on mount
	$effect(() => {
		if (browser) {
			apiKey = localStorage.getItem('notion-api-key') || '';
			databaseId = localStorage.getItem('notion-database-id') || '';
		}
	});

	function save() {
		if (browser) {
			localStorage.setItem('notion-api-key', apiKey);
			localStorage.setItem('notion-database-id', databaseId);
			saved = true;
			setTimeout(() => saved = false, 2000);
		}
	}

	async function testConnection() {
		if (!apiKey || !databaseId) {
			testStatus = 'error';
			testMessage = 'Please enter both API key and Database ID';
			return;
		}

		testStatus = 'testing';
		testMessage = 'Testing connection...';

		try {
			const response = await fetch('/api/notion/search', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					apiKey,
					databaseId,
					query: ''
				})
			});

			if (response.ok) {
				const data = await response.json();
				testStatus = 'success';
				testMessage = `Connected! Found ${data.results?.length || 0} entries in database.`;
			} else {
				const error = await response.json();
				testStatus = 'error';
				testMessage = error.message || 'Failed to connect to Notion';
			}
		} catch (err) {
			testStatus = 'error';
			testMessage = 'Network error - check your connection';
		}
	}

	function extractDatabaseId(input: string): string {
		// Handle full URLs like https://www.notion.so/workspace/abc123...
		const urlMatch = input.match(/([a-f0-9]{32})/i);
		if (urlMatch) {
			return urlMatch[1];
		}
		// Handle UUIDs with dashes
		const uuidMatch = input.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
		if (uuidMatch) {
			return uuidMatch[1].replace(/-/g, '');
		}
		return input.trim();
	}

	function handleDatabaseIdInput(e: Event) {
		const target = e.target as HTMLInputElement;
		databaseId = extractDatabaseId(target.value);
	}
</script>

<div class="min-h-screen bg-accent p-8">
	<div class="max-w-xl mx-auto">
		<div class="flex items-center gap-4 mb-8">
			<a href="/" class="btn btn-ghost btn-sm">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				Back
			</a>
			<h1 class="text-2xl">Settings</h1>
		</div>

		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title text-lg mb-4">Notion Integration</h2>

				<div class="form-control mb-4">
					<label class="label" for="api-key">
						<span class="label-text font-semibold">Notion API Key</span>
					</label>
					<input
						id="api-key"
						type="password"
						bind:value={apiKey}
						placeholder="secret_..."
						class="input input-bordered w-full"
					/>
					<label class="label">
						<span class="label-text-alt text-base-content/60">
							Get your API key from <a href="https://www.notion.so/my-integrations" target="_blank" class="link link-primary">Notion Integrations</a>
						</span>
					</label>
				</div>

				<div class="form-control mb-6">
					<label class="label" for="database-id">
						<span class="label-text font-semibold">Database ID or URL</span>
					</label>
					<input
						id="database-id"
						type="text"
						value={databaseId}
						oninput={handleDatabaseIdInput}
						placeholder="Paste database URL or ID"
						class="input input-bordered w-full"
					/>
					<label class="label">
						<span class="label-text-alt text-base-content/60">
							Copy the URL of your Fabula Ultima Bestiary database
						</span>
					</label>
				</div>

				<div class="flex gap-2 mb-4">
					<button type="button" class="btn btn-primary flex-1" onclick={save}>
						{#if saved}
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
							Saved!
						{:else}
							Save
						{/if}
					</button>
					<button
						type="button"
						class="btn btn-secondary flex-1"
						onclick={testConnection}
						disabled={testStatus === 'testing'}
					>
						{#if testStatus === 'testing'}
							<span class="loading loading-spinner loading-sm"></span>
						{/if}
						Test Connection
					</button>
				</div>

				{#if testMessage}
					<div class="alert {testStatus === 'success' ? 'alert-success' : testStatus === 'error' ? 'alert-error' : 'alert-info'}">
						<span>{testMessage}</span>
					</div>
				{/if}

				<div class="divider"></div>

				<div class="text-sm text-base-content/70">
					<h3 class="font-semibold mb-2">Setup Instructions:</h3>
					<ol class="list-decimal list-inside space-y-1">
						<li>Create an integration at <a href="https://www.notion.so/my-integrations" target="_blank" class="link link-primary">Notion Integrations</a></li>
						<li>Copy the "Internal Integration Secret" as your API key</li>
						<li>Open your Fabula Ultima Bestiary database in Notion</li>
						<li>Click "..." → "Connections" → Add your integration</li>
						<li>Copy the database URL and paste it above</li>
					</ol>
				</div>
			</div>
		</div>
	</div>
</div>
