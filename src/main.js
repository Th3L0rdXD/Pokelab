import './style.css';
import { initTheme } from './theme';
import { initSearch } from './search';
import { fetchPokemonDetails, fetchTypeEffectiveness, fetchNatures, fetchEvolutionChain } from './api';
import { calculateStat, mapStatName, reverseMapStatName } from './calculator';
import { saveData, loadData, clearData } from './storage';
import { pokemonEvData } from './pokemon_ev_data';

let currentPokemon = null;
let natures = [];
let natureView = 'matrix'; // matrix or list
let evolutionDetailsCache = {}; // Cache de detalhes dos pokémon da evolução
let currentEvTargets = [];
let loadedConfig = null;
let currentTypeChartView = 'flow'; // 'flow' or 'table'

// --- Traduções (i18n) ---
const translations = {
  pt: {
    title: "PokeLab",
    newSearch: "Nova Pesquisa",
    savedRecords: "Registros Salvos",
    selectPokemon: "Selecione um Pokémon",
    searchPlaceholder: "Nome ou Número da Pokedex...",
    level: "Nível (1-100)",
    nature: "Natureza",
    evsUsed: "EVs Utilizados",
    remaining: "Restante",
    stat: "Status",
    base: "Base",
    iv: "IV (0-31)",
    ev: "EV (0-252)",
    min: "Mín",
    max: "Máx",
    total: "Total",
    subtotal: "SUB-TOTAL",
    somaTotal: "SOMA TOTAL",
    typeEffectiveness: "Efetividade de Tipos",
    advantages: "Vantagens (Dano Reduzido)",
    disadvantages: "Desvantagens (Dano Recebido)",
    noAdvantages: "Nenhuma Vantagem",
    noDisadvantages: "Nenhuma Desvantagem",
    evolutionChain: "Linha Evolutiva",
    evYield: "Rendimento",
    ivQuality: "Qualidade dos IVs",
    qualityLabel: "Qualidade",
    qualityPessimo: "Péssimo",
    qualityRuim: "Ruim",
    qualityBom: "Bom",
    qualityOtimo: "Ótimo",
    qualityExcelente: "Excelente",
    qualityPerfeito: "Perfeito",
    natureTable: "Tabela de Naturezas",
    alphabetical: "Ordem Alfabética",
    statsOrder: "Ordem por Status",
    saveSearchQuestion: "Salvar Pesquisa?",
    saveSearchPrompt: "Deseja salvar as configurações de IV/EV atuais deste Pokémon antes de iniciar uma nova pesquisa?",
    yes: "Sim",
    no: "Não",
    confirmTitle: "Mudar de Pokémon?",
    confirmPrompt: "Deseja salvar as configurações do Pokémon atual antes de ir para o novo Pokémon?",
    confirmYes: "Sim (Salvar)",
    confirmNo: "Não (Descartar)",
    cancel: "Cancelar",
    noHistory: "Nenhum registro salvo ainda",
    savedAt: "Salvo em",
    load: "Carregar",
    delete: "Apagar",
    tradeWith: "Troca c/",
    trade: "Troca",
    friendship: "Amizade",
    dayFriendship: "Dia + Amizade",
    nightFriendship: "Noite + Amizade",
    fairyFriendship: "Fada + Amizade",
    hiddenAbilityText: "(Oculta)",
    natureTooltip: "As Naturezas alteram os atributos do Pokémon aumentam um atributo em 10% (▲) e diminuem outro em 10% (▼) e Naturezas neutras não alteram os atributos. Clique no seletor para ver a tabela.",
    notesTitle: "Anotações",
    notesPlaceholder: "Adicione anotações sobre este Pokémon (ex: sets, objetivos, observações)...",
    evTrainingTitle: "Assistente de Treino de EV",
    targetEvLabel: "Atributo Alvo",
    searchHelperLabel: "Buscar Pokémon Alvo",
    searchHelperPlaceholder: "Nome do Pokémon...",
    recommendedLabel: "Sugestões de Treino:",
    trainingTargetsLabel: "Alvos de Treino Ativos",
    typesLabel: "Tipos:",
    abilitiesLabel: "Habilidades:",
    evModalTitle: "Buscar Pokémon Alvo de Treino",
    evModalSearch: "Buscar por Nome ou Número Dex",
    evModalStats: "Filtrar por Atributos Fornecidos",
    evModalYields: "Quantidade de EV Fornecida",
    evModalTypes: "Filtrar por Tipo",
    // Natures
    hardy: "Robusta", docility: "Dócil", docile: "Dócil", brave: "Audaz", adamant: "Firme", naughty: "Malcriada",
    bold: "Ousada", relaxed: "Relaxada", impish: "Travessa", lax: "Relaxada",
    timid: "Tímida", hasty: "Pressada", serious: "Séria", jolly: "Alegre", naive: "Inocente",
    modest: "Modesta", mild: "Mansa", quiet: "Mansa", bashful: "Tímida", rash: "Arrojada",
    calm: "Calma", gentle: "Gentil", sassy: "Atrevida", careful: "Cauta", quirky: "Excêntrica", lonely: "Solitária",
    // Types
    normal: "Normal", fire: "Fogo", water: "Água", electric: "Elétrico", grass: "Planta",
    ice: "Gelo", fighting: "Lutador", poison: "Veneno", ground: "Terra", flying: "Voador",
    psychic: "Psíquico", bug: "Inseto", rock: "Pedra", ghost: "Fantasma", dragon: "Dragão",
    dark: "Sombrio", steel: "Aço", fairy: "Fada",
    // Stats
    hp: "HP", atk: "ATK", def: "DEF", spa: "SPA", spd: "SPD", spe: "SPE",
    noPokemonMatching: "Nenhum Pokémon correspondente aos filtros",
    noActiveTargets: "Nenhum alvo ativo",
    statTooltip: "Os atributos do Pokémon que determinam seu desempenho em batalha: HP (Pontos de Vida), ATK (Ataque), DEF (Defesa), SPA (Ataque Especial), SPD (Defesa Especial) e SPE (Velocidade).",
    baseTooltip: "Os valores iniciais de atributos específicos de cada espécie de Pokémon. Quanto maiores os valores base, mais forte o Pokémon será nesse atributo.",
    ivTooltip: "Valores Individuais (0 a 31) gerados aleatoriamente para cada atributo de um Pokémon. Funcionam como o DNA do Pokémon, onde 31 é o valor perfeito.",
    evTooltip: "Valores de Esforço (0 a 252 por atributo) obtidos ao derrotar Pokémon. Cada 4 EVs aumentam o atributo em 1 ponto no nível 100.",
    evsUsedTooltip: "A soma total de EVs distribuídos nos atributos do Pokémon, onde o limite máximo permitido por Pokémon é de 510 EVs.",
    ivQualityTooltip: "Classificação baseada na soma dos IVs do Pokémon (máximo 186). Avalia o potencial genético do Pokémon, onde 100% representa IVs perfeitos (31) em todos os atributos.",
    evTrainingTooltip: "Ajuda a registrar os Pokémon derrotados. Adicione Pokémon alvos para contar as derrotas e atualizar automaticamente os EVs do Pokémon atual com o rendimento fornecido.",
    effectivenessTooltip: "Mostra multiplicadores de dano recebidos pelo Pokémon com base nos seus tipos.",
    typeChartTable: "Tabela de Tipos",
    weaknessesLegend: "Vantagens contra ele (Causa 2x dano)",
    targetLegend: "Tipo",
    strengthsLegend: "Ele tem vantagem contra (Causa 2x dano)",
    typeChartTypeLabel: "Tipo",
    typeChartAdvantagesLabel: "Vantagens (Ataque)",
    typeChartDisadvantagesLabel: "Desvantagens (Defesa)",
    btnViewFlow: "Visualização por Fluxo",
    btnViewTable: "Visualização por Tabela",
    viewAsTable: "Ver como Tabela",
    viewAsFlow: "Ver como Fluxo",
    historyLevel: "Nível",
    historyIvSum: "Soma IVs:",
    historyEvSum: "Soma EVs:"
  },
  en: {
    title: "PokeLab",
    newSearch: "New Search",
    savedRecords: "Saved Records",
    selectPokemon: "Select a Pokémon",
    searchPlaceholder: "Name or Pokedex Number...",
    level: "Level (1-100)",
    nature: "Nature",
    evsUsed: "EVs Used",
    remaining: "Remaining",
    stat: "Stat",
    base: "Base",
    iv: "IV (0-31)",
    ev: "EV (0-252)",
    min: "Min",
    max: "Max",
    total: "Total",
    subtotal: "SUB-TOTAL",
    somaTotal: "TOTAL SUM",
    typeEffectiveness: "Type Effectiveness",
    advantages: "Advantages (Reduced Damage)",
    disadvantages: "Disadvantages (Received Damage)",
    noAdvantages: "No Advantages",
    noDisadvantages: "No Disadvantages",
    evolutionChain: "Evolution Chain",
    evYield: "Yield",
    ivQuality: "IVs Quality",
    qualityLabel: "Quality",
    qualityPessimo: "Terrible",
    qualityRuim: "Bad",
    qualityBom: "Good",
    qualityOtimo: "Great",
    qualityExcelente: "Excellent",
    qualityPerfeito: "Perfect",
    natureTable: "Natures Table",
    alphabetical: "Alphabetical Order",
    statsOrder: "Stats Order",
    saveSearchQuestion: "Save Search?",
    saveSearchPrompt: "Do you want to save the current IV/EV configurations of this Pokémon before starting a new search?",
    yes: "Yes",
    no: "No",
    confirmTitle: "Switch Pokémon?",
    confirmPrompt: "Do you want to save current Pokémon settings before going to the new Pokémon?",
    confirmYes: "Yes (Save)",
    confirmNo: "No (Discard)",
    cancel: "Cancel",
    noHistory: "No saved records yet",
    savedAt: "Saved at",
    load: "Load",
    delete: "Delete",
    tradeWith: "Trade w/",
    trade: "Trade",
    friendship: "Friendship",
    dayFriendship: "Day + Friendship",
    nightFriendship: "Night + Friendship",
    fairyFriendship: "Fairy + Friendship",
    hiddenAbilityText: "(Hidden)",
    natureTooltip: "Natures affect a Pokémon's stats. Most Natures increase one stat by 10% (▲) and decrease another by 10% (▼). Neutral Natures do not affect stats. Click the trigger to view the table.",
    notesTitle: "Notes",
    notesPlaceholder: "Add notes about this Pokémon (e.g., sets, goals, observations)...",
    evTrainingTitle: "EV Training Helper",
    targetEvLabel: "Target Stat",
    searchHelperLabel: "Search Target Pokémon",
    searchHelperPlaceholder: "Pokémon name...",
    recommendedLabel: "Training Suggestions:",
    trainingTargetsLabel: "Active Training Targets",
    typesLabel: "Types:",
    abilitiesLabel: "Abilities:",
    evModalTitle: "Search Training Target Pokémon",
    evModalSearch: "Search by Name or Dex Number",
    evModalStats: "Filter by Provided Attributes",
    evModalYields: "EV Yield Quantity",
    evModalTypes: "Filter by Type",
    // Natures
    hardy: "Hardy", docility: "Docile", docile: "Docile", brave: "Brave", adamant: "Adamant", naughty: "Naughty",
    bold: "Bold", relaxed: "Relaxed", impish: "Impish", lax: "Lax",
    timid: "Timid", hasty: "Hasty", serious: "Serious", jolly: "Jolly", naive: "Naive",
    modest: "Modest", mild: "Mild", quiet: "Quiet", bashful: "Bashful", rash: "Rash",
    calm: "Calm", gentle: "Gentle", sassy: "Sassy", careful: "Careful", quirky: "Quirky", lonely: "Lonely",
    // Types
    normal: "Normal", fire: "Fire", water: "Water", electric: "Electric", grass: "Grass",
    ice: "Ice", fighting: "Fighting", poison: "Poison", ground: "Ground", flying: "Flying",
    psychic: "Psychic", bug: "Bug", rock: "Rock", ghost: "Ghost", dragon: "Dragon",
    dark: "Dark", steel: "Steel", fairy: "Fairy",
    // Stats
    hp: "HP", atk: "ATK", def: "DEF", spa: "SPA", spd: "SPD", spe: "SPE",
    noPokemonMatching: "No Pokémon match the selected filters",
    noActiveTargets: "No active targets",
    statTooltip: "The Pokémon's attributes that determine battle performance: HP (Hit Points), ATK (Attack), DEF (Defense), SPA (Special Attack), SPD (Special Defense), and SPE (Speed).",
    baseTooltip: "The starting attribute values specific to each Pokémon species. Higher base values mean a naturally stronger Pokémon in that stat.",
    ivTooltip: "Individual Values (0 to 31) randomly generated for each of a Pokémon's stats. They act like genetic potential, with 31 being perfect.",
    evTooltip: "Effort Values (0 to 252 per stat) earned by defeating Pokémon. Every 4 EVs increase the stat by 1 point at level 100.",
    evsUsedTooltip: "The total sum of EVs distributed across all stats. The maximum allowed limit per Pokémon is 510 EVs.",
    ivQualityTooltip: "Rating based on the sum of the Pokémon's IVs (maximum 186). Evaluates the Pokémon's genetic potential, where 100% represents perfect IVs (31) in all stats.",
    evTrainingTooltip: "Helps track defeated Pokémon. Add target Pokémon to count defeats and automatically update the current Pokémon's EVs based on the yield provided.",
    effectivenessTooltip: "Shows damage multipliers received by the Pokémon based on its types. Colors indicate weaknesses (red/orange) and resistances (blue/green).",
    typeChartTable: "Type Chart",
    weaknessesLegend: "Strong against it (Deals 2x damage)",
    targetLegend: "Type",
    strengthsLegend: "It is strong against (Deals 2x damage)",
    typeChartTypeLabel: "Type",
    typeChartAdvantagesLabel: "Advantages (Offensive)",
    typeChartDisadvantagesLabel: "Disadvantages (Defensive)",
    btnViewFlow: "Flow View",
    btnViewTable: "Table View",
    viewAsTable: "View as Table",
    viewAsFlow: "View as Flow",
    historyLevel: "Level",
    historyIvSum: "IV Sum:",
    historyEvSum: "EV Sum:"
  },
  es: {
    title: "PokeLab",
    newSearch: "Nueva Búsqueda",
    savedRecords: "Registros Guardados",
    selectPokemon: "Selecciona un Pokémon",
    searchPlaceholder: "Nombre o Número de Pokedex...",
    level: "Nivel (1-100)",
    nature: "Naturaleza",
    evsUsed: "EVs Usados",
    remaining: "Restante",
    stat: "Estadística",
    base: "Base",
    iv: "IV (0-31)",
    ev: "EV (0-252)",
    min: "Mín",
    max: "Máx",
    total: "Total",
    subtotal: "SUB-TOTAL",
    somaTotal: "SUMA TOTAL",
    typeEffectiveness: "Efectividad de Tipos",
    advantages: "Ventajas (Daño Reducido)",
    disadvantages: "Desventajas (Daño Recibido)",
    noAdvantages: "Ninguna Ventaja",
    noDisadvantages: "Ninguna Desventaja",
    evolutionChain: "Línea Evolutiva",
    evYield: "Rendimiento",
    ivQuality: "Calidad de IVs",
    qualityLabel: "Calidad",
    qualityPessimo: "Pésimo",
    qualityRuim: "Malo",
    qualityBom: "Bueno",
    qualityOtimo: "Excelente",
    qualityExcelente: "Sobresaliente",
    qualityPerfeito: "Perfecto",
    natureTable: "Tabla de Naturalezas",
    alphabetical: "Orden Alfabético",
    statsOrder: "Orden de Estados",
    saveSearchQuestion: "¿Guardar Búsqueda?",
    saveSearchPrompt: "¿Desea guardar las configuraciones de IV/EV actuales de este Pokémon antes de iniciar una nueva búsqueda?",
    yes: "Sí",
    no: "No",
    confirmTitle: "¿Cambiar de Pokémon?",
    confirmPrompt: "¿Desea guardar las configuraciones del Pokémon actual antes de ir al nuevo Pokémon?",
    confirmYes: "Sí (Guardar)",
    confirmNo: "No (Descartar)",
    cancel: "Cancelar",
    noHistory: "No hay registros guardados aún",
    savedAt: "Guardado el",
    load: "Cargar",
    delete: "Eliminar",
    tradeWith: "Interc. c/",
    trade: "Intercambio",
    friendship: "Amistad",
    dayFriendship: "Día + Amistad",
    nightFriendship: "Noche + Amistad",
    fairyFriendship: "Hada + Amistad",
    hiddenAbilityText: "(Oculta)",
    natureTooltip: "Las Naturalezas afectan las estadísticas de un Pokémon. La mayoría aumenta una estadística en un 10% (▲) y disminuye otra en un 10% (▼). Las neutras no las afectan. Haga clic para ver la tabla.",
    notesTitle: "Anotaciones",
    notesPlaceholder: "Agregue anotaciones sobre este Pokémon (ej: sets, objetivos, observaciones)...",
    evTrainingTitle: "Asistente de Entrenamiento de EV",
    targetEvLabel: "Atributo Objetivo",
    searchHelperLabel: "Buscar Pokémon Objetivo",
    searchHelperPlaceholder: "Nombre del Pokémon...",
    recommendedLabel: "Sugerencias de Entrenamiento:",
    trainingTargetsLabel: "Objetivos de Entrenamiento Activos",
    typesLabel: "Tipos:",
    abilitiesLabel: "Habilidades:",
    evModalTitle: "Buscar Pokémon Objetivo de Entrenamiento",
    evModalSearch: "Buscar por Nombre o Número Dex",
    evModalStats: "Filtrar por Atributos Proporcionados",
    evModalYields: "Cantidad de EV Proporcionada",
    evModalTypes: "Filtrar por Tipo",
    // Natures
    hardy: "Fuerte", docility: "Dócil", docile: "Dócil", brave: "Audaz", adamant: "Firme", naughty: "Pícara",
    bold: "Osada", relaxed: "Plácida", impish: "Agitada", lax: "Floja",
    timid: "Miedosa", hasty: "Activa", serious: "Seria", jolly: "Alegre", naive: "Ingenua",
    modest: "Modesta", mild: "Afable", quiet: "Mansa", bashful: "Tímida", rash: "Alocada",
    calm: "Serena", gentle: "Amable", sassy: "Altanera", careful: "Cauta", quirky: "Rara", lonely: "Huraña",
    // Types
    normal: "Normal", fire: "Fuego", water: "Agua", electric: "Eléctrico", grass: "Planta",
    ice: "Hielo", fighting: "Lucha", poison: "Veneno", ground: "Tierra", flying: "Volador",
    psychic: "Psíquico", bug: "Bicho", rock: "Roca", ghost: "Fantasma", dragon: "Dragón",
    dark: "Siniestro", steel: "Acero", fairy: "Hada",
    // Stats
    hp: "HP", atk: "ATK", def: "DEF", spa: "SPA", spd: "SPD", spe: "SPE",
    noPokemonMatching: "Ningún Pokémon coincide con los filtros seleccionados",
    noActiveTargets: "Ningún objetivo activo",
    statTooltip: "Los atributos del Pokémon que determinan su desempeño en batalla: HP (Puntos de Salud), ATK (Ataque), DEF (Defensa), SPA (Ataque Especial), SPD (Defensa Especial) y SPE (Velocidad).",
    baseTooltip: "Los valores iniciales de atributos específicos de cada especie de Pokémon. Cuanto más altos sean los valores base, más fuerte será el Pokémon en esa estadística.",
    ivTooltip: "Valores Individuales (0 a 31) generados aleatoriamente para cada estadística de un Pokémon. Actúan como el ADN del Pokémon, siendo 31 el valor perfecto.",
    evTooltip: "Valores de Esfuerzo (0 a 252 por estadística) obtenidos al derrotar Pokémon. Cada 4 EVs aumentan la estadística en 1 punto al nivel 100.",
    evsUsedTooltip: "La suma total de EVs distribuidos en las estadísticas del Pokémon. El límite máximo permitido por Pokémon es de 510 EVs.",
    ivQualityTooltip: "Clasificación basada en la suma de los IVs del Pokémon (máximo 186). Evalúa el potencial genético del Pokémon, donde el 100% representa IVs perfectos (31) en todas las estadísticas.",
    evTrainingTooltip: "Ayuda a registrar los Pokémon derrotados. Agrega Pokémon objetivos para contar las derrotas y actualizar automáticamente los EVs del Pokémon actual con el rendimiento proporcionado.",
    effectivenessTooltip: "Muestra los multiplicadores de daño recibidos por el Pokémon según sus tipos. Los colores indican debilidades (rojo/naranja) y resistencias (azul/verde).",
    typeChartTable: "Tabla de Tipos",
    weaknessesLegend: "Ventajas contra él (Causa 2x daño)",
    targetLegend: "Tipo",
    strengthsLegend: "Él tiene ventaja contra (Causa 2x daño)",
    typeChartTypeLabel: "Tipo",
    typeChartAdvantagesLabel: "Ventajas (Ataque)",
    typeChartDisadvantagesLabel: "Desventajas (Defensa)",
    btnViewFlow: "Visualización de Flujo",
    btnViewTable: "Visualización de Tabla",
    viewAsTable: "Ver como Tabla",
    viewAsFlow: "Ver como Flujo",
    historyLevel: "Nivel",
    historyIvSum: "Suma IVs:",
    historyEvSum: "Suma EVs:"
  }
};

const typeRelations = {
  normal: {
    doubleDamageTo: [],
    halfDamageTo: ['rock', 'steel'],
    noDamageTo: ['ghost']
  },
  fire: {
    doubleDamageTo: ['grass', 'ice', 'bug', 'steel'],
    halfDamageTo: ['fire', 'water', 'rock', 'dragon'],
    noDamageTo: []
  },
  water: {
    doubleDamageTo: ['fire', 'ground', 'rock'],
    halfDamageTo: ['water', 'grass', 'dragon'],
    noDamageTo: []
  },
  electric: {
    doubleDamageTo: ['water', 'flying'],
    halfDamageTo: ['electric', 'grass', 'dragon'],
    noDamageTo: ['ground']
  },
  grass: {
    doubleDamageTo: ['water', 'ground', 'rock'],
    halfDamageTo: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'],
    noDamageTo: []
  },
  ice: {
    doubleDamageTo: ['grass', 'ground', 'flying', 'dragon'],
    halfDamageTo: ['fire', 'water', 'ice', 'steel'],
    noDamageTo: []
  },
  fighting: {
    doubleDamageTo: ['normal', 'ice', 'rock', 'dark', 'steel'],
    halfDamageTo: ['poison', 'flying', 'psychic', 'bug', 'fairy'],
    noDamageTo: ['ghost']
  },
  poison: {
    doubleDamageTo: ['grass', 'fairy'],
    halfDamageTo: ['poison', 'ground', 'rock', 'ghost'],
    noDamageTo: ['steel']
  },
  ground: {
    doubleDamageTo: ['fire', 'electric', 'poison', 'rock', 'steel'],
    halfDamageTo: ['grass', 'bug'],
    noDamageTo: ['flying']
  },
  flying: {
    doubleDamageTo: ['grass', 'fighting', 'bug'],
    halfDamageTo: ['electric', 'rock', 'steel'],
    noDamageTo: []
  },
  psychic: {
    doubleDamageTo: ['fighting', 'poison'],
    halfDamageTo: ['psychic', 'steel'],
    noDamageTo: ['dark']
  },
  bug: {
    doubleDamageTo: ['grass', 'psychic', 'dark'],
    halfDamageTo: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'],
    noDamageTo: []
  },
  rock: {
    doubleDamageTo: ['fire', 'ice', 'flying', 'bug'],
    halfDamageTo: ['fighting', 'ground', 'steel'],
    noDamageTo: []
  },
  ghost: {
    doubleDamageTo: ['psychic', 'ghost'],
    halfDamageTo: ['dark'],
    noDamageTo: ['normal']
  },
  dragon: {
    doubleDamageTo: ['dragon'],
    halfDamageTo: ['steel'],
    noDamageTo: ['fairy']
  },
  dark: {
    doubleDamageTo: ['psychic', 'ghost'],
    halfDamageTo: ['fighting', 'dark', 'fairy'],
    noDamageTo: []
  },
  steel: {
    doubleDamageTo: ['ice', 'rock', 'fairy'],
    halfDamageTo: ['fire', 'water', 'electric', 'steel'],
    noDamageTo: []
  },
  fairy: {
    doubleDamageTo: ['fighting', 'dragon', 'dark'],
    halfDamageTo: ['fire', 'poison', 'steel'],
    noDamageTo: []
  }
};

const orderedTypes = [
  'normal', 'fighting', 'flying', 'poison', 'ground', 'rock', 
  'bug', 'ghost', 'steel', 'fire', 'water', 'grass', 
  'electric', 'psychic', 'ice', 'dragon', 'dark', 'fairy'
];

const typeDisplayNames = {
  normal: 'NORMAL',
  fighting: 'FIGHT',
  flying: 'FLYING',
  poison: 'POISON',
  ground: 'GROUND',
  rock: 'ROCK',
  bug: 'BUG',
  ghost: 'GHOST',
  steel: 'STEEL',
  fire: 'FIRE',
  water: 'WATER',
  grass: 'GRASS',
  electric: 'ELECTRIC',
  psychic: 'PSYCHIC',
  ice: 'ICE',
  dragon: 'DRAGON',
  dark: 'DARK',
  fairy: 'FAIRY'
};

let currentLang = 'en'; // idioma inicial padrão

const detectDefaultLanguage = () => {
  const userLang = navigator.language || navigator.userLanguage;
  if (userLang) {
    if (userLang.startsWith('pt')) {
      currentLang = 'pt';
    } else if (userLang.startsWith('es')) {
      currentLang = 'es';
    }
  }
};

const translateItemName = (name) => {
  const itemTranslations = {
    pt: {
      'water-stone': 'Pedra Água',
      'fire-stone': 'Pedra Fogo',
      'thunder-stone': 'Pedra Trovão',
      'leaf-stone': 'Pedra Folha',
      'ice-stone': 'Pedra Gelo',
      'shiny-stone': 'Pedra Brilho',
      'dusk-stone': 'Pedra Crepúsculo',
      'dawn-stone': 'Pedra Alvorada',
      'sun-stone': 'Pedra Sol',
      'moon-stone': 'Pedra Lua',
      'oval-stone': 'Pedra Oval',
      'everstone': 'Pedra Eterna',
      'kings-rock': 'Rocha do Rei',
      'metal-coat': 'Revest. Metálico',
      'dragon-scale': 'Escama de Dragão',
      'upgrade': 'Upgrade',
      'protector': 'Protetor',
      'electirizer': 'Eletrizador',
      'magmarizer': 'Magmarizador',
      'dubious-disc': 'Disco Duvidoso',
      'reaper-cloth': 'Tecido Terrível',
      'prism-scale': 'Escama Prisma',
      'whipped-dream': 'Doce de Nata',
      'sachet': 'Sachê Perfumado',
      'sweet-apple': 'Maçã Doce',
      'tart-apple': 'Maçã Ácida',
      'chipped-pot': 'Bule Rachado',
      'cracked-pot': 'Bule Trincado',
      'black-augurite': 'Augurita Negra',
      'peat-block': 'Bloco de Turfa',
      'linking-cord': 'Cabo de Conexão'
    },
    en: {
      'water-stone': 'Water Stone',
      'fire-stone': 'Fire Stone',
      'thunder-stone': 'Thunder Stone',
      'leaf-stone': 'Leaf Stone',
      'ice-stone': 'Ice Stone',
      'shiny-stone': 'Shiny Stone',
      'dusk-stone': 'Dusk Stone',
      'dawn-stone': 'Dawn Stone',
      'sun-stone': 'Sun Stone',
      'moon-stone': 'Moon Stone',
      'oval-stone': 'Oval Stone',
      'everstone': 'Everstone',
      'kings-rock': "King's Rock",
      'metal-coat': 'Metal Coat',
      'dragon-scale': 'Dragon Scale',
      'upgrade': 'Up-Grade',
      'protector': 'Protector',
      'electirizer': 'Electirizer',
      'magmarizer': 'Magmarizer',
      'dubious-disc': 'Dubious Disc',
      'reaper-cloth': 'Reaper Cloth',
      'prism-scale': 'Prism Scale',
      'whipped-dream': 'Whipped Dream',
      'sachet': 'Sachet',
      'sweet-apple': 'Sweet Apple',
      'tart-apple': 'Tart Apple',
      'chipped-pot': 'Chipped Pot',
      'cracked-pot': 'Cracked Pot',
      'black-augurite': 'Black Augurite',
      'peat-block': 'Peat Block',
      'linking-cord': 'Linking Cord'
    },
    es: {
      'water-stone': 'Piedra Agua',
      'fire-stone': 'Piedra Fuego',
      'thunder-stone': 'Piedra Trueno',
      'leaf-stone': 'Piedra Hoja',
      'ice-stone': 'Piedra Hielo',
      'shiny-stone': 'Piedra Día',
      'dusk-stone': 'Piedra Noche',
      'dawn-stone': 'Piedra Alba',
      'sun-stone': 'Piedra Solar',
      'moon-stone': 'Piedra Lunar',
      'oval-stone': 'Piedra Oval',
      'everstone': 'Piedra Eterna',
      'kings-rock': 'Roca del Rey',
      'metal-coat': 'Revest. Metálico',
      'dragon-scale': 'Escama Dragón',
      'upgrade': 'Mejora',
      'protector': 'Protector',
      'electirizer': 'Electrizador',
      'magmarizer': 'Magmatizador',
      'dubious-disc': 'Disco Extraño',
      'reaper-cloth': 'Tela Terrible',
      'prism-scale': 'Escama Prisma',
      'whipped-dream': 'Dulce de Nata',
      'sachet': 'Saquito Aromático',
      'sweet-apple': 'Manzana Dulce',
      'tart-apple': 'Manzana Ácida',
      'chipped-pot': 'Tetera Rota',
      'cracked-pot': 'Tetera Agrietada',
      'black-augurite': 'Augurita Negra',
      'peat-block': 'Bloque de Turba',
      'linking-cord': 'Cordón Unión'
    }
  };
  return itemTranslations[currentLang]?.[name] || name.replace('-', ' ');
};

const getTypeTranslated = (type) => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};


const applyLanguage = () => {
  const t = translations[currentLang];
  if (!t) return;

  // Atualizar título da aba do navegador
  document.title = t.title;

  // Botões de aba
  if (elements.btnNewSearch) elements.btnNewSearch.textContent = t.newSearch;
  if (elements.btnHistory) elements.btnHistory.textContent = t.savedRecords;

  // Busca
  const searchH2 = document.querySelector('#search-section h2');
  if (searchH2) searchH2.textContent = t.selectPokemon;
  if (elements.pokemonSearch) elements.pokemonSearch.placeholder = t.searchPlaceholder;

  // Labels
  const lblLevel = document.getElementById('label-level');
  if (lblLevel) lblLevel.textContent = t.level;
  
  const txtNatureLabel = document.getElementById('text-nature-label');
  if (txtNatureLabel) txtNatureLabel.textContent = t.nature;

  const natureTooltipText = document.getElementById('nature-tooltip-text');
  if (natureTooltipText) natureTooltipText.textContent = t.natureTooltip;

  const lblNotesTitle = document.getElementById('label-notes-title');
  if (lblNotesTitle) lblNotesTitle.textContent = t.notesTitle;

  const txtPokemonNotes = document.getElementById('pokemon-notes');
  if (txtPokemonNotes) txtPokemonNotes.placeholder = t.notesPlaceholder;

  const labelHeaderTypes = document.getElementById('label-header-types');
  if (labelHeaderTypes) labelHeaderTypes.textContent = t.typesLabel;

  const labelHeaderAbilities = document.getElementById('label-header-abilities');
  if (labelHeaderAbilities) labelHeaderAbilities.textContent = t.abilitiesLabel;

  const lblEvModalTitle = document.getElementById('label-ev-modal-title');
  if (lblEvModalTitle) lblEvModalTitle.textContent = t.evModalTitle;

  const lblEvModalSearch = document.getElementById('label-ev-modal-search');
  if (lblEvModalSearch) lblEvModalSearch.textContent = t.evModalSearch;

  const txtEvModalSearchInput = document.getElementById('ev-modal-search-input');
  if (txtEvModalSearchInput) txtEvModalSearchInput.placeholder = t.searchHelperPlaceholder;

  const lblEvModalStats = document.getElementById('label-ev-modal-stats');
  if (lblEvModalStats) lblEvModalStats.textContent = t.evModalStats;

  const lblEvModalYields = document.getElementById('label-ev-modal-yields');
  if (lblEvModalYields) lblEvModalYields.textContent = t.evModalYields;

  const lblEvModalTypes = document.getElementById('label-ev-modal-types');
  if (lblEvModalTypes) lblEvModalTypes.textContent = t.evModalTypes;

  const colPokemon = document.getElementById('col-pokemon');
  if (colPokemon) colPokemon.textContent = t.pokemon || "Pokémon";

  const colDex = document.getElementById('col-dex');
  if (colDex) colDex.textContent = "Dex";

  const colTypes = document.getElementById('col-types');
  if (colTypes) colTypes.textContent = t.typesLabel ? t.typesLabel.replace(':', '') : "Tipos";

  const colYield = document.getElementById('col-yield');
  if (colYield) colYield.textContent = t.evYield || "EV Yield";

  renderModalTypeFilters();

  const lblEvTrainingTitle = document.getElementById('label-ev-training-title');
  if (lblEvTrainingTitle) {
    const txt = lblEvTrainingTitle.querySelector('.title-text') || lblEvTrainingTitle;
    txt.textContent = t.evTrainingTitle;
  }
  const evTrainingTooltip = document.getElementById('ev-training-tooltip-text');
  if (evTrainingTooltip) evTrainingTooltip.textContent = t.evTrainingTooltip;

  const lblTargetEv = document.getElementById('label-target-ev');
  if (lblTargetEv) lblTargetEv.textContent = t.targetEvLabel;

  const lblSearchHelper = document.getElementById('label-search-helper');
  if (lblSearchHelper) lblSearchHelper.textContent = t.searchHelperLabel;

  const txtEvHelperSearch = document.getElementById('ev-helper-search');
  if (txtEvHelperSearch) txtEvHelperSearch.placeholder = t.searchHelperPlaceholder;

  const lblRecommended = document.getElementById('label-recommended');
  if (lblRecommended) lblRecommended.textContent = t.recommendedLabel;

  const lblTrainingTargets = document.getElementById('label-training-targets');
  if (lblTrainingTargets) lblTrainingTargets.textContent = t.trainingTargetsLabel;

  const lblEvsUsed = document.getElementById('label-evs-used');
  if (lblEvsUsed) {
    const txt = lblEvsUsed.querySelector('.title-text') || lblEvsUsed;
    txt.textContent = t.evsUsed;
  }
  const evsUsedTooltip = document.getElementById('evs-used-tooltip-text');
  if (evsUsedTooltip) evsUsedTooltip.textContent = t.evsUsedTooltip;

  const lblRemaining = document.getElementById('label-remaining');
  if (lblRemaining) lblRemaining.textContent = t.remaining;
  const lblQualityIvs = document.getElementById('label-quality-ivs');
  if (lblQualityIvs) lblQualityIvs.textContent = t.ivQuality;

  // Tabela de status headers
  const thStat = document.getElementById('th-stat');
  if (thStat) {
    const txt = thStat.querySelector('.th-text') || thStat;
    txt.textContent = t.stat;
  }
  const statTooltip = document.getElementById('stat-tooltip-text');
  if (statTooltip) statTooltip.textContent = t.statTooltip;

  const thBase = document.getElementById('th-base');
  if (thBase) {
    const txt = thBase.querySelector('.th-text') || thBase;
    txt.textContent = t.base;
  }
  const baseTooltip = document.getElementById('base-tooltip-text');
  if (baseTooltip) baseTooltip.textContent = t.baseTooltip;

  const thIv = document.getElementById('th-iv');
  if (thIv) {
    const txt = thIv.querySelector('.th-text') || thIv;
    const parts = t.iv.split(' ');
    if (parts.length >= 2) {
      txt.innerHTML = `<span class="main-label">${parts[0]}</span> <span class="range-sub">${parts.slice(1).join(' ')}</span>`;
    } else {
      txt.textContent = t.iv;
    }
  }
  const ivTooltip = document.getElementById('iv-tooltip-text');
  if (ivTooltip) ivTooltip.textContent = t.ivTooltip;

  const thEv = document.getElementById('th-ev');
  if (thEv) {
    const txt = thEv.querySelector('.th-text') || thEv;
    const parts = t.ev.split(' ');
    if (parts.length >= 2) {
      txt.innerHTML = `<span class="main-label">${parts[0]}</span> <span class="range-sub">${parts.slice(1).join(' ')}</span>`;
    } else {
      txt.textContent = t.ev;
    }
  }
  const evTooltip = document.getElementById('ev-tooltip-text');
  if (evTooltip) evTooltip.textContent = t.evTooltip;

  const thMin = document.getElementById('th-min');
  if (thMin) thMin.textContent = t.min;
  const thMax = document.getElementById('th-max');
  if (thMax) thMax.textContent = t.max;
  const thTotal = document.getElementById('th-total');
  if (thTotal) thTotal.textContent = t.total;

  // Rodapé da tabela
  const tdSubtotal = document.getElementById('td-subtotal');
  if (tdSubtotal) tdSubtotal.textContent = t.subtotal;
  const tdSomatotal = document.getElementById('td-somatotal');
  if (tdSomatotal) tdSomatotal.textContent = t.somaTotal;

  // Efetividade
  const lblEffectivenessTitle = document.getElementById('label-effectiveness-title');
  if (lblEffectivenessTitle) {
    const txt = lblEffectivenessTitle.querySelector('.title-text') || lblEffectivenessTitle;
    txt.textContent = t.typeEffectiveness;
  }
  const effectivenessTooltip = document.getElementById('effectiveness-tooltip-text');
  if (effectivenessTooltip) effectivenessTooltip.textContent = t.effectivenessTooltip;
  const lblAdvantages = document.getElementById('label-advantages');
  if (lblAdvantages) lblAdvantages.textContent = t.advantages;
  const lblDisadvantages = document.getElementById('label-disadvantages');
  if (lblDisadvantages) lblDisadvantages.textContent = t.disadvantages;

  // Linha Evolutiva
  const lblEvolutionTitle = document.getElementById('label-evolution-title');
  if (lblEvolutionTitle) lblEvolutionTitle.textContent = t.evolutionChain;

  // Histórico
  const histTitle = document.querySelector('#history-section h2');
  if (histTitle) histTitle.textContent = t.savedRecords;

  // Modal de Confirmação Nova Pesquisa
  const confTitle = document.querySelector('#confirm-modal h2');
  if (confTitle) confTitle.textContent = t.saveSearchQuestion;
  const confPrompt = document.querySelector('#confirm-modal p');
  if (confPrompt) confPrompt.textContent = t.saveSearchPrompt;
  const confYes = document.getElementById('btn-confirm-yes');
  if (confYes) confYes.textContent = t.yes;
  const confNo = document.getElementById('btn-confirm-no');
  if (confNo) confNo.textContent = t.no;

  // Modal de Confirmação Navegação
  const evoTitle = document.querySelector('#evo-confirm-modal h2');
  if (evoTitle) evoTitle.textContent = t.confirmTitle;
  const evoPrompt = document.querySelector('#evo-confirm-modal p');
  if (evoPrompt) evoPrompt.textContent = t.confirmPrompt;
  const evoYes = document.getElementById('btn-evo-confirm-yes');
  if (evoYes) evoYes.textContent = t.confirmYes;
  const evoNo = document.getElementById('btn-evo-confirm-no');
  if (evoNo) evoNo.textContent = t.confirmNo;
  const evoCancel = document.getElementById('btn-evo-confirm-cancel');
  if (evoCancel) evoCancel.textContent = t.cancel;

  // Modal de Naturezas
  const natTitle = document.querySelector('#nature-modal h2');
  if (natTitle) natTitle.textContent = t.natureTable;
  if (elements.toggleNatureViewBtn) {
    elements.toggleNatureViewBtn.textContent = natureView === 'matrix' ? t.alphabetical : t.statsOrder;
  }

  // Bandeiras ativas
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === currentLang);
  });

  // Atualizar nomes de natureza no select se já carregados
  if (natures.length > 0) {
    const prevVal = elements.natureSelect.value;
    populateNatures();
    if (prevVal) {
      elements.natureSelect.value = prevVal;
      updateNatureTrigger();
    }
    populateNatureTable();
    populateNatureMatrix();
  }

  // Atualizar o Pokémon atual na tela se houver
  if (currentPokemon) {
    renderPokemonInfo();
    updateStats();
    renderEffectiveness();
    renderEvolutionChain();
  }

  // Atualizar lista de alvos de EV
  renderEvTrainingList();

  // Atualizar Tabela de Vantagens
  if (elements.btnTypeChart) elements.btnTypeChart.textContent = t.typeChartTable;
  const lblTypeChartTitle = document.getElementById('label-type-chart-title');
  if (lblTypeChartTitle) lblTypeChartTitle.textContent = t.typeChartTable;
  const btnToggleView = document.getElementById('btn-toggle-type-chart-view');
  if (btnToggleView) {
    btnToggleView.textContent = currentTypeChartView === 'flow' ? t.viewAsTable : t.viewAsFlow;
  }
  const flowContainer = document.getElementById('type-chart-flow-container');
  const tableContainer = document.getElementById('type-chart-table-container');
  if (flowContainer && tableContainer) {
    flowContainer.style.display = currentTypeChartView === 'flow' ? 'block' : 'none';
    tableContainer.style.display = currentTypeChartView === 'table' ? 'block' : 'none';
  }

  renderTypeChartFlow();
  renderTypeChartTable();
  updateLangDropdownUI();
  renderHistory();
};



const elements = {
  calcSection: document.getElementById('calculator-section'),
  searchSection: document.getElementById('search-section'),
  btnNewSearch: document.getElementById('btn-new-search'),
  btnHistory: document.getElementById('btn-history'),
  pokeImg: document.getElementById('poke-img'),
  pokeNameId: document.getElementById('poke-name-id'),
  pokeTypes: document.getElementById('poke-types'),
  levelInput: document.getElementById('level'),
  levelRange: document.getElementById('level-range'),
  natureSelect: document.getElementById('nature'),
  natureHelpBtn: document.getElementById('nature-help'),
  natureModal: document.getElementById('nature-modal'),
  natureTableBody: document.getElementById('nature-table-body'),
  natureListView: document.getElementById('nature-list-view'),
  natureMatrixView: document.getElementById('nature-matrix-view'),
  matrixHead: document.getElementById('matrix-head'),
  matrixBody: document.getElementById('matrix-body'),
  toggleNatureViewBtn: document.getElementById('toggle-nature-view'),
  closeModal: document.getElementById('close-modal'),
  statsBody: document.getElementById('stats-body'),
  baseTotalSum: document.getElementById('base-total-sum'),
  statTotalSum: document.getElementById('stat-total-sum'),
  evYield: document.getElementById('ev-yield'),
  ivQuality: document.getElementById('iv-quality'),
  evolutionSection: document.getElementById('evolution-section'),
  evolutionChain: document.getElementById('evolution-chain'),
  clearBtn: document.getElementById('clear-data'),
  pokemonSearch: document.getElementById('pokemon-search'),
  confirmModal: document.getElementById('confirm-modal'),
  btnTypeChart: document.getElementById('btn-type-chart'),
  typeChartSection: document.getElementById('type-chart-section')
};

const langFlags = {
  pt: { code: 'br', name: 'Português', url: 'https://flagcdn.com/w40/br.png' },
  en: { code: 'us', name: 'English', url: 'https://flagcdn.com/w40/us.png' },
  es: { code: 'es', name: 'Español', url: 'https://flagcdn.com/w40/es.png' }
};

const updateLangDropdownUI = () => {
  const triggerImg = document.getElementById('current-lang-flag');
  const optionsContainer = document.getElementById('lang-dropdown-options');
  if (!triggerImg || !optionsContainer) return;

  const activeInfo = langFlags[currentLang];
  triggerImg.src = activeInfo.url;
  triggerImg.alt = activeInfo.name;

  let optionsHtml = '';
  Object.entries(langFlags).forEach(([lang, info]) => {
    if (lang !== currentLang) {
      optionsHtml += `
        <div class="lang-option" data-lang="${lang}">
          <img src="${info.url}" alt="${info.name}" class="flag-img">
          <span>${info.name}</span>
        </div>
      `;
    }
  });
  optionsContainer.innerHTML = optionsHtml;

  document.querySelectorAll('.lang-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const selectedLang = opt.getAttribute('data-lang');
      if (selectedLang && selectedLang !== currentLang) {
        currentLang = selectedLang;
        applyLanguage();
        document.getElementById('lang-dropdown').classList.remove('open');
      }
    });
  });
};

const initLangDropdown = () => {
  const dropdown = document.getElementById('lang-dropdown');
  const trigger = document.getElementById('lang-dropdown-trigger');
  
  if (!dropdown || !trigger) return;

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });

  updateLangDropdownUI();
};

const init = async () => {
  initTheme();
  detectDefaultLanguage();
  applyLanguage();

  natures = await fetchNatures();
  populateNatures();
  populateNatureTable();
  populateNatureMatrix();
  applyLanguage(); // Atualiza tabelas e listas de naturezas recém-carregadas

  initLangDropdown();

  window.addEventListener('resize', () => {
    const somaTotalTd = document.getElementById('td-somatotal')?.parentElement;
    if (somaTotalTd) {
      if (window.innerWidth <= 768) {
        somaTotalTd.setAttribute('colspan', '2');
      } else {
        somaTotalTd.setAttribute('colspan', '4');
      }
    }
  });

  let lastScrollY = window.scrollY;
  window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (!header) return;

    const currentScrollY = window.scrollY;
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      if (currentScrollY <= 150) {
        header.classList.remove('header-hidden');
      } else {
        header.classList.add('header-hidden');
      }
    } else {
      if (currentScrollY <= 50) {
        header.classList.remove('header-hidden');
      } else if (currentScrollY > lastScrollY) {
        header.classList.add('header-hidden');
      } else {
        header.classList.remove('header-hidden');
      }
    }
    lastScrollY = currentScrollY;
  });

  await initSearch(handlePokemonSelect);


  const lastPokeId = loadData('last_pokemon_id');
  if (lastPokeId) {
    handlePokemonSelect(lastPokeId);
  }

  const syncLevel = (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) val = 1;
    if (val < 1) val = 1;
    if (val > 100) val = 100;

    elements.levelInput.value = val;
    elements.levelRange.value = val;
    updateStats();
  };

  elements.levelInput.addEventListener('input', syncLevel);
  elements.levelRange.addEventListener('input', syncLevel);
  
  elements.natureSelect.addEventListener('change', () => {
    updateNatureTrigger();
    updateStats();
  });

  const notesTextarea = document.getElementById('pokemon-notes');
  if (notesTextarea) {
    notesTextarea.addEventListener('input', () => {
      updateStats();
    });
  }

  const trigger = document.getElementById('nature-select-trigger');
  if (trigger) {
    trigger.addEventListener('click', () => {
      elements.natureModal.style.display = 'flex';
    });
  }

  elements.natureHelpBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  elements.toggleNatureViewBtn.addEventListener('click', () => {
    const t = translations[currentLang];
    if (natureView === 'matrix') {
      natureView = 'list';
      elements.natureListView.style.display = 'block';
      elements.natureMatrixView.style.display = 'none';
      elements.toggleNatureViewBtn.textContent = t.statsOrder;
    } else {
      natureView = 'matrix';
      elements.natureListView.style.display = 'none';
      elements.natureMatrixView.style.display = 'block';
      elements.toggleNatureViewBtn.textContent = t.alphabetical;
    }
  });

  elements.closeModal.addEventListener('click', () => {
    elements.natureModal.style.display = 'none';
  });

  window.addEventListener('click', (e) => {
    if (e.target === elements.natureModal) {
      elements.natureModal.style.display = 'none';
    }
    if (e.target === elements.confirmModal) {
      elements.confirmModal.style.display = 'none';
    }
    const evoModal = document.getElementById('evo-confirm-modal');
    if (e.target === evoModal) {
      evoModal.style.display = 'none';
    }
    const evHelperModal = document.getElementById('ev-helper-modal');
    if (e.target === evHelperModal) {
      evHelperModal.style.display = 'none';
    }
  });


  // Eventos de Abas do Cabeçalho
  elements.btnNewSearch.addEventListener('click', () => {
    if (currentPokemon) {
      confirmNavigation(() => {
        switchTab('search');
      });
    } else {
      switchTab('search');
    }
  });

  if (elements.btnHistory) {
    elements.btnHistory.addEventListener('click', () => {
      switchTab('history');
    });
  }

  if (elements.btnTypeChart) {
    elements.btnTypeChart.addEventListener('click', () => {
      if (currentPokemon) {
        confirmNavigation(() => {
          switchTab('typechart');
        });
      } else {
        switchTab('typechart');
      }
    });
  }

  const btnToggleView = document.getElementById('btn-toggle-type-chart-view');
  if (btnToggleView) {
    btnToggleView.addEventListener('click', () => {
      currentTypeChartView = currentTypeChartView === 'flow' ? 'table' : 'flow';
      applyLanguage();
    });
  }

  if (elements.clearBtn) {
    elements.clearBtn.addEventListener('click', () => {
      clearData('last_pokemon_id');
      clearData('pokemon_config');
      window.location.reload();
    });
  }
  initEvHelper();
};

const switchTab = (tab) => {
  if (tab === 'calc') {
    elements.calcSection.style.display = 'grid';
    elements.searchSection.style.display = 'none';
    document.getElementById('history-section').style.display = 'none';
    if (elements.typeChartSection) elements.typeChartSection.style.display = 'none';
    elements.btnNewSearch.className = 'nav-item active';
    if (elements.btnHistory) elements.btnHistory.className = 'nav-item';
    if (elements.btnTypeChart) elements.btnTypeChart.className = 'nav-item';
    elements.btnNewSearch.style.display = 'inline-block';
  } else if (tab === 'search') {
    currentPokemon = null; // Reseta o pokemon atual para poder pesquisar do zero
    elements.calcSection.style.display = 'none';
    elements.searchSection.style.display = 'flex';
    document.getElementById('history-section').style.display = 'none';
    if (elements.typeChartSection) elements.typeChartSection.style.display = 'none';
    elements.btnNewSearch.className = 'nav-item active';
    if (elements.btnHistory) elements.btnHistory.className = 'nav-item';
    if (elements.btnTypeChart) elements.btnTypeChart.className = 'nav-item';
    elements.btnNewSearch.style.display = 'inline-block';
  } else if (tab === 'history') {
    elements.calcSection.style.display = 'none';
    elements.searchSection.style.display = 'none';
    document.getElementById('history-section').style.display = 'block';
    if (elements.typeChartSection) elements.typeChartSection.style.display = 'none';
    elements.btnNewSearch.className = 'nav-item';
    if (elements.btnHistory) elements.btnHistory.className = 'nav-item active';
    if (elements.btnTypeChart) elements.btnTypeChart.className = 'nav-item';
    elements.btnNewSearch.style.display = 'inline-block';
    renderHistory();
  } else if (tab === 'typechart') {
    elements.calcSection.style.display = 'none';
    elements.searchSection.style.display = 'none';
    document.getElementById('history-section').style.display = 'none';
    if (elements.typeChartSection) elements.typeChartSection.style.display = 'block';
    elements.btnNewSearch.className = 'nav-item';
    if (elements.btnHistory) elements.btnHistory.className = 'nav-item';
    if (elements.btnTypeChart) elements.btnTypeChart.className = 'nav-item active';
    elements.btnNewSearch.style.display = 'inline-block';
    
    const flowContainer = document.getElementById('type-chart-flow-container');
    const tableContainer = document.getElementById('type-chart-table-container');
    if (flowContainer && tableContainer) {
      flowContainer.style.display = currentTypeChartView === 'flow' ? 'block' : 'none';
      tableContainer.style.display = currentTypeChartView === 'table' ? 'block' : 'none';
    }
    
    renderTypeChartFlow();
    renderTypeChartTable();
  }
};

const savePokemonToHistory = () => {
  if (!currentPokemon) return;

  const level = parseInt(elements.levelInput.value) || 1;
  const natureName = getEnglishNature(elements.natureSelect.value);

  const ivs = {};
  const evs = {};
  currentPokemon.stats.forEach(s => {
    const statName = mapStatName(s.stat.name);
    ivs[statName] = parseInt(document.getElementById(`iv-${statName}`).value) || 0;
    evs[statName] = parseInt(document.getElementById(`ev-${statName}`).value) || 0;
  });

  const notesTextarea = document.getElementById('pokemon-notes');
  const notesValue = notesTextarea ? notesTextarea.value : '';

  const timestamp = (loadedConfig && loadedConfig.timestamp) ? loadedConfig.timestamp : Date.now();

  const record = {
    timestamp: timestamp,
    id: currentPokemon.id,
    name: currentPokemon.name,
    level: level,
    nature: natureName,
    ivs: ivs,
    evs: evs,
    notes: notesValue,
    evTargets: JSON.parse(JSON.stringify(currentEvTargets)),
    sprite: currentPokemon.sprites.other['official-artwork'].front_default || currentPokemon.sprites.front_default,
    types: currentPokemon.types.map(t => getEnglishType(t.type.name))
  };

  let history = loadData('saved_pokemon_records') || [];

  if (loadedConfig && loadedConfig.timestamp) {
    const idx = history.findIndex(r => r.timestamp === loadedConfig.timestamp);
    if (idx !== -1) {
      history[idx] = record;
    } else {
      history.push(record);
    }
  } else {
    history.push(record);
  }

  saveData('saved_pokemon_records', history);
  captureLoadedConfig(timestamp);
};

const getTypeWeaknesses = (targetType) => {
  return orderedTypes.filter(atkType => {
    return typeRelations[atkType].doubleDamageTo.includes(targetType);
  });
};

const getTypeStrengths = (attackerType) => {
  return typeRelations[attackerType].doubleDamageTo;
};

const renderTypeChartFlow = () => {
  const container = document.getElementById('type-chart-flow-container');
  if (!container) return;

  const t = translations[currentLang];

  const html = orderedTypes.map(type => {
    const weaknesses = getTypeWeaknesses(type);
    const strengths = getTypeStrengths(type);
    const weaknessesHtml = weaknesses.map(w => `<span class="type-pill" style="background-color: var(--type-${w})">${typeDisplayNames[w]}</span>`).join('');
    const strengthsHtml = strengths.map(s => `<span class="type-pill" style="background-color: var(--type-${s})">${typeDisplayNames[s]}</span>`).join('');
    
    return `
      <div class="type-relation-row">
        <div class="relation-col weaknesses">
          ${weaknessesHtml || '<span class="none-pill">—</span>'}
        </div>
        <div class="relation-col arrow-left">➜</div>
        <div class="relation-col target">
          <span class="type-pill target-pill" style="background-color: var(--type-${type})">${typeDisplayNames[type]}</span>
        </div>
        <div class="relation-col arrow-right">➜</div>
        <div class="relation-col strengths">
          ${strengthsHtml || '<span class="none-pill">—</span>'}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="type-chart-flow-legend">
      <div class="legend-col">${t.weaknessesLegend}</div>
      <div class="legend-col"></div>
      <div class="legend-col">${t.targetLegend}</div>
      <div class="legend-col"></div>
      <div class="legend-col">${t.strengthsLegend}</div>
    </div>
    <div class="type-chart-flow-list">
      ${html}
    </div>
  `;
};

const renderTypeChartTable = () => {
  const container = document.getElementById('type-chart-table-container');
  if (!container) return;

  // Header row (Defenders)
  let headerColsHtml = `<th class="matrix-header-origin">ATK ↓</th>`;
  orderedTypes.forEach(t => {
    headerColsHtml += `<th class="matrix-header-col" style="background-color: var(--type-${t})">${typeDisplayNames[t]}</th>`;
  });

  // Table rows (Attackers)
  const rowsHtml = orderedTypes.map(atk => {
    let cellsHtml = `<td class="matrix-header-row" style="background-color: var(--type-${atk})">${typeDisplayNames[atk]}</td>`;
    
    orderedTypes.forEach(def => {
      let multiplier = 1;
      if (typeRelations[atk].doubleDamageTo.includes(def)) {
        multiplier = 2;
      } else if (typeRelations[atk].halfDamageTo.includes(def)) {
        multiplier = 0.5;
      } else if (typeRelations[atk].noDamageTo.includes(def)) {
        multiplier = 0;
      }
      
      let cellClass = 'cell-default';
      let text = '1x';
      if (multiplier === 2) {
        cellClass = 'cell-double';
        text = '2x';
      } else if (multiplier === 0.5) {
        cellClass = 'cell-half';
        text = '0.5x';
      } else if (multiplier === 0) {
        cellClass = 'cell-no';
        text = '0x';
      }
      
      cellsHtml += `<td class="matrix-cell ${cellClass}">${text}</td>`;
    });
    
    return `<tr>${cellsHtml}</tr>`;
  }).join('');

  container.innerHTML = `
    <table class="effectiveness-matrix-table">
      <thead>
        <tr>${headerColsHtml}</tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;
};

const getEnglishNature = (natureVal) => {
  if (!natureVal) return 'bashful';
  const valLower = natureVal.toLowerCase();
  if (translations['en'][valLower]) return valLower;
  
  for (const lang of Object.keys(translations)) {
    const dict = translations[lang];
    for (const key of Object.keys(dict)) {
      if (translations['en'][key] && typeof dict[key] === 'string' && dict[key].toLowerCase() === valLower) {
        return key;
      }
    }
  }
  return valLower;
};

const getEnglishType = (typeVal) => {
  if (!typeVal) return 'normal';
  const valLower = typeVal.toLowerCase();
  if (translations['en'][valLower]) return valLower;
  
  for (const lang of Object.keys(translations)) {
    const dict = translations[lang];
    for (const key of Object.keys(dict)) {
      if (translations['en'][key] && typeof dict[key] === 'string' && dict[key].toLowerCase() === valLower) {
        const validTypes = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'];
        if (validTypes.includes(key)) {
          return key;
        }
      }
    }
  }
  return valLower;
};

const renderHistory = () => {
  const listEl = document.getElementById('history-list');
  if (!listEl) return;

  const t = translations[currentLang];
  const history = loadData('saved_pokemon_records') || [];

  if (history.length === 0) {
    listEl.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); font-weight: 700; margin: 2rem 0; font-size: 0.95rem;">${t.noHistory}</p>`;
    return;
  }

  const localeMap = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' };
  const currentLocale = localeMap[currentLang] || 'en-US';

  listEl.innerHTML = history.sort((a, b) => b.timestamp - a.timestamp).map(record => {
    const formattedDate = new Date(record.timestamp).toLocaleString(currentLocale);
    const englishTypes = (record.types || []).map(tKey => getEnglishType(tKey));
    const typesHtml = englishTypes.map(tKey => {
      const typeLabel = translations['en'][tKey] || tKey;
      const typeLabelCap = typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1);
      return `<span class="type-pill" style="background-color: var(--type-${tKey})">${typeLabelCap}</span>`;
    }).join('');
    
    const englishNatureKey = getEnglishNature(record.nature);
    const englishNature = translations['en'][englishNatureKey] || englishNatureKey;
    const natureLabel = englishNature.charAt(0).toUpperCase() + englishNature.slice(1);
    const lvlLabel = t.historyLevel || "Level";

    return `
      <div class="history-card">
        <div class="history-card-header">
          <img src="${record.sprite}" alt="${record.name}">
          <div class="history-card-title">
            <strong>${record.name.toUpperCase()}</strong>
            <span>${lvlLabel} ${record.level} • ${natureLabel}</span>
          </div>
        </div>
        <div class="history-card-details">
          <span>${t.typesLabel || "Types:"}</span>
          <div style="display: flex; gap: 0.2rem; justify-content: flex-end;">${typesHtml}</div>
          <span>${t.historyIvSum || "IV Sum:"}</span>
          <div style="text-align: right;"><strong>${Object.values(record.ivs).reduce((a, b) => a + b, 0)}</strong></div>
          <span>${t.historyEvSum || "EV Sum:"}</span>
          <div style="text-align: right;"><strong>${Object.values(record.evs).reduce((a, b) => a + b, 0)}/510</strong></div>
          <div style="font-size: 0.65rem; color: var(--text-secondary); grid-column: 1 / -1; text-align: right; margin-top: 0.4rem;">${t.savedAt} ${formattedDate}</div>
        </div>
        <div class="history-card-actions">
          <button class="btn-load-record" data-timestamp="${record.timestamp}">${t.load}</button>
          <button class="btn-delete-record" data-timestamp="${record.timestamp}">${t.delete}</button>
        </div>
      </div>
    `;
  }).join('');

  // Adiciona listeners de clique
  document.querySelectorAll('.btn-load-record').forEach(btn => {
    btn.addEventListener('click', () => {
      const timestamp = parseInt(btn.getAttribute('data-timestamp'));
      confirmNavigation(() => {
        loadRecord(timestamp);
      });
    });
  });

  document.querySelectorAll('.btn-delete-record').forEach(btn => {
    btn.addEventListener('click', () => {
      const timestamp = parseInt(btn.getAttribute('data-timestamp'));
      deleteRecord(timestamp);
    });
  });
};

const loadRecord = async (timestamp) => {
  const history = loadData('saved_pokemon_records') || [];
  const record = history.find(r => r.timestamp === timestamp);
  if (!record) return;

  // Carrega o Pokémon
  await handlePokemonSelect(record.id, true);

  // Define inputs com os dados carregados
  elements.levelInput.value = record.level;
  elements.levelRange.value = record.level;
  elements.natureSelect.value = getEnglishNature(record.nature);
  updateNatureTrigger();

  const notesTextarea = document.getElementById('pokemon-notes');
  if (notesTextarea) {
    notesTextarea.value = record.notes || '';
  }

  currentEvTargets = record.evTargets ? JSON.parse(JSON.stringify(record.evTargets)) : [];
  renderEvTrainingList();

  Object.keys(record.ivs).forEach(stat => {
    const ivEl = document.getElementById(`iv-${stat}`);
    if (ivEl) ivEl.value = record.ivs[stat];
  });

  Object.keys(record.evs).forEach(stat => {
    const evEl = document.getElementById(`ev-${stat}`);
    if (evEl) evEl.value = record.evs[stat];
  });

  updateStats();
  captureLoadedConfig(record.timestamp);
  switchTab('calc');
};

const deleteRecord = (timestamp) => {
  let history = loadData('saved_pokemon_records') || [];
  history = history.filter(r => r.timestamp !== timestamp);
  saveData('saved_pokemon_records', history);
  renderHistory();
};

const getStatShortName = (name) => {
  const map = {
    'attack': 'ATK',
    'defense': 'DEF',
    'special-attack': 'SPA',
    'special-defense': 'SPD',
    'speed': 'SPE'
  };
  return map[name] || name;
};

const getNatureFormattedText = (n) => {
  if (n.increased === n.decreased) return `${n.name.charAt(0).toUpperCase() + n.name.slice(1)} <span style="opacity: 0.6; font-size: 0.8rem;">(Neutro)</span>`;
  return `${n.name.charAt(0).toUpperCase() + n.name.slice(1)} <span style="font-size:0.75rem; margin-left: 0.5rem; font-weight: 800;"><span class="stat-up-arrow">▲</span>${getStatShortName(n.increased)} / <span class="stat-down-arrow">▼</span>${getStatShortName(n.decreased)}</span>`;
};

const getNatureCleanText = (n) => {
  if (n.increased === n.decreased) return `${n.name.charAt(0).toUpperCase() + n.name.slice(1)} (Neutro)`;
  return `${n.name.charAt(0).toUpperCase() + n.name.slice(1)} (▲${getStatShortName(n.increased)} / ▼${getStatShortName(n.decreased)})`;
};

const updateNatureTrigger = () => {
  const select = elements.natureSelect;
  const triggerText = document.getElementById('selected-nature-name');
  if (select && triggerText) {
    const val = select.value;
    const n = natures.find(x => x.name === val);
    if (n) {
      triggerText.innerHTML = getNatureFormattedText(n);
    }
  }
};

const populateNatures = () => {
  elements.natureSelect.innerHTML = natures.map(n => {
    return `<option value="${n.name}">${getNatureCleanText(n)}</option>`;
  }).join('');

  const bashful = natures.findIndex(n => n.name === 'bashful');
  if (bashful !== -1) elements.natureSelect.selectedIndex = bashful;
  updateNatureTrigger();
};

const setupNatureClickListeners = () => {
  document.querySelectorAll('.clickable-nature').forEach(el => {
    el.onclick = () => {
      const natureName = el.getAttribute('data-nature');
      if (natureName && elements.natureSelect) {
        elements.natureSelect.value = natureName;
        elements.natureSelect.dispatchEvent(new Event('change'));
        updateNatureTrigger();
        elements.natureModal.style.display = 'none';
      }
    };
  });
};

const populateNatureTable = () => {
  elements.natureTableBody.innerHTML = natures.sort((a, b) => a.name.localeCompare(b.name)).map(n => `
    <tr class="clickable-nature" data-nature="${n.name}">
      <td><strong>${n.name.charAt(0).toUpperCase() + n.name.slice(1)}</strong></td>
      <td>${n.increased ? `<span class="stat-up-arrow">▲</span> <span class="stat-up">${getStatShortName(n.increased)}</span>` : '<span style="opacity: 0.5;">Neutro</span>'}</td>
      <td>${n.decreased ? `<span class="stat-down-arrow">▼</span> <span class="stat-down">${getStatShortName(n.decreased)}</span>` : '<span style="opacity: 0.5;">Neutro</span>'}</td>
    </tr>
  `).join('');

  setupNatureClickListeners();
};

const handlePokemonSelect = async (id, isFromHistory = false) => {
  currentPokemon = await fetchPokemonDetails(id);
  saveData('last_pokemon_id', id);

  renderPokemonInfo();
  renderStatsTable();
  await renderEffectiveness();
  await renderEvolutionChain();

  switchTab('calc');

  const notesTextarea = document.getElementById('pokemon-notes');

  if (!isFromHistory) {
    const savedConfig = loadData('pokemon_config');
    if (notesTextarea) {
      notesTextarea.value = (savedConfig && savedConfig.id === id) ? (savedConfig.notes || '') : '';
    }

    currentEvTargets = (savedConfig && savedConfig.id === id && savedConfig.evTargets) ? JSON.parse(JSON.stringify(savedConfig.evTargets)) : [];
    renderEvTrainingList();

    if (savedConfig && savedConfig.id === id) {
      elements.levelInput.value = savedConfig.level;
      elements.levelRange.value = savedConfig.level;
      elements.natureSelect.value = savedConfig.nature;
      updateNatureTrigger();

      setTimeout(() => {
        Object.keys(savedConfig.ivs).forEach(stat => {
          const ivInput = document.getElementById(`iv-${stat}`);
          const evInput = document.getElementById(`ev-${stat}`);
          if (ivInput) ivInput.value = savedConfig.ivs[stat];
          if (evInput) evInput.value = savedConfig.evs[stat];
        });
        updateStats();
        captureLoadedConfig(null);
      }, 0);
    } else {
      updateStats();
      captureLoadedConfig(null);
    }
  } else {
    if (notesTextarea) notesTextarea.value = '';
    currentEvTargets = [];
    renderEvTrainingList();
    updateStats();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const renderPokemonInfo = () => {
  elements.pokeImg.src = currentPokemon.sprites.other['official-artwork'].front_default || currentPokemon.sprites.front_default;
  elements.pokeNameId.innerHTML = `<span class="poke-id">#${currentPokemon.id.toString().padStart(3, '0')}</span><span class="poke-name">${currentPokemon.name.toUpperCase()}</span>`;

  elements.pokeTypes.innerHTML = currentPokemon.types.map(t =>
    `<span class="type-pill" style="background-color: var(--type-${t.type.name})">${t.type.name}</span>`
  ).join('');

  // Habilidades (Abilities)
  const abilitiesEl = document.getElementById('poke-abilities');
  if (abilitiesEl && currentPokemon.abilities) {
    const hiddenText = translations[currentLang].hiddenAbilityText || '(Hidden)';
    abilitiesEl.innerHTML = currentPokemon.abilities.map(a => {
      const name = a.ability.name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      const hiddenClass = a.is_hidden ? 'hidden-ability' : '';
      const hiddenSuffix = a.is_hidden ? ` <span style="font-size: 0.65rem; opacity: 0.85;">${hiddenText}</span>` : '';
      return `<span class="ability-pill ${hiddenClass}">${name}${hiddenSuffix}</span>`;
    }).join('');
  }

  // Rendimento
  const effortStats = currentPokemon.stats.filter(s => s.effort > 0);
  elements.evYield.innerHTML = `
    <span>${translations[currentLang].evYield}:</span>
    <div class="ev-yield-value">${effortStats.map(s => {
      const shortName = mapStatName(s.stat.name);
      const transStat = translations[currentLang][shortName] || shortName.toUpperCase();
      return `+${s.effort} ${transStat}`;
    }).join('<br>')}</div>
  `;

};

const renderStatsTable = () => {
  elements.statsBody.innerHTML = currentPokemon.stats.map(s => {
    const statName = mapStatName(s.stat.name);
    const translatedName = translations[currentLang][statName] || statName.toUpperCase();
    return `
      <tr>
        <td><strong>${translatedName}</strong></td>
        <td>${s.base_stat}</td>
        <td><input type="number" id="iv-${statName}" class="iv-input" min="0" max="31" value="0"></td>
        <td><input type="number" id="ev-${statName}" class="ev-input" min="0" max="252" value="0"></td>
        <td id="min-${statName}" class="stat-min">0</td>
        <td id="max-${statName}" class="stat-max">0</td>
        <td>
          <span id="total-${statName}" style="font-weight: 800; font-size: 1.2rem;">0</span>
          <div class="stat-bar-container">
            <div id="bar-${statName}" class="stat-bar"></div>
          </div>
        </td>
      </tr>
    `;
  }).join('');


  const bst = currentPokemon.stats.reduce((acc, s) => acc + s.base_stat, 0);
  elements.baseTotalSum.textContent = bst;

  const somaTotalTd = document.getElementById('td-somatotal')?.parentElement;
  if (somaTotalTd) {
    if (window.innerWidth <= 768) {
      somaTotalTd.setAttribute('colspan', '2');
    } else {
      somaTotalTd.setAttribute('colspan', '4');
    }
  }

  document.querySelectorAll('.iv-input, .ev-input').forEach(input => {
    input.addEventListener('input', (e) => {
      let rawVal = e.target.value;
      if (rawVal === '') {
        e.target.value = '0';
        rawVal = '0';
      }

      let val = parseInt(rawVal);
      if (isNaN(val)) val = 0;
      const isIv = e.target.classList.contains('iv-input');

      if (isIv) {
        if (val > 31) val = 31;
        if (val < 0) val = 0;
      } else {
        const statName = e.target.id.replace('ev-', '');
        let otherEvSum = 0;

        currentPokemon.stats.forEach(s => {
          const sName = mapStatName(s.stat.name);
          if (sName !== statName) {
            const el = document.getElementById(`ev-${sName}`);
            const otherVal = el ? (parseInt(el.value) || 0) : 0;
            otherEvSum += otherVal;
          }
        });

        const maxAllowed = Math.min(252, 510 - otherEvSum);
        if (val > maxAllowed) {
          val = maxAllowed;
        }
        if (val < 0) {
          val = 0;
        }
      }

      e.target.value = val.toString();
      updateStats();
    });
  });
};

const updateStats = () => {
  if (!currentPokemon) return;

  const level = parseInt(elements.levelInput.value) || 1;
  const natureName = elements.natureSelect.value;
  const nature = natures.find(n => n.name === natureName);

  const notesTextarea = document.getElementById('pokemon-notes');
  const notesValue = notesTextarea ? notesTextarea.value : '';

  const config = {
    id: currentPokemon.id,
    level,
    nature: natureName,
    ivs: {},
    evs: {},
    notes: notesValue,
    evTargets: currentEvTargets
  };

  let totalEvs = 0;
  let totalIvs = 0;

  currentPokemon.stats.forEach(s => {
    const statName = mapStatName(s.stat.name);
    const iv = parseInt(document.getElementById(`iv-${statName}`).value) || 0;
    const ev = parseInt(document.getElementById(`ev-${statName}`).value) || 0;
    totalEvs += ev;
    totalIvs += iv;

    config.ivs[statName] = iv;
    config.evs[statName] = ev;

    // Current Total
    const total = calculateStat(s.base_stat, iv, ev, level, reverseMapStatName(statName), nature);
    document.getElementById(`total-${statName}`).textContent = total;

    // Min/Max Calculation
    const minNature = { increased: null, decreased: reverseMapStatName(statName) };
    const minVal = calculateStat(s.base_stat, 0, 0, level, reverseMapStatName(statName), minNature);
    document.getElementById(`min-${statName}`).textContent = minVal;

    const maxNature = { increased: reverseMapStatName(statName), decreased: null };
    const maxVal = calculateStat(s.base_stat, 31, 252, level, reverseMapStatName(statName), maxNature);
    document.getElementById(`max-${statName}`).textContent = maxVal;

    const barMax = statName === 'hp' ? 714 : 504;
    const percentage = Math.min((total / barMax) * 100, 100);
    document.getElementById(`bar-${statName}`).style.width = `${percentage}%`;
  });

  // Calculate Total Sum
  const totalSum = Array.from(document.querySelectorAll('[id^="total-"]'))
    .reduce((sum, el) => sum + (parseInt(el.textContent) || 0), 0);
  elements.statTotalSum.textContent = totalSum;

  // Atualizar o EV Tracker
  const remainingEvs = 510 - totalEvs;
  const evUsedEl = document.getElementById('ev-used');
  const evRemainingEl = document.getElementById('ev-remaining');
  const evTrackerBar = document.getElementById('ev-tracker-bar');

  if (evUsedEl) evUsedEl.textContent = totalEvs;
  if (evRemainingEl) evRemainingEl.textContent = remainingEvs;
  if (evTrackerBar) {
    const evBarPercentage = (totalEvs / 510) * 100;
    evTrackerBar.style.width = `${evBarPercentage}%`;
  }

  // IV Quality
  const ivPercent = Math.min((totalIvs / 186) * 100, 100);
  let qualityClass = 'quality-pessimo';
  let labelKey = 'qualityPessimo';

  if (ivPercent >= 100) { qualityClass = 'quality-perfeito'; labelKey = 'qualityPerfeito'; }
  else if (ivPercent >= 80) { qualityClass = 'quality-excelente'; labelKey = 'qualityExcelente'; }
  else if (ivPercent >= 60) { qualityClass = 'quality-otimo'; labelKey = 'qualityOtimo'; }
  else if (ivPercent >= 40) { qualityClass = 'quality-bom'; labelKey = 'qualityBom'; }
  else if (ivPercent >= 20) { qualityClass = 'quality-ruim'; labelKey = 'qualityRuim'; }

  const qualityLabel = translations[currentLang][labelKey] || labelKey;

  if (elements.ivQuality) {
    elements.ivQuality.className = `quality-badge ${qualityClass}`;
    elements.ivQuality.innerHTML = `
      <span class="tooltip-container">
        <span>${translations[currentLang].ivQuality}:</span>
        <button class="help-btn" type="button" style="margin-left: 0.2rem;">?</button>
        <span class="tooltip-text">${translations[currentLang].ivQualityTooltip}</span>
      </span>
      <div class="ev-yield-value">${Math.round(ivPercent)}% (${qualityLabel})</div>
    `;
  }



  saveData('pokemon_config', config);
};

const renderEffectiveness = async () => {
  const effectiveness = await fetchTypeEffectiveness(currentPokemon.types);
  
  // Lista dos 18 tipos na ordem exata
  const orderedTypes = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'];
  
  // Filtra apenas os tipos com valor diferente de 1x (neutro)
  const advantageTypes = orderedTypes.filter(t => {
    const mult = effectiveness[t] !== undefined ? effectiveness[t] : 1;
    return mult < 1; // Resistências e Imunidades (0.5x, 0.25x, 0x)
  });

  const disadvantageTypes = orderedTypes.filter(t => {
    const mult = effectiveness[t] !== undefined ? effectiveness[t] : 1;
    return mult > 1; // Fraquezas (2x, 4x)
  });

  const advantagesEl = document.getElementById('effectiveness-advantages');
  const disadvantagesEl = document.getElementById('effectiveness-disadvantages');

  if (advantagesEl) {
    if (advantageTypes.length === 0) {
      advantagesEl.innerHTML = `<p style="color: var(--text-secondary); font-size: 0.85rem; font-style: italic; margin-top: 1rem;">${translations[currentLang].noAdvantages}</p>`;
    } else {
      advantagesEl.innerHTML = advantageTypes.map(t => {
        const mult = effectiveness[t] !== undefined ? effectiveness[t] : 1;
        return `
          <div class="type-effectiveness-row">
            <span class="type-pill" style="background-color: var(--type-${t})">${getTypeTranslated(t)}</span>
            <span class="effectiveness-value value-advantage">${mult}x</span>
          </div>
        `;
      }).join('');
    }
  }

  if (disadvantagesEl) {
    if (disadvantageTypes.length === 0) {
      disadvantagesEl.innerHTML = `<p style="color: var(--text-secondary); font-size: 0.85rem; font-style: italic; margin-top: 1rem;">${translations[currentLang].noDisadvantages}</p>`;
    } else {
      disadvantagesEl.innerHTML = disadvantageTypes.map(t => {
        const mult = effectiveness[t] !== undefined ? effectiveness[t] : 1;
        return `
          <div class="type-effectiveness-row">
            <span class="type-pill" style="background-color: var(--type-${t})">${getTypeTranslated(t)}</span>
            <span class="effectiveness-value value-disadvantage">${mult}x</span>
          </div>
        `;
      }).join('');
    }
  }

};

const getRegionalSuffix = (name) => {
  const suffixes = ['-galar', '-alola', '-paldea', '-hisui', '-gmax', '-mega', '-origin', '-therian', '-crown', '-hero'];
  for (const s of suffixes) {
    if (name.endsWith(s)) return s;
  }
  return '';
};

const getSpeciesNameFromForm = (formName) => {
  const suffix = getRegionalSuffix(formName);
  if (suffix) {
    return formName.replace(suffix, '');
  }
  return formName;
};

const resolveEvolutionNodeNameBeforeCache = (speciesName, parentName = '') => {
  if (!currentPokemon) return speciesName;
  if (speciesName === currentPokemon.species.name) {
    return currentPokemon.name;
  }
  const suffix = getRegionalSuffix(parentName || currentPokemon.name);
  if (suffix) {
    return `${speciesName}${suffix}`;
  }
  return speciesName;
};

const isEvolutionBranchValid = (child, parentName) => {
  if (!child.evolution_details || child.evolution_details.length === 0) {
    return true;
  }
  const parentSuffix = getRegionalSuffix(parentName);
  return child.evolution_details.some(d => {
    if (d.base_form) {
      return d.base_form.name === parentName;
    }
    return !parentSuffix;
  });
};

const getStartingFormsForChain = (chainData) => {
  const rootSpeciesName = chainData.chain.species.name;
  const formsSet = new Set([rootSpeciesName]);

  const collectBaseForms = (node) => {
    if (node.evolves_to) {
      node.evolves_to.forEach(child => {
        if (child.evolution_details) {
          child.evolution_details.forEach(d => {
            if (d.base_form) {
              formsSet.add(d.base_form.name);
            }
          });
        }
        collectBaseForms(child);
      });
    }
  };
  collectBaseForms(chainData.chain);

  return Array.from(formsSet);
};

const getPathsFromForm = (speciesNode, currentFormName) => {
  const suffix = getRegionalSuffix(currentFormName);
  const paths = [];

  const validChildren = (speciesNode.evolves_to || []).filter(child => {
    return isEvolutionBranchValid(child, currentFormName);
  });

  if (validChildren.length === 0) {
    return [[currentFormName]];
  }

  validChildren.forEach(child => {
    let childFormName = child.species.name;
    if (suffix) {
      childFormName = `${child.species.name}${suffix}`;
    }

    const childPaths = getPathsFromForm(child, childFormName);
    childPaths.forEach(path => {
      paths.push([currentFormName, ...path]);
    });
  });

  return paths;
};

const getEvolutionPaths = (chainData) => {
  const startingForms = getStartingFormsForChain(chainData);
  let allPaths = [];
  
  startingForms.forEach(form => {
    const paths = getPathsFromForm(chainData.chain, form);
    allPaths.push(...paths);
  });

  const regionalVariantsMap = {
    'raichu': ['raichu-alola'],
    'exeggutor': ['exeggutor-alola'],
    'marowak': ['marowak-alola'],
    'weezing': ['weezing-galar'],
    'slowbro': ['slowbro-galar'],
    'slowking': ['slowking-galar'],
    'decidueye': ['decidueye-hisui'],
    'typhlosion': ['typhlosion-hisui'],
    'samurott': ['samurott-hisui'],
    'lilligant': ['lilligant-hisui'],
    'sliggoo': ['sliggoo-hisui'],
    'goodra': ['goodra-hisui'],
    'avalugg': ['avalugg-hisui'],
    'braviary': ['braviary-hisui'],
    'zoroark': ['zoroark-hisui']
  };

  let expandedPaths = [];
  allPaths.forEach(path => {
    expandedPaths.push(path);
    
    path.forEach((formName, idx) => {
      const baseSpecies = getSpeciesNameFromForm(formName);
      const variants = regionalVariantsMap[baseSpecies];
      if (variants) {
        variants.forEach(variantName => {
          const newPath = [...path];
          newPath[idx] = variantName;
          
          const variantSuffix = getRegionalSuffix(variantName);
          for (let j = idx + 1; j < newPath.length; j++) {
            newPath[j] = `${getSpeciesNameFromForm(newPath[j])}${variantSuffix}`;
          }
          expandedPaths.push(newPath);
        });
      }
    });
  });

  const seen = new Set();
  const finalPaths = [];
  expandedPaths.forEach(p => {
    const key = p.join(',');
    if (!seen.has(key)) {
      seen.add(key);
      finalPaths.push(p);
    }
  });

  return finalPaths;
};

const getSingleEvolutionMethodHtml = (details) => {
  if (!details) return '<span class="method-text">Lvl ?</span>';
  const lang = currentLang;
  const t = translations[lang];

  let text = '';
  let hasItem = false;
  let itemImgUrl = '';
  let itemNameTranslated = '';

  // 1. Item-based
  if (details.item) {
    const itemName = details.item.name;
    itemNameTranslated = itemName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    itemImgUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${itemName}.png`;
    text = itemNameTranslated;
    hasItem = true;
    if (details.time_of_day) {
      const todText = details.time_of_day === 'day' ? (lang === 'pt' ? 'Dia' : lang === 'es' ? 'Día' : 'Day') : (lang === 'pt' ? 'Noite' : lang === 'es' ? 'Noche' : 'Night');
      text += ` (${todText})`;
    }
  }
  // 2. Trade with held item
  else if (details.held_item) {
    const itemName = details.held_item.name;
    itemNameTranslated = itemName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    itemImgUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${itemName}.png`;
    text = `${t.tradeWith} ${itemNameTranslated}`;
    hasItem = true;
    if (details.time_of_day) {
      const todText = details.time_of_day === 'day' ? (lang === 'pt' ? 'Dia' : lang === 'es' ? 'Día' : 'Day') : (lang === 'pt' ? 'Noite' : lang === 'es' ? 'Noche' : 'Night');
      text += ` (${todText})`;
    }
  }
  // 3. Trade
  else if (details.trigger && details.trigger.name === 'trade') {
    text = t.trade;
  }
  // 4. Inkay console rotation
  else if (details.turn_upside_down) {
    text = lang === 'pt' ? 'Girar Console' : lang === 'es' ? 'Girar Consola' : 'Upside Down';
  }
  // 5. Overworld rain
  else if (details.needs_overworld_rain) {
    const rainText = lang === 'pt' ? 'Chuva' : lang === 'es' ? 'Lluvia' : 'Rain';
    text = details.min_level ? `Lvl ${details.min_level} (${rainText})` : rainText;
  }
  // 6. Friendship
  else if (details.min_happiness) {
    if (details.known_move_type) {
      text = t.fairyFriendship;
    } else if (details.time_of_day) {
      text = details.time_of_day === 'day' ? t.dayFriendship : t.nightFriendship;
    } else {
      text = t.friendship;
    }
  }
  // 7. Move type
  else if (details.known_move_type) {
    text = `Move Type: ${details.known_move_type.name.charAt(0).toUpperCase() + details.known_move_type.name.slice(1)}`;
  }
  // 8. Known move
  else if (details.known_move) {
    const moveName = details.known_move.name.replace('-', ' ');
    text = `Move: ${moveName.charAt(0).toUpperCase() + moveName.slice(1)}`;
  }
  // 9. Location
  else if (details.location) {
    text = details.location.name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  // 10. Level-up
  else if (details.min_level) {
    if (details.time_of_day) {
      const todText = details.time_of_day === 'day' ? (lang === 'pt' ? 'Dia' : lang === 'es' ? 'Día' : 'Day') : (lang === 'pt' ? 'Noite' : lang === 'es' ? 'Noche' : 'Night');
      text = `Lvl ${details.min_level} (${todText})`;
    } else {
      text = `Lvl ${details.min_level}`;
    }
  }
  // Fallback trigger
  else if (details.trigger) {
    text = details.trigger.name.replace('-', ' ');
  } else {
    text = 'Lvl ?';
  }

  // Append gender symbol
  if (details.gender === 1) {
    text += ' ♀';
  } else if (details.gender === 2) {
    text += ' ♂';
  }

  if (hasItem) {
    return `
      <img src="${itemImgUrl}" class="evolution-item-img" title="${itemNameTranslated}">
      <span class="method-text">${text}</span>
    `;
  }
  return `<span class="method-text">${text}</span>`;
};

const getEvolutionMethodsCombinedHtml = (detailsArray) => {
  if (!detailsArray || detailsArray.length === 0) return '<span class="method-text">Lvl ?</span>';
  
  const htmls = detailsArray.map(d => getSingleEvolutionMethodHtml(d));
  const orText = { pt: 'ou', es: 'o', en: 'or' }[currentLang] || 'or';
  const separator = ` <span class="method-or" style="font-weight: normal; opacity: 0.6; font-size: 0.65rem;">${orText}</span> `;
  
  return htmls.join(separator);
};

const getEvolutionDetailsForStep = (chainNode, parentFormName, childFormName) => {
  const childSpeciesName = getSpeciesNameFromForm(childFormName);
  
  let foundNode = null;
  const findNode = (current) => {
    if (current.species.name === childSpeciesName) {
      foundNode = current;
      return;
    }
    if (current.evolves_to) {
      current.evolves_to.forEach(child => findNode(child));
    }
  };
  findNode(chainNode);

  if (!foundNode) return [];

  const parentSuffix = getRegionalSuffix(parentFormName);
  
  let matches = foundNode.evolution_details.filter(d => {
    if (d.base_form) {
      return d.base_form.name === parentFormName;
    }
    return !parentSuffix;
  });

  if (matches.length === 0) {
    matches = foundNode.evolution_details;
  }
  
  return matches;
};

const renderPathRow = (path, chainData) => {
  let html = '<div class="evolution-path-row">';
  
  for (let i = 0; i < path.length; i++) {
    const formName = path[i];
    const cache = evolutionDetailsCache[formName] || evolutionDetailsCache[getSpeciesNameFromForm(formName)];
    const spriteUrl = cache ? cache.sprite : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${getSpeciesNameFromForm(formName)}.png`;
    const typesHtml = cache ? cache.types.map(t => `<span class="type-pill" style="background-color: var(--type-${t})">${getTypeTranslated(t)}</span>`).join('') : '';
    const idHtml = cache ? `<span class="evolution-id">#${cache.id.toString().padStart(3, '0')}</span>` : '';
    const displayName = cache ? cache.name : formName;
    const capitalizedName = displayName.replace('-', ' ').toUpperCase();

    html += `
      <div class="evolution-step" data-name="${displayName}">
        <img src="${spriteUrl}" alt="${displayName}">
        <div class="evolution-name-container">
          ${idHtml}
          <strong>${capitalizedName}</strong>
        </div>
        <div class="evolution-step-types">
          ${typesHtml}
        </div>
      </div>
    `;

    if (i < path.length - 1) {
      const nextFormName = path[i + 1];
      const detailsArray = getEvolutionDetailsForStep(chainData.chain, formName, nextFormName);
      const methodHtml = getEvolutionMethodsCombinedHtml(detailsArray);

      html += `
        <div class="evolution-arrow-container">
          <div class="evolution-arrow">➜</div>
          <div class="evolution-method">${methodHtml}</div>
        </div>
      `;
    }
  }

  html += '</div>';
  return html;
};

const collectSpecies = (node, arr = []) => {
  if (node) {
    arr.push(node.species.name);
    if (node.evolves_to) {
      node.evolves_to.forEach(child => collectSpecies(child, arr));
    }
  }
  return arr;
};

const renderEvolutionChain = async () => {
  try {
    const chainData = await fetchEvolutionChain(currentPokemon.id);
    elements.evolutionChain.innerHTML = '';

    let allFormNames = [];
    let paths = [];

    if (chainData.chain.species.name === 'eevee') {
      allFormNames = collectSpecies(chainData.chain);
    } else {
      paths = getEvolutionPaths(chainData);
      allFormNames = Array.from(new Set(paths.flat()));
    }
    
    const pokemonDetailsList = await Promise.all(
      allFormNames.map(async (name) => {
        try {
          const details = await fetchPokemonDetails(name);
          return { name, details };
        } catch (e) {
          try {
            const baseName = getSpeciesNameFromForm(name);
            const details = await fetchPokemonDetails(baseName);
            return { name, details };
          } catch (err) {
            return { name, details: null };
          }
        }
      })
    );

    evolutionDetailsCache = {};
    pokemonDetailsList.forEach(item => {
      if (item.details) {
        evolutionDetailsCache[item.name] = {
          id: item.details.id,
          name: item.details.name,
          types: item.details.types.map(t => t.type.name),
          sprite: item.details.sprites.other['official-artwork'].front_default || item.details.sprites.front_default
        };
      }
    });

    if (chainData.chain.species.name === 'eevee') {
      const rootName = 'eevee';
      const rootCache = evolutionDetailsCache[rootName];
      const rootSprite = rootCache ? rootCache.sprite : '';
      const rootIdHtml = rootCache ? `<span class="evolution-id">#${rootCache.id.toString().padStart(3, '0')}</span>` : '';

      const rootHtml = `
        <div class="evolution-circle-center" data-name="${rootName}">
          <img src="${rootSprite}" alt="Eevee">
          <div class="evolution-name-container">
            ${rootIdHtml}
            <strong>EEVEE</strong>
          </div>
        </div>
      `;

      const children = chainData.chain.evolves_to;
      const childrenHtml = children.map((child, index) => {
        const name = child.species.name;
        const cache = evolutionDetailsCache[name];
        const sprite = cache ? cache.sprite : '';
        const types = cache ? cache.types.map(t => `<span class="type-pill" style="background-color: var(--type-${t})">${getTypeTranslated(t)}</span>`).join('') : '';
        const childIdHtml = cache ? `<span class="evolution-id">#${cache.id.toString().padStart(3, '0')}</span>` : '';

        let detailsArray = child.evolution_details;
        let methodHtml = '';
        if (detailsArray && detailsArray.length > 0) {
          methodHtml = `
            <div class="evolution-method-badge text-only">
              ${getEvolutionMethodsCombinedHtml(detailsArray)}
            </div>
          `;
        }

        const angle = index * (360 / children.length);
        const style = `--angle: ${angle}deg;`;

        return `
          <div class="evolution-circle-node" style="${style}" data-name="${name}">
            <img src="${sprite}" alt="${name}">
            <div class="evolution-name-container">
              ${childIdHtml}
              <strong>${name.toUpperCase()}</strong>
            </div>
            ${methodHtml}
            <div class="evolution-circle-node-types">${types}</div>
          </div>
        `;
      }).join('');

      elements.evolutionChain.innerHTML = `
        <div class="evolution-circle-container">
          ${rootHtml}
          ${childrenHtml}
        </div>
      `;

    } else {
      elements.evolutionChain.innerHTML = `
        <div class="evolution-paths-container">
          ${paths.map(path => renderPathRow(path, chainData)).join('')}
        </div>
      `;
    }
    
    elements.evolutionSection.style.display = 'block';
    setupEvolutionClickListeners();
  } catch (e) {
    elements.evolutionSection.style.display = 'none';
  }
};

const captureLoadedConfig = (timestamp = null) => {
  if (!currentPokemon) {
    loadedConfig = null;
    return;
  }
  const level = parseInt(elements.levelInput.value) || 1;
  const natureName = elements.natureSelect.value;
  const ivs = {};
  const evs = {};
  currentPokemon.stats.forEach(s => {
    const statName = mapStatName(s.stat.name);
    const ivEl = document.getElementById(`iv-${statName}`);
    const evEl = document.getElementById(`ev-${statName}`);
    ivs[statName] = ivEl ? (parseInt(ivEl.value) || 0) : 0;
    evs[statName] = evEl ? (parseInt(evEl.value) || 0) : 0;
  });
  const notesTextarea = document.getElementById('pokemon-notes');
  const notesValue = notesTextarea ? notesTextarea.value : '';

  loadedConfig = {
    timestamp: timestamp,
    id: currentPokemon.id,
    level: level,
    nature: natureName,
    ivs: ivs,
    evs: evs,
    notes: notesValue,
    evTargets: JSON.parse(JSON.stringify(currentEvTargets))
  };
};

const hasUnsavedChanges = () => {
  if (!currentPokemon || !loadedConfig) return false;

  const currentLevel = parseInt(elements.levelInput.value) || 1;
  const currentNature = getEnglishNature(elements.natureSelect.value);
  const notesTextarea = document.getElementById('pokemon-notes');
  const currentNotes = notesTextarea ? notesTextarea.value : '';

  if (currentLevel !== loadedConfig.level) return true;
  if (currentNature !== getEnglishNature(loadedConfig.nature)) return true;
  if (currentNotes !== loadedConfig.notes) return true;

  let ivsChanged = false;
  let evsChanged = false;
  currentPokemon.stats.forEach(s => {
    const statName = mapStatName(s.stat.name);
    const ivEl = document.getElementById(`iv-${statName}`);
    const evEl = document.getElementById(`ev-${statName}`);
    const iv = ivEl ? (parseInt(ivEl.value) || 0) : 0;
    const ev = evEl ? (parseInt(evEl.value) || 0) : 0;
    if (iv !== (loadedConfig.ivs[statName] || 0)) ivsChanged = true;
    if (ev !== (loadedConfig.evs[statName] || 0)) evsChanged = true;
  });

  if (ivsChanged || evsChanged) return true;

  if (currentEvTargets.length !== loadedConfig.evTargets.length) return true;
  for (let i = 0; i < currentEvTargets.length; i++) {
    const tCurrent = currentEvTargets[i];
    const tLoaded = loadedConfig.evTargets[i];
    if (tCurrent.id !== tLoaded.id || tCurrent.defeated !== tLoaded.defeated) return true;
  }

  return false;
};

const hasModifications = () => {
  return hasUnsavedChanges();
};

const confirmNavigation = (onConfirm) => {
  if (hasUnsavedChanges()) {
    const evoModal = document.getElementById('evo-confirm-modal');
    const yesBtn = document.getElementById('btn-evo-confirm-yes');
    const noBtn = document.getElementById('btn-evo-confirm-no');
    const cancelBtn = document.getElementById('btn-evo-confirm-cancel');

    const newYesBtn = yesBtn.cloneNode(true);
    const newNoBtn = noBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);

    yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
    noBtn.parentNode.replaceChild(newNoBtn, noBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    newYesBtn.addEventListener('click', () => {
      savePokemonToHistory();
      evoModal.style.display = 'none';
      clearData('pokemon_config');
      onConfirm();
    });

    newNoBtn.addEventListener('click', () => {
      evoModal.style.display = 'none';
      clearData('pokemon_config');
      onConfirm();
    });

    newCancelBtn.addEventListener('click', () => {
      evoModal.style.display = 'none';
    });

    const t = translations[currentLang];
    document.querySelector('#evo-confirm-modal h2').textContent = t.confirmTitle;
    document.querySelector('#evo-confirm-modal p').textContent = t.confirmPrompt;
    newYesBtn.textContent = t.confirmYes;
    newNoBtn.textContent = t.confirmNo;
    newCancelBtn.textContent = t.cancel;

    evoModal.style.display = 'flex';
  } else {
    clearData('pokemon_config');
    onConfirm();
  }
};

const setupEvolutionClickListeners = () => {
  const nodes = document.querySelectorAll('.evolution-step, .evolution-circle-node, .evolution-circle-center');
  nodes.forEach(node => {
    node.addEventListener('click', () => {
      const targetName = node.getAttribute('data-name');
      if (!targetName) return;
      if (currentPokemon && currentPokemon.name === targetName) return;

      confirmNavigation(() => {
        handlePokemonSelect(targetName);
      });
    });
  });
};


const populateNatureMatrix = () => {
  const statOrder = ['attack', 'defense', 'special-attack', 'special-defense', 'speed'];
  const labels = ['ATK', 'DEF', 'SPA', 'SPD', 'SPE'];

  elements.matrixHead.innerHTML = `
    <tr>
      <th></th>
      ${labels.map(l => `<th class="matrix-header-down"><span class="stat-down-arrow">▼</span> ${l}</th>`).join('')}
    </tr>
  `;

  elements.matrixBody.innerHTML = statOrder.map((plusStat, rIdx) => {
    return `
      <tr>
        <td class="matrix-header-up"><span class="stat-up-arrow">▲</span> ${labels[rIdx]}</td>
        ${statOrder.map(minusStat => {
          const nature = natures.find(n => n.increased === plusStat && n.decreased === minusStat);
          if (nature) {
            const isNeutral = nature.increased === nature.decreased;
            const style = isNeutral ? 'opacity: 0.5; font-style: italic;' : 'font-weight: 700;';
            return `<td class="clickable-nature" data-nature="${nature.name}" style="${style}">${nature.name.charAt(0).toUpperCase() + nature.name.slice(1)}</td>`;
          }
          return `<td>---</td>`;
        }).join('')}
      </tr>
    `;
  }).join('');

  setupNatureClickListeners();
};

function renderModalTypeFilters() {
  const container = document.getElementById('ev-modal-types-group');
  if (!container) return;

  const activeTypes = Array.from(container.querySelectorAll('.filter-type-pill.active')).map(el => el.getAttribute('data-type'));

  const orderedTypes = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'];
  
  container.innerHTML = orderedTypes.map(t => {
    const translatedName = t.charAt(0).toUpperCase() + t.slice(1);
    const activeClass = activeTypes.includes(t) ? 'active' : '';
    return `
      <div class="filter-type-pill ${activeClass}" data-type="${t}" style="background-color: var(--type-${t});">
        ${translatedName}
      </div>
    `;
  }).join('');

  container.querySelectorAll('.filter-type-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      pill.classList.toggle('active');
      filterEvModalResults();
    });
  });
}

function filterEvModalResults() {
  const searchInput = document.getElementById('ev-modal-search-input');
  if (!searchInput) return;
  const query = searchInput.value.toLowerCase().trim();
  
  const checkedStats = Array.from(document.querySelectorAll('#ev-modal-stats-group input:checked')).map(el => el.value);
  const checkedYields = Array.from(document.querySelectorAll('#ev-modal-yields-group input:checked')).map(el => parseInt(el.value));
  
  const activeTypes = Array.from(document.querySelectorAll('.filter-type-pill.active')).map(el => el.getAttribute('data-type'));

  const filtered = pokemonEvData.filter(p => {
    if (query) {
      const matchName = p.name.includes(query);
      const matchId = p.id.toString() === query;
      if (!matchName && !matchId) return false;
    }

    if (checkedStats.length > 0) {
      const matchStat = checkedStats.some(s => p.yields[s] && p.yields[s] > 0);
      if (!matchStat) return false;
    }

    if (checkedYields.length > 0) {
      const matchYield = checkedYields.some(y => Object.values(p.yields).includes(y));
      if (!matchYield) return false;
    }

    if (activeTypes.length > 0) {
      const matchType = activeTypes.some(t => p.types.includes(t));
      if (!matchType) return false;
    }

    return true;
  });

  const listEl = document.getElementById('ev-modal-results-list');
  if (!listEl) return;

  if (filtered.length === 0) {
    const emptyMsg = translations[currentLang].noPokemonMatching || "Nenhum Pokémon correspondente aos filtros";
    listEl.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 1.5rem; font-size: 0.85rem; font-style: italic; grid-column: 1 / -1;">${emptyMsg}</div>`;
    return;
  }

  const displayList = filtered.slice(0, 50);

  listEl.innerHTML = displayList.map(p => {
    const capitalized = p.name.charAt(0).toUpperCase() + p.name.slice(1);
    const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`;
    
    const typesHtml = p.types.map(t => `<span class="type-pill" style="background-color: var(--type-${t})">${getTypeTranslated(t)}</span>`).join('');
    
    const yieldsText = Object.keys(p.yields).map(stat => {
      const statUpper = translations[currentLang][stat] || stat.toUpperCase();
      return `+${p.yields[stat]} ${statUpper}`;
    }).join(', ');

    return `
      <div class="ev-modal-results-item" data-name="${p.name}">
        <div class="ev-modal-results-name">
          <img src="${spriteUrl}" alt="${capitalized}" onerror="this.style.display='none'">
          <span>${capitalized}</span>
        </div>
        <div class="ev-modal-results-dex">#${p.id.toString().padStart(3, '0')}</div>
        <div class="ev-modal-results-types">${typesHtml}</div>
        <div class="ev-modal-results-yield">${yieldsText}</div>
      </div>
    `;
  }).join('');

  listEl.querySelectorAll('.ev-modal-results-item').forEach(item => {
    item.addEventListener('click', async () => {
      const name = item.getAttribute('data-name');
      if (name) {
        await addEvTarget(name);
        document.getElementById('ev-helper-modal').style.display = 'none';
      }
    });
  });
}

async function initEvHelper() {
  const searchInput = document.getElementById('ev-helper-search');
  const modal = document.getElementById('ev-helper-modal');
  const closeModal = document.getElementById('close-ev-modal');
  
  if (searchInput && modal) {
    searchInput.addEventListener('click', () => {
      modal.style.display = 'flex';
      document.getElementById('ev-modal-search-input').value = '';
      document.querySelectorAll('#ev-modal-stats-group input').forEach(el => el.checked = false);
      document.querySelectorAll('#ev-modal-yields-group input').forEach(el => el.checked = false);
      document.querySelectorAll('.filter-type-pill').forEach(el => el.classList.remove('active'));
      filterEvModalResults();
    });
  }

  if (closeModal && modal) {
    closeModal.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  const modalSearchInput = document.getElementById('ev-modal-search-input');
  if (modalSearchInput) {
    modalSearchInput.addEventListener('input', () => {
      filterEvModalResults();
    });
  }

  document.querySelectorAll('#ev-modal-stats-group input, #ev-modal-yields-group input').forEach(el => {
    el.addEventListener('change', () => {
      filterEvModalResults();
    });
  });

  renderModalTypeFilters();
  renderEvTrainingList();
}

async function addEvTarget(nameOrId) {
  try {
    const details = await fetchPokemonDetails(nameOrId);
    if (!details) return;

    if (currentEvTargets.some(t => t.id === details.id)) {
      return;
    }

    const effortStats = details.stats.filter(s => s.effort > 0).map(s => {
      return {
        stat: mapStatName(s.stat.name),
        effort: s.effort
      };
    });

    const target = {
      id: details.id,
      name: details.name,
      sprite: details.sprites.front_default || '',
      types: details.types.map(t => t.type.name),
      yields: effortStats,
      defeated: 0
    };

    currentEvTargets.push(target);
    renderEvTrainingList();
    updateStats();
  } catch (e) {
    console.error("Erro ao adicionar alvo de treino:", e);
  }
}

function renderEvTrainingList() {
  const listEl = document.getElementById('ev-training-targets-list');
  if (!listEl) return;

  if (currentEvTargets.length === 0) {
    listEl.innerHTML = `<p style="grid-column: 1 / -1; width: 100%; text-align: center; color: var(--text-secondary); font-size: 0.8rem; font-style: italic; margin-top: 1rem;">${translations[currentLang].noActiveTargets}</p>`;
    return;
  }

  listEl.innerHTML = currentEvTargets.map((target, index) => {
    const yieldsText = target.yields.map(y => {
      const statUpper = translations[currentLang][y.stat] || y.stat.toUpperCase();
      return `+${y.effort} ${statUpper}`;
    }).join(', ');

    const targetTypes = target.types || [];
    const typesHtml = targetTypes.map(t => `<span class="type-pill" style="background-color: var(--type-${t})">${getTypeTranslated(t)}</span>`).join('');

    return `
      <div class="target-item-row">
        <!-- Coluna 1: Ícone maior, nome -->
        <div class="target-col-info">
          <img src="${target.sprite}" alt="${target.name}" class="target-sprite" onerror="this.style.display='none'">
          <div class="target-item-name">${target.name.toUpperCase()}</div>
        </div>
        <!-- Coluna 2: Tipos do Pokémon -->
        <div class="target-col-types">
          ${typesHtml}
        </div>
        <!-- Coluna 3: Rendimento de EVs -->
        <div class="target-col-yield">
          <span class="target-item-yield">${yieldsText}</span>
        </div>
        <!-- Coluna 4: Ações de contador (+/-) e botão Remover -->
        <div class="target-col-actions">
          <div class="target-counter-group">
            <button class="target-btn-counter minus" data-index="${index}">-</button>
            <span class="target-counter-value">${target.defeated}</span>
            <button class="target-btn-counter plus" data-index="${index}">+</button>
          </div>
          <button class="target-btn-remove" data-index="${index}">Remover</button>
        </div>
      </div>
    `;
  }).join('');

  listEl.querySelectorAll('.target-btn-counter.plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.getAttribute('data-index'));
      adjustDefeated(index, 1);
    });
  });

  listEl.querySelectorAll('.target-btn-counter.minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.getAttribute('data-index'));
      adjustDefeated(index, -1);
    });
  });

  listEl.querySelectorAll('.target-btn-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.getAttribute('data-index'));
      removeEvTarget(index);
    });
  });
}

function adjustDefeated(index, amount) {
  const target = currentEvTargets[index];
  if (!target) return;

  if (amount === -1 && target.defeated <= 0) return;

  if (amount === 1) {
    let currentTotalEvs = 0;
    const currentEvs = {};

    currentPokemon.stats.forEach(s => {
      const statName = mapStatName(s.stat.name);
      const el = document.getElementById(`ev-${statName}`);
      currentEvs[statName] = el ? (parseInt(el.value) || 0) : 0;
      currentTotalEvs += currentEvs[statName];
    });

    if (currentTotalEvs >= 510) return;

    let evsAdded = false;
    target.yields.forEach(y => {
      const el = document.getElementById(`ev-${y.stat}`);
      if (!el) return;

      const currentVal = currentEvs[y.stat];
      const otherEvSum = currentTotalEvs - currentVal;

      const maxAllowed = Math.min(252, 510 - otherEvSum);
      const newVal = Math.min(maxAllowed, currentVal + y.effort);

      if (newVal > currentVal) {
        el.value = newVal;
        currentTotalEvs += (newVal - currentVal);
        currentEvs[y.stat] = newVal;
        evsAdded = true;
      }
    });

    if (evsAdded) {
      target.defeated += 1;
    }
  } else if (amount === -1) {
    let evsSubtracted = false;
    target.yields.forEach(y => {
      const el = document.getElementById(`ev-${y.stat}`);
      if (!el) return;

      const currentVal = el.value ? (parseInt(el.value) || 0) : 0;
      const newVal = Math.max(0, currentVal - y.effort);
      if (newVal < currentVal) {
        el.value = newVal;
        evsSubtracted = true;
      }
    });

    if (evsSubtracted) {
      target.defeated -= 1;
    }
  }

  renderEvTrainingList();
  updateStats();
}

function removeEvTarget(index) {
  currentEvTargets.splice(index, 1);
  renderEvTrainingList();
  updateStats();
}

init();
