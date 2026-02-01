<script lang="ts">
	import { browser } from '$app/environment';

	interface SharedImage {
		id: number;
		dataUrl: string;
	}

	function loadFromStorage<T>(key: string, fallback: T): T {
		if (!browser) return fallback;
		const stored = localStorage.getItem(key);
		return stored ? JSON.parse(stored) : fallback;
	}

	let images = $state<SharedImage[]>(loadFromStorage('shared-images', []));
	let nextId = $state<number>(loadFromStorage('shared-images-next-id', 1));
	let dropActive = $state(false);

	$effect(() => {
		if (browser) {
			localStorage.setItem('shared-images', JSON.stringify(images));
		}
	});

	$effect(() => {
		if (browser) {
			localStorage.setItem('shared-images-next-id', JSON.stringify(nextId));
		}
	});

	function handlePaste(e: ClipboardEvent) {
		const items = e.clipboardData?.items;
		if (!items) return;

		for (const item of items) {
			if (item.type.startsWith('image/')) {
				e.preventDefault();
				const file = item.getAsFile();
				if (file) addImageFile(file);
			}
		}
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dropActive = false;
		const files = e.dataTransfer?.files;
		if (!files) return;

		for (const file of files) {
			if (file.type.startsWith('image/')) {
				addImageFile(file);
			}
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		dropActive = true;
	}

	function handleDragLeave() {
		dropActive = false;
	}

	function addImageFile(file: File) {
		const reader = new FileReader();
		reader.onload = () => {
			const dataUrl = reader.result as string;
			images = [...images, { id: nextId, dataUrl }];
			nextId++;
		};
		reader.readAsDataURL(file);
	}

	function removeImage(id: number) {
		images = images.filter(img => img.id !== id);
	}

	function clearAll() {
		images = [];
	}
</script>

<svelte:head>
	<title>Shared Images - Combat Tracker</title>
</svelte:head>

<svelte:document onpaste={handlePaste} />

<div
	class="min-h-screen p-6 bg-base-200"
	ondrop={handleDrop}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	role="application"
>
	<div class="max-w-4xl mx-auto">
		<div class="flex items-center justify-between mb-6">
			<h1 class="text-2xl font-bold">Shared Images</h1>
			<a href="/" class="btn btn-ghost btn-sm">← Back to Combat</a>
		</div>

		<div
			class="border-2 border-dashed rounded-lg p-8 mb-6 text-center transition-colors {dropActive ? 'border-primary bg-primary/10' : 'border-base-300'}"
		>
			<p class="text-lg mb-2">Paste or drag images here</p>
			<p class="text-sm opacity-70">Images will appear on the Player View under the enemies</p>
		</div>

		{#if images.length > 0}
			<div class="flex justify-end mb-4">
				<button type="button" class="btn btn-error btn-sm" onclick={clearAll}>
					Clear All Images
				</button>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				{#each images as image (image.id)}
					<div class="card bg-base-100 shadow-lg">
						<figure class="px-4 pt-4">
							<img src={image.dataUrl} alt="Shared content" class="rounded-lg max-h-64 object-contain" />
						</figure>
						<div class="card-body p-4">
							<div class="card-actions justify-end">
								<button
									type="button"
									class="btn btn-error btn-sm"
									onclick={() => removeImage(image.id)}
								>
									Remove
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="text-center py-12 opacity-50">
				<p>No images shared yet</p>
				<p class="text-sm mt-2">Paste (Ctrl/Cmd+V) or drag & drop images to share them with players</p>
			</div>
		{/if}
	</div>
</div>
