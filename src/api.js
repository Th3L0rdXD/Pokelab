const BASE_URL = 'https://pokeapi.co/api/v2';

export const fetchAllPokemonNames = async () => {
    // Fetching first 1025 pokemon (Gen 1-9)
    const response = await fetch(`${BASE_URL}/pokemon?limit=1025`);
    const data = await response.json();
    return data.results.map((p, index) => ({
        name: p.name,
        id: index + 1,
        url: p.url
    }));
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
