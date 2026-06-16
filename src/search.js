import { fetchAllPokemonNames } from './api';

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
            div.innerHTML = `<span>#${p.id.toString().padStart(3, '0')}</span> <strong>${p.name.toUpperCase()}</strong>`;
            div.onclick = () => {
                searchInput.value = p.name.toUpperCase();
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
