import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { fetchMonsterStatBlock } from '$lib/notion';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { apiKey, pageId } = await request.json();

		if (!apiKey || !pageId) {
			return json({ message: 'API key and page ID are required' }, { status: 400 });
		}

		const statBlock = await fetchMonsterStatBlock(apiKey, pageId);

		return json({ statBlock });
	} catch (error) {
		console.error('Notion fetch error:', error);
		return json({ message: 'Failed to fetch monster data' }, { status: 500 });
	}
};
