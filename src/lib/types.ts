export interface Statuses {
	dazed: boolean;
	weak: boolean;
	poisoned: boolean;
	shaken: boolean;
	slow: boolean;
	enraged: boolean;
}

export interface Character {
	id: number;
	name: string;
	hp: number;
	maxHp: number;
	mp: number;
	maxMp: number;
	hasActed: boolean;
	player: boolean;
	statuses: Statuses;
}

export interface Clock {
	id: number;
	name: string;
	current: number;
	max: number;
	visible: boolean;
}

export interface SharedImage {
	id: number;
	dataUrl: string;
}

export interface MonsterStatBlock {
	name: string;
	level: number;
	rank: string;
	species: string;
	traits: string;
	maxHp: number;
	maxMp: number;
	initiative: number;
	defBonus: number;
	mDefBonus: number;
	crisis: number;
	attributes: {
		mig: string;
		dex: string;
		ins: string;
		wlp: string;
	};
	affinities: {
		air: string;
		bolt: string;
		dark: string;
		earth: string;
		fire: string;
		ice: string;
		light: string;
		physical: string;
		poison: string;
	};
	description: string;
	basicAttacks: string[];
	spells: string[];
	otherActions: string[];
	specialRules: string[];
}
