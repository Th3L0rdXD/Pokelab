import { fetchAllPokemonNames } from './api';

export const formatPokemonDisplayName = (name) => {
    if (!name) return '';
    const nameLower = name.toLowerCase();
    
    if (nameLower.includes('-mega') || nameLower.includes('-gmax')) {
        const isMega = nameLower.includes('-mega');
        const prefix = isMega ? 'MEGA' : 'GMAX';
        
        const parts = nameLower.split('-');
        const idx = parts.findIndex(p => p === 'mega' || p === 'gmax');
        
        const baseNameParts = parts.slice(0, idx);
        const baseName = baseNameParts.join(' ');
        
        const suffixParts = parts.slice(idx + 1);
        const suffix = suffixParts.join(' ');
        
        let formatted = `${prefix} ${baseName}`;
        if (suffix) {
            formatted += ` ${suffix}`;
        }
        return formatted.toUpperCase();
    }
    
    return name.replace(/-/g, ' ').toUpperCase();
};

export const initSearch = async (onSelect) => {
    const searchInput = document.getElementById('pokemon-search');
    const resultsDiv = document.getElementById('search-results');
    const searchSection = document.getElementById('search-section');

    const allPokemon = await fetchAllPokemonNames();

    const filterPokemon = (query) => {
        if (!query) return [];
        const normalizedQuery = query.toLowerCase().replace(/[-\s]+/g, ' ');
        return allPokemon.filter(p => {
            const normalizedName = p.name.toLowerCase().replace(/[-\s]+/g, ' ');
            return normalizedName.includes(normalizedQuery) || p.id.toString() === query;
        }).slice(0, 10);
    };

    const renderResults = (results) => {
        resultsDiv.innerHTML = '';
        if (results.length === 0) {
            resultsDiv.style.display = 'none';
            return;
        }

        results.forEach(p => {
            const div = document.createElement('div');
            div.className = 'search-item';
            div.innerHTML = `<span>#${p.id.toString().padStart(3, '0')}</span> <strong>${formatPokemonDisplayName(p.name)}</strong>`;
            div.onclick = () => {
                searchInput.value = formatPokemonDisplayName(p.name);
                resultsDiv.style.display = 'none';
                searchSection.style.display = 'none';
                onSelect(p.id);
            };
            resultsDiv.appendChild(div);
        });
        resultsDiv.style.display = 'block';
    };

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        const results = filterPokemon(query);
        renderResults(results);
    });

    // Close results when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchSection.contains(e.target)) {
            resultsDiv.style.display = 'none';
        }
    });
};
