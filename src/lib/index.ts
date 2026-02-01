// place files you want to import through the `$lib` alias in this folder.
interface MonsterStatBlock {
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

export type {MonsterStatBlock}