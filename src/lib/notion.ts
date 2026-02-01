import type { MonsterStatBlock } from '$lib/index';

const NOTION_API_URL = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

async function fetchBlocks(apiKey: string, blockId: string): Promise<any[]> {
	const response = await fetch(`${NOTION_API_URL}/blocks/${blockId}/children?page_size=100`, {
		headers: {
			'Authorization': `Bearer ${apiKey}`,
			'Notion-Version': NOTION_VERSION
		}
	});

	if (!response.ok) {
		throw new Error('Failed to fetch page blocks');
	}

	const data = await response.json();
	return data.results;
}

async function fetchPageProperties(apiKey: string, pageId: string): Promise<any> {
	const response = await fetch(`${NOTION_API_URL}/pages/${pageId}`, {
		headers: {
			'Authorization': `Bearer ${apiKey}`,
			'Notion-Version': NOTION_VERSION
		}
	});

	if (!response.ok) {
		throw new Error('Failed to fetch page properties');
	}

	return response.json();
}

function getPropertyValue(property: any): string | number {
	if (!property) return '';

	switch (property.type) {
		case 'title':
			return property.title?.map((t: any) => t.plain_text).join('') || '';
		case 'rich_text':
			return property.rich_text?.map((t: any) => t.plain_text).join('') || '';
		case 'number':
			return property.number ?? 0;
		case 'select':
			return property.select?.name || '';
		case 'multi_select':
			return property.multi_select?.map((s: any) => s.name).join(', ') || '';
		case 'checkbox':
			return property.checkbox ? 'Yes' : 'No';
		case 'formula':
			if (property.formula.type === 'number') return property.formula.number ?? 0;
			if (property.formula.type === 'string') return property.formula.string || '';
			return '';
		case 'rollup':
			if (property.rollup.type === 'number') return property.rollup.number ?? 0;
			return '';
		default:
			return '';
	}
}

function parseProperties(properties: Record<string, any>, statBlock: MonsterStatBlock): void {
	for (const [key, prop] of Object.entries(properties)) {
		const normalizedKey = key.toLowerCase().trim();
		const value = getPropertyValue(prop);

		switch (normalizedKey) {
			case 'name':
				if (typeof value === 'string' && value) statBlock.name = value;
				break;
			case 'level':
			case 'lvl':
				statBlock.level = typeof value === 'number' ? value : parseInt(String(value)) || 0;
				break;
			case 'rank':
				statBlock.rank = String(value);
				break;
			case 'species':
				statBlock.species = String(value);
				break;
			case 'traits':
				statBlock.traits = String(value);
				break;
			case 'max hp':
			case 'maxhp':
			case 'hp':
				statBlock.maxHp = typeof value === 'number' ? value : parseInt(String(value)) || 0;
				break;
			case 'max mp':
			case 'maxmp':
			case 'mp':
				statBlock.maxMp = typeof value === 'number' ? value : parseInt(String(value)) || 0;
				break;
			case 'initiative':
			case 'init':
				statBlock.initiative = typeof value === 'number' ? value : parseInt(String(value)) || 0;
				break;
			case 'def bonus':
			case 'defbonus':
			case 'def':
			case 'defense':
				statBlock.defBonus = typeof value === 'number' ? value : parseInt(String(value)) || 0;
				break;
			case 'm.def bonus':
			case 'm.defbonus':
			case 'm.def':
			case 'mdef':
			case 'mdefbonus':
			case 'magic defense':
				statBlock.mDefBonus = typeof value === 'number' ? value : parseInt(String(value)) || 0;
				break;
			case 'crisis':
				statBlock.crisis = typeof value === 'number' ? value : parseInt(String(value)) || 0;
				break;
			case 'mig':
			case 'might':
				statBlock.attributes.mig = String(value);
				break;
			case 'dex':
			case 'dexterity':
				statBlock.attributes.dex = String(value);
				break;
			case 'ins':
			case 'insight':
				statBlock.attributes.ins = String(value);
				break;
			case 'wlp':
			case 'willpower':
				statBlock.attributes.wlp = String(value);
				break;
			case 'air':
				statBlock.affinities.air = String(value) || '—';
				break;
			case 'bolt':
				statBlock.affinities.bolt = String(value) || '—';
				break;
			case 'dark':
				statBlock.affinities.dark = String(value) || '—';
				break;
			case 'earth':
				statBlock.affinities.earth = String(value) || '—';
				break;
			case 'fire':
				statBlock.affinities.fire = String(value) || '—';
				break;
			case 'ice':
				statBlock.affinities.ice = String(value) || '—';
				break;
			case 'light':
				statBlock.affinities.light = String(value) || '—';
				break;
			case 'physical':
				statBlock.affinities.physical = String(value) || '—';
				break;
			case 'poison':
				statBlock.affinities.poison = String(value) || '—';
				break;
		}
	}
}

function extractTextFromRichText(richText: any[]): string {
	return richText?.map((t: any) => t.plain_text).join('') || '';
}

function parseBlocks(blocks: any[]): MonsterStatBlock {
	const statBlock: MonsterStatBlock = {
		name: '',
		level: 0,
		rank: '',
		species: '',
		traits: '',
		maxHp: 0,
		maxMp: 0,
		initiative: 0,
		defBonus: 0,
		mDefBonus: 0,
		crisis: 0,
		attributes: { mig: '', dex: '', ins: '', wlp: '' },
		affinities: {
			air: '—', bolt: '—', dark: '—', earth: '—', fire: '—',
			ice: '—', light: '—', physical: '—', poison: '—'
		},
		description: '',
		basicAttacks: [],
		spells: [],
		otherActions: [],
		specialRules: []
	};

	let currentSection = '';
	let descriptionLines: string[] = [];

	for (const block of blocks) {
		const type = block.type;

		if (type === 'heading_1') {
			statBlock.name = extractTextFromRichText(block.heading_1.rich_text);
		} else if (type === 'heading_2') {
			const heading = extractTextFromRichText(block.heading_2.rich_text);
			currentSection = heading.toLowerCase();
		} else if (type === 'paragraph') {
			const text = extractTextFromRichText(block.paragraph.rich_text);

			if (!text.trim()) continue;

			const colonIndex = text.indexOf(':');
			if (colonIndex > 0 && !currentSection) {
				const key = text.substring(0, colonIndex).trim().toLowerCase();
				const value = text.substring(colonIndex + 1).trim();

				switch (key) {
					case 'level': statBlock.level = parseInt(value) || 0; break;
					case 'rank': statBlock.rank = value; break;
					case 'species': statBlock.species = value; break;
					case 'traits': statBlock.traits = value; break;
					case 'max hp': statBlock.maxHp = parseInt(value) || 0; break;
					case 'max mp': statBlock.maxMp = parseInt(value) || 0; break;
					case 'initiative': statBlock.initiative = parseInt(value) || 0; break;
					case 'def bonus': statBlock.defBonus = parseInt(value) || 0; break;
					case 'm.def bonus': statBlock.mDefBonus = parseInt(value) || 0; break;
					case 'crisis': statBlock.crisis = parseInt(value) || 0; break;
					case 'mig': statBlock.attributes.mig = value; break;
					case 'dex': statBlock.attributes.dex = value; break;
					case 'ins': statBlock.attributes.ins = value; break;
					case 'wlp': statBlock.attributes.wlp = value; break;
					case 'air': statBlock.affinities.air = value; break;
					case 'bolt': statBlock.affinities.bolt = value; break;
					case 'dark': statBlock.affinities.dark = value; break;
					case 'earth': statBlock.affinities.earth = value; break;
					case 'fire': statBlock.affinities.fire = value; break;
					case 'ice': statBlock.affinities.ice = value; break;
					case 'light': statBlock.affinities.light = value; break;
					case 'physical': statBlock.affinities.physical = value; break;
					case 'poison': statBlock.affinities.poison = value; break;
					default:
						if (!key.includes('•')) {
							descriptionLines.push(text);
						}
				}
			} else if (currentSection === 'basic attacks') {
				statBlock.basicAttacks.push(text);
			} else if (currentSection === 'spells') {
				statBlock.spells.push(text);
			} else if (currentSection === 'other actions') {
				statBlock.otherActions.push(text);
			} else if (currentSection === 'special rules') {
				statBlock.specialRules.push(text);
			} else if (!currentSection && !text.includes(':')) {
				descriptionLines.push(text);
			}
		}
	}

	statBlock.description = descriptionLines.join(' ').trim();

	return statBlock;
}

export interface NotionSearchResult {
	id: string;
	name: string;
}

export async function searchNotionDatabase(
	apiKey: string,
	databaseId: string,
	query?: string
): Promise<{ results: NotionSearchResult[] }> {
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
		throw new Error(error.message || 'Failed to query Notion database');
	}

	const data = await response.json();

	const results = data.results.map((page: any) => {
		const titleProp = Object.values(page.properties).find(
			(prop: any) => prop.type === 'title'
		) as any;

		const name = titleProp?.title?.[0]?.plain_text || 'Unknown';

		return {
			id: page.id,
			name
		};
	});

	return { results };
}

export async function fetchMonsterStatBlock(
	apiKey: string,
	pageId: string
): Promise<MonsterStatBlock> {
	const [page, blocks] = await Promise.all([
		fetchPageProperties(apiKey, pageId),
		fetchBlocks(apiKey, pageId)
	]);

	const statBlock = parseBlocks(blocks);

	if (page.properties) {
		parseProperties(page.properties, statBlock);
	}

	return statBlock;
}
