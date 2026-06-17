const BASE_URL = 'https://pokeapi.co/api/v2';

export const fetchAllPokemonNames = async () => {
    // Fetching up to 1500 to cover all species and alternative varieties/forms
    const response = await fetch(`${BASE_URL}/pokemon?limit=1500`);
    const data = await response.json();
    const excludedForms = [
        'zygarde-10-power-construct',
        'zygarde-50-power-construct',
        'zygarde-mega'
    ];
    const baseNameToId = {};
    const list = data.results
        .filter(p => !excludedForms.includes(p.name.toLowerCase()))
        .map((p) => {
            const parts = p.url.split('/');
            const id = parseInt(parts[parts.length - 2]);
            if (id < 10000) {
                baseNameToId[p.name.toLowerCase()] = id;
            }
            return {
                name: p.name,
                id: id,
                url: p.url
            };
        });

    return list.map(p => {
        let dexId = p.id;
        if (p.name.toLowerCase().includes('-mega')) {
            const baseName = p.name.toLowerCase().split('-mega')[0];
            if (baseNameToId[baseName]) {
                dexId = baseNameToId[baseName];
            }
        }
        return {
            ...p,
            dexId: dexId
        };
    });
};

export const fetchPokemonDetails = async (idOrName) => {
    const response = await fetch(`${BASE_URL}/pokemon/${idOrName}`);
    return await response.json();
};

export const fetchTypeEffectiveness = async (types) => {
    const effectiveness = {};

    for (const typeInfo of types) {
        const response = await fetch(typeInfo.type.url);
        const data = await response.json();

        data.damage_relations.double_damage_from.forEach(t => {
            effectiveness[t.name] = (effectiveness[t.name] || 1) * 2;
        });
        data.damage_relations.half_damage_from.forEach(t => {
            effectiveness[t.name] = (effectiveness[t.name] || 1) * 0.5;
        });
        data.damage_relations.no_damage_from.forEach(t => {
            effectiveness[t.name] = (effectiveness[t.name] || 1) * 0;
        });
    }

    return effectiveness;
};

export const fetchNatures = async () => {
    const response = await fetch(`${BASE_URL}/nature?limit=25`);
    const data = await response.json();

    const natures = await Promise.all(data.results.map(async (n) => {
        const res = await fetch(n.url);
        return await res.json();
    }));

    const neutralStats = {
        hardy: 'attack',
        docile: 'defense',
        serious: 'speed',
        bashful: 'special-attack',
        quirky: 'special-defense'
    };

    return natures.map(n => {
        const name = n.name;
        let increased = n.increased_stat?.name || null;
        let decreased = n.decreased_stat?.name || null;

        if (!increased && !decreased && neutralStats[name]) {
            increased = neutralStats[name];
            decreased = neutralStats[name];
        }

        return {
            name,
            increased,
            decreased
        };
    });
};

export const fetchEvolutionChain = async (pokemonId) => {
    // 1. Get species data (contains evolution chain link)
    const speciesRes = await fetch(`${BASE_URL}/pokemon-species/${pokemonId}`);
    const speciesData = await speciesRes.json();

    // 2. Get evolution chain
    const evoRes = await fetch(speciesData.evolution_chain.url);
    const evoData = await evoRes.json();

    return evoData;
};

export const fetchAbilityDetails = async (abilityName) => {
    const response = await fetch(`${BASE_URL}/ability/${abilityName}`);
    return await response.json();
};
