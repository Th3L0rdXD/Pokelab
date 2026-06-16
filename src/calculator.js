export const calculateStat = (base, iv, ev, level, statName, nature) => {
    if (statName === 'hp') {
        return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
    }

    let natureMod = 1.0;
    if (nature && nature.increased !== nature.decreased) {
        if (nature.increased === statName) natureMod = 1.1;
        if (nature.decreased === statName) natureMod = 0.9;
    }

    const baseCalc = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5;
    return Math.floor(baseCalc * natureMod);
};

export const mapStatName = (pokeApiName) => {
    const mapping = {
        'hp': 'hp',
        'attack': 'atk',
        'defense': 'def',
        'special-attack': 'spa',
        'special-defense': 'spd',
        'speed': 'spe'
    };
    return mapping[pokeApiName] || pokeApiName;
};

export const reverseMapStatName = (shortName) => {
    const mapping = {
        'hp': 'hp',
        'atk': 'attack',
        'def': 'defense',
        'spa': 'special-attack',
        'spd': 'special-defense',
        'spe': 'speed'
    };
    return mapping[shortName] || shortName;
};
