import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const NOTION_API_URL = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { apiKey, databaseId, query } = await request.json();

		if (!apiKey || !databaseId) {
			return json({ message: 'API key and database ID are required' }, { status: 400 });
		}

		// Query the database
		const response = await fetch(`${NOTION_API_URL}/databases/${databaseId}/query`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
				'Notion-Version': NOTION_VERSION
			},
			body: JSON.stringify({
				filter: query ? {
					property: 'Name',
					title: {
						contains: query
					}
				} : undefined,
				page_size: 50
			})
		});

		if (!response.ok) {
			const error = await response.json();
			return json({
				message: error.message || 'Failed to query Notion database',
				code: error.code
			}, { status: response.status });
		}

		const data = await response.json();

		// Extract monster names and IDs from results
		const results = data.results.map((page: any) => {
			// Find the title property
			const titleProp = Object.values(page.properties).find(
				(prop: any) => prop.type === 'title'
			) as any;

			const name = titleProp?.title?.[0]?.plain_text || 'Unknown';

			return {
				id: page.id,
				name
			};
		});

		return json({ results });
	} catch (error) {
		console.error('Notion search error:', error);
		return json({ message: 'Internal server error' }, { status: 500 });
	}
};
