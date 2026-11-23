let input_compare = document.getElementById('compare');
let list_compare = document.querySelector('.list-compare');
let form_compare = document.getElementById('compare-form');
const dl = document.getElementById('dl-link');
const checkboxes = document.querySelectorAll('input.compare');

const indicateurs = {
    'sl1' : ['sl1a', 'sl1b', 'sl1c'],
    'sl34' : ['sl3', 'sl4'],
    'slmen': ['sl_menpauv', 'sl_menseul'],
    'aec' : ['aec1', 'aec2', 'aec3'],
    'sdi' : ['sdi1', 'sdi2', 'sdi3'],
    'sda1' : ['sda1'],
    'sda2': ['sda2'],
    'es1' : ['es1'],
    'es2' : ['es2'],
    'ti13' : ['ti1', 'ti3'],
    'ti4': ['ti4'],
};

const types_profil_age = {
    1: 'Centres-villes très faiblement peuplés, très fortes proportions de personnes âgées',
    2: 'Centres-villes faiblement peuplés, fortes proportions de personnes âgées',
    3: "Centres-villes faiblement peuplés, fortes proportions de 40-54 ans et proportions assez fortes d'enfants et d'adolescents",
    4: "Centres-villes assez peuplés, fortes proportions de jeunes adultes et de trentenaires",
    5: "Centres-villes fortement peuplés, fortes proportions d'enfants et d'adolescents, fortes proportions de 25-39 ans"
};
window.types_profil_age = types_profil_age;

const type_graph = {
    'sl1': 'radar',
    'sl34': 'bar',
    'slmen': 'bar',
    'aec': 'radar',
    'sdi': 'radar',
    'sda1': 'bar',
    'sda2': 'bar',
    'es1': 'bar',
    'es2': 'bar',
    'ti13': 'bar',
    'ti4': 'bar'
};

const options_graph = {
    'sl1':{
        r: {
            min: 0,
        }
    },

    'aec':{
        r: {
            min: 0,
        }
    },
    'sdi': {
        r: {
            min: 0,
        }
    }
}

const nom_indicateurs = {
    'sl1a' : ['Part des petits', 'logements (T1-T2) (%)'],
    'sl1b' : ['Part des propriétaires', 'occupants (%)'],
    'sl1c' : ['Part des logements', 'locatifs sociaux (%)'],
    'sl3' : ['Part des logements construits', 'entre 2010 et 2020 (%)'],
    'sl4' : ['Part des logements vacants', 'depuis plus de 2 ans (%)'],
    'sl_menpauv': 'Part des ménages à bas revenus (%)',
    'sl_menseul': "Part des ménages d'une personne (%)",
    'aec1' : 'Indice de concentration commerciale',
    'aec2' : 'Indice de spécialisation commerciale',
    'aec3' : 'Indice de spéficité commerciale',
    'sdi1' : "Indicateur d'offre culturelle",
    'sdi2' : "Indicateur d'offre de convivialité",
    'sdi3' : "Indicateur d'offre de loisirs",
    'sda1' : 'Accessibilité piétone (%)',
    'sda2' : 'Part des voies cyclables (%)',
    'es1' : 'Nombre de médecins généralistes pour 10 000 habitants',
    'es2' : 'Part des espaces verts publics dans un rayon de 500m (%)',
    'ti1' : 'Mixité fonctionnelle du foncier',
    'ti3' : 'Part des immeubles raccordés à la fibre (%)',
    'ti4' : 'Nombre de tiers-lieux'
};

dl.addEventListener('click', (e) =>{
    e.preventDefault();
    window.location.href='/dl-data';
})

input_compare.addEventListener('input', () => window.renderCitySuggestions(input_compare, list_compare, 'list-item-compare'));
input_compare.addEventListener('focus', () => window.renderCitySuggestions(input_compare, list_compare, 'list-item-compare'));
list_compare.addEventListener('mousedown', event => event.preventDefault());
input_compare.addEventListener('blur', () => {
    window.setTimeout(() => {
        list_compare.hidden = true;
        input_compare.setAttribute('aria-expanded', 'false');
    }, 120);
});

function create_graph(json, search, chart_id, thematique){
    const canvas = document.getElementById(chart_id);
    const feature = json.find(obj => obj.codgeo == search);
    if (!canvas || !feature) return null;

    const existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();

    const data = indicateurs[thematique].map(indicateur => feature[indicateur]);
    const labels = indicateurs[thematique].map(indicateur => nom_indicateurs[indicateur]);
    const type = type_graph[thematique];
    const borderColor = '#FF7F00';
    const backgroundColor = type === 'radar'
        ? `rgba(${hexToRgb(borderColor)}, 0.15)`
        : `rgba(${hexToRgb(borderColor)}, 0.8)`;

    return new Chart(canvas, {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                label: feature.nom_com,
                data: data,
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                borderWidth: 3,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: options_graph[thematique],
            indexAxis: thematique === 'slmen' ? 'y' : 'x',
        }
    });
}

function calculateMedian(jsonData, attribute) {
    // Sort a copy so calculations never mutate the shared dataset.
    let sortedData = [...jsonData].sort((a, b) => a[attribute] - b[attribute]);
    let count = sortedData.length;
    let middleIndex = Math.floor(count / 2);
    let median;
    if (count % 2 === 0) {
        // Nombre d'éléments pair
        let value1 = sortedData[middleIndex - 1][attribute];
        let value2 = sortedData[middleIndex][attribute];
        median = (value1 + value2) / 2;
    } 
    else {
        // Nombre d'éléments impair
        median = sortedData[middleIndex][attribute]
    }
    return median;
}

function getPluralSeparated(typecv){
    let result = typecv.split(' ').map(word => {
        // Vérifie si le mot se termine par "s"
        if (word.charAt(word.length - 1) === 's') {
            return word.toLowerCase(); // Retourne le mot tel quel
        } 
        else {
            return word.toLowerCase() + 's'; // Ajoute un "s" à la fin du mot
        }
    });
    return result.join(' ');
    }

//Fonction convertissant un hexcode en rgb
function hexToRgb(hex) {
    // Supprime les éventuels caractères de formatage (#)
    hex = hex.replace(/^#/, '');

    // Convertit les valeurs R, G et B à partir du code hexadécimal
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Renvoie la valeur RGB au format "rgb(r, g, b)"
    return (`${r}, ${g}, ${b}`);
}

//Fonction retournant les propriété de style pour chart.js
function getLabelAndData(name, json, feature) {
    let data;
    let label;
    let bg_col;
    // classtype permettra ensuite de réaliser des opérations selon la propriété "class" des datasets
    // ici : 'multiple' sera pour les datasets issus de plusieurs communes et 'single' pour une seule.
    let classtype = 'multiple';
    if (!feature.length) return [[], '', '#18F0C8', classtype];

    if (name == 'france'){
        data = json;
        label = 'Médiane nationale';
        bg_col = '#0050A4';
    }
    else if (name == 'region'){
        data = json.filter(obj => obj.region == feature[0].region);
        label = 'Médiane régionale';
        bg_col = '#8A0D1E';
    }
    else if (name == 'departement'){
        data = json.filter(obj => obj.codgeo.substring(0,2) == feature[0].codgeo.substring(0,2));
        label = 'Médiane départementale';
        bg_col = "#F5DF4D";
    }
    else if (name == 'type'){
        data = json.filter(obj => obj.categ_cent == feature[0].categ_cent);
        label = `Médiane des ${getPluralSeparated(window.type_cv[feature[0].categ_cent])}`;
        bg_col = window.geom_style[feature[0].categ_cent].fillColor;
    }
    //Tous les autres cas, c-a-d lorsqu'on compare avec un autre centre-ville
    else {
        const codgeo = name.substring(name.length -6, name.length-1);
        data = json.filter(obj => obj.codgeo == codgeo);
        label = name.substring(0, name.length - 8);
        bg_col = '#18F0C8';
        classtype = 'single';
    }
    return [data, label, bg_col, classtype]
}

//Fonction permettant d'ajouter le dataset au chart 
function pushDataSet(data_label, chart, thematique, update = true){
    const data = data_label[0];
    const label = data_label[1];
    let borderColor = data_label[2];
    let backgroundColor;
    const classtype = data_label[3];
    if (!chart || !data.length) return;

    const variables = indicateurs[thematique].map(indicateur => calculateMedian(data, indicateur));
    if (type_graph[thematique] === 'radar'){
        backgroundColor = `rgba(${hexToRgb(borderColor)}, 0.2)`;
    }
    else {
        backgroundColor = `rgba(${hexToRgb(borderColor)}, 0.8)`;
    }
    if (type_graph[thematique] === 'doughnut'){
        backgroundColor = [borderColor, 'rgba(204,204,204,1)'];
        borderColor = 'rgba(255,255,255,1)';
    }
    chart.data.datasets.push({
        class: classtype,
        label: label,
        data: variables,
        borderWidth: 1,
        backgroundColor: backgroundColor,
        borderColor: borderColor,
    });
    if (update) chart.update();
}

//Fonction pour "rafraîchir" les datasets lorsqu'une comparaison est faite
function refreshDataSets(e, json, search, chart_id) {
    const chart = Chart.getChart(chart_id);
    if (!chart) return;
    const feature = json.filter(obj => obj.codgeo == search);
    const thematique = chart_id.substring(6);

    if (e.type === 'change' && e.target.type === 'checkbox') {
        const data_label = getLabelAndData(e.target.name, json, feature);
        if (e.target.checked) {
            pushDataSet(data_label, chart, thematique);
        } else {
            const datasetIndex = chart.data.datasets.findIndex(dataset => dataset.label == data_label[1]);
            if (datasetIndex > 0) {
                chart.data.datasets.splice(datasetIndex, 1);
                chart.update();
            }
        }
    } else if (e.type === 'submit' && e.target.tagName === 'FORM') {
        const name = form_compare.elements['search'].value;
        if (!(window.villes || []).includes(name)) {
            window.errtxt[1].style.display = 'block';
            return;
        }

        window.errtxt[1].style.display = 'none';
        selectedComparison = name;
        const datasetIndex = chart.data.datasets.findIndex(dataset => dataset.class == 'single');
        if (datasetIndex > 0) chart.data.datasets.splice(datasetIndex, 1);

        const data_label = getLabelAndData(name, json, feature);
        pushDataSet(data_label, chart, thematique);
    }
}

const chartsByTab = {
    sl: [['chart_sl1', 'sl1'], ['chart_sl34', 'sl34'], ['chart_slmen', 'slmen']],
    aec: [['chart_aec', 'aec']],
    sdi: [['chart_sdi', 'sdi']],
    sda: [['chart_sda1', 'sda1'], ['chart_sda2', 'sda2']],
    es: [['chart_es1', 'es1'], ['chart_es2', 'es2']],
    ti: [['chart_ti13', 'ti13'], ['chart_ti4', 'ti4']],
};

let dashboardData = null;
let selectedCommune = null;
let selectedComparison = null;
const chartCommunes = new Map();

function getActiveTabId() {
    return document.querySelector('.tab-content[style*="display: block"]')?.id
        || document.querySelector('.tab-content.active')?.id
        || 'sl';
}

function getDashboardStateSignature() {
    return JSON.stringify({
        commune: selectedCommune,
        comparisons: Array.from(checkboxes).filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.name).sort(),
        single: selectedComparison,
    });
}

function markTabCurrent(tabId = getActiveTabId()) {
    if (!chartsByTab[tabId]) return;
    const signature = getDashboardStateSignature();
    chartsByTab[tabId].forEach(([chartId]) => {
        if (Chart.getChart(chartId)) chartCommunes.set(chartId, signature);
    });
}

function refreshDashboardTab(tabId = getActiveTabId()) {
    if (!dashboardData || !selectedCommune || !chartsByTab[tabId]) return;

    const feature = dashboardData.find(item => item.codgeo == selectedCommune);
    if (!feature) return;

    const tabCharts = chartsByTab[tabId];
    const signature = getDashboardStateSignature();
    const needsRebuild = tabCharts.some(([chartId]) =>
        chartCommunes.get(chartId) !== signature || !Chart.getChart(chartId)
    );

    if (needsRebuild) {
        const createdCharts = tabCharts.map(([chartId, theme]) =>
            create_graph(dashboardData, selectedCommune, chartId, theme)
        );

        createdCharts.forEach((chart, index) => {
            if (!chart) return;
            const theme = tabCharts[index][1];
            chartCommunes.set(tabCharts[index][0], signature);

            checkboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    pushDataSet(getLabelAndData(checkbox.name, dashboardData, [feature]), chart, theme, false);
                }
            });

            if (selectedComparison && (window.villes || []).includes(selectedComparison)) {
                pushDataSet(getLabelAndData(selectedComparison, dashboardData, [feature]), chart, theme, false);
            }
            chart.update();
        });
    } else {
        // The comparison interaction only updates charts currently visible in the active tab.
        tabCharts.forEach(([chartId]) => {
            const chart = Chart.getChart(chartId);
            if (chart) chart.resize();
        });
    }
}

// Used by openTab in script_webmapping.js after switching the visible tab.
window.refreshDashboardTab = refreshDashboardTab;

//Promesse : fetch sur les données indicateurs de chaque centre ville
Promise.all([
    fetch('/data').then(res => {
        if (!res.ok) throw new Error('Unable to load dashboard data');
        return res.json();
    }),
    window.webmappingReady,
    window.cityListReady,
])
.then(([json]) => {
    dashboardData = json;

    form.addEventListener('submit', e => {
        if (!window.check_cv.checked) {
            window.check_cv.checked = true;
            window.check_cv.dispatchEvent(new Event('change'));
        }

        const commune = window.geolocalisation(e);
        if (commune === 'non') return;

        selectedCommune = commune;
        window.updateMapTitleAndAgeProfile(selectedCommune, dashboardData);
        refreshDashboardTab(getActiveTabId());
    });

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('click', checkCheckboxLimits);
        checkbox.addEventListener('change', e => {
            if (!selectedCommune) return;
            const activeTab = getActiveTabId();
            chartsByTab[activeTab].forEach(([chartId]) =>
                refreshDataSets(e, dashboardData, selectedCommune, chartId)
            );
            markTabCurrent(activeTab);
        });
    });

    form_compare.addEventListener('submit', e => {
        e.preventDefault();
        if (!selectedCommune) return;
        const activeTab = getActiveTabId();
        chartsByTab[activeTab].forEach(([chartId]) =>
            refreshDataSets(e, dashboardData, selectedCommune, chartId)
        );
        markTabCurrent(activeTab);
    });
})
.catch(error => console.error('Unable to initialize dashboard:', error));