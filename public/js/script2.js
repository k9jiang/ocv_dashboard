let input_compare = document.getElementById('compare');
let list_compare = document.querySelector('.list-compare');
let form_compare = document.getElementById('compare-form');
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
            max: 100,
            min: 0,
            ticks: {
                stepSize: 20
            }
        }
    },
    'sl34':{
        y:{
            max: 50,
            min: 0,
        }
    },
    'slmen':{
        x:{
            max: 100,
            min: 0,
        }
    },
    'aec':{
        r: {
            max: 1,
            min: 0,
            ticks: {
                stepSize: 0.2
            }
        }
    },
    'sdi': {
        r: {
            max: 5,
            min: 0,
            ticks: {
                stepSize: 1
            }
        }
    }
}

const nom_indicateurs = {
    'sl1a' : ['Part des petits', 'logements (T1-T2)'],
    'sl1b' : ['Part des propriétaires occupants'],
    'sl1c' : ['Part des logements locatifs sociaux'],
    'sl3' : ['Part des logements construits', 'entre 2010 et 2020'],
    'sl4' : ['Part des logements vacants', 'depuis plus de 2 ans'],
    'sl_menpauv': 'Part des ménages à bas revenus',
    'sl_menseul': "Part des ménages d'une personne",
    'aec1' : 'Indice de concentration commerciale',
    'aec2' : 'Indice de spécialisation commerciale',
    'aec3' : 'Indice de spéficité commerciale',
    'sdi1' : "Indicateur d'offre culturelle",
    'sdi2' : "Indicateur d'offre de convivialité",
    'sdi3' : "Indicateur d'offre de loisirs",
    'sda1' : 'Accessibilité piétone',
    'sda2' : 'Part des voies cyclables',
    'es1' : 'Nombre de médecins généralistes pour 10 000 habitants',
    'es2' : 'Part des espaces verts publics dans un rayon de 500m',
    'ti1' : 'Mixité fonctionnelle du foncier',
    'ti3' : 'Part des immeubles raccordés à la fibre',
    'ti4' : 'Nombre de tiers-lieux'
};

input_compare.addEventListener("keyup", (e) => {
    items = document.querySelectorAll(".list-item-compare");
    remove_elements(items)
    for (let ville of villes) {
        //autocompletion
        if (is_part_of(input_compare.value, ville) && input_compare.value != ""){
            let list_item = document.createElement("li");
            list_item.classList.add("list-item-compare");
            list_item.style.cursor = "pointer";
            list_item.setAttribute("onclick", "display_names(`"+ville+"`, 'compare')"); //backticks here and not apostrophes because of cities that contain one
            let match_index = ville.toLowerCase().indexOf(input_compare.value.toLowerCase());
            let item = `${ville.substr(0,match_index)}<b>${ville.substr(match_index, input_compare.value.length)}</b>${ville.substr(match_index+input_compare.value.length)}`;
            list_item.innerHTML = item;
            document.querySelector('.list-compare').appendChild(list_item);
        }
    }
});

//Fonction qui vérifie si le canva d'un graphique est vide
function isCanvasEmpty(canvas) {
    let context = canvas.getContext('2d');
    let pixelBuffer = new Uint32Array(
    context.getImageData(0, 0, canvas.width, canvas.height).data.buffer);
    console.log(!pixelBuffer.some(color => color !== 0));
    return !pixelBuffer.some(color => color !== 0);
}

function create_graph(json, search, is_submitted, chart_id, thematique){
    var cnv = document.getElementById(chart_id);
    let feature = json.filter(obj => obj.codgeo == search);
    let name_label = feature[0].nom_com;
    let data = indicateurs[thematique].map((indicateur) => feature[0][indicateur]);
    let labels = indicateurs[thematique].map((indicateur) => nom_indicateurs[indicateur]);
    let type = type_graph[thematique];
    let scales = options_graph[thematique];
    let bd_col = ['#FF7F00'];
    let bg_col;
    let borderWidth = 3;
    let indexAxis = 'x';
    //S'il y a déjà eu une création de graphique, détruire le graphique
    if (is_submitted) {
        let chartToDestroy = Chart.getChart(chart_id);
        chartToDestroy.destroy();
    }
    //Les graphiques en radar ont une opacité réduite pour la superposition
    if (type ==='radar'){
        bg_col = [`rgba(${hexToRgb(bd_col[0])}, 0.3)`];
    }
    else {
        bg_col = [`rgba(${hexToRgb(bd_col[0])}, 0.8)`];
    }
    if (thematique === 'slmen'){
        indexAxis = 'y';
    }
    let chart = new Chart(cnv, {
        type: type,
        data: {
          labels : labels,
          datasets: [{
            label: name_label,
            data: data,
            backgroundColor: bg_col,
            borderColor: bd_col,
            borderWidth: borderWidth,
          }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: scales,
            indexAxis: indexAxis,
        }
    });
    return chart;
}

function calculateMedian(jsonData, attribute) {
    // Trier les éléments du JSON en fonction de la valeur de l'attribut
    let sortedData = jsonData.sort((a, b) => a[attribute] - b[attribute]);
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
    let bg_col;
    // classtype permettra ensuite de réaliser des opérations selon la propriété "class" des datasets
    // ici : 'multiple' sera pour les datasets issus de plusieurs communes et 'single' pour une seule.
    let classtype = 'multiple';
    if (name == 'france'){
        data = json;
        label = 'Médiane nationale';
        bg_col = '#0050A4';
    }
    else if (name == 'region'){
        data = json.filter(obj => obj.region == feature[0].region);
        label = 'Médiane régionale';
        bg_col = '#8A0D1E';    }
    else if (name == 'departement'){
        data = json.filter(obj => obj.codgeo.substring(0,2) == feature[0].codgeo.substring(0,2));
        label = 'Médiane départementale';
        bg_col = "#F5DF4D";
    }
    else if (name == 'type'){
        data = json.filter(obj => obj.categ_cent == feature[0].categ_cent);
        label = `Médiane des ${getPluralSeparated(type_cv[feature[0].categ_cent])}`;
        bg_col = geom_style[feature[0].categ_cent].fillColor;
    }
    //Tous les autres cas, c-a-d lorsqu'on compare avec un autre centre-ville
    else {
        codgeo = name.substring(name.length -6, name.length-1)
        data = json.filter(obj => obj.codgeo == codgeo);
        label = name.substring(0, name.length - 8);
        bg_col = '#FDA1FA';
        classtype = 'single';
    }
    return [data, label, bg_col, classtype]
}

//Fonction permettant d'ajouter le dataset au chart 
function pushDataSet(data_label, chart, thematique){
    let data = data_label[0];
    let label = data_label[1];
    let bd_col = data_label[2];
    let bg_col;
    let borderWidth = 3;
    let classtype = data_label[3];
    let variables = indicateurs[thematique].map((indicateur) => calculateMedian(data, indicateur));
    if (type_graph[thematique] === 'radar'){
        bg_col = `rgba(${hexToRgb(bd_col)}, 0.2)`;
    }
    else {
        bg_col = `rgba(${hexToRgb(bd_col)}, 0.8)`;
    }
    if (type_graph[thematique] === 'doughnut'){
        variables = [variables, 100-variables];
        bg_col = [bd_col, 'rgba(204,204,204,1)'];
        bd_col = 'rgba(255,255,255,1)';
        borderWidth = 1
    }
    newDataset = {
        class: classtype,
        label: label,
        data : variables,
        borderWidth: 1,
        backgroundColor: bg_col,
        borderColor: bd_col,
    };
    chart.data.datasets.push(newDataset);
    chart.update();
}

//Fonction pour "rafraîchir" les datasets lorsqu'une comparaison est faite
function refreshDataSets(e, json, search, chart_id) {
    var ctx = document.getElementById(chart_id);
    let chart = Chart.getChart(ctx);
    let feature = json.filter(obj => obj.codgeo == search);
    let thematique = chart_id.substr(6);
    // Si un checkbox est coché ou décoché...
    if (e.type === 'change' && e.target.type === 'checkbox') {
        let data_label = getLabelAndData(e.target.name, json, feature);
        // S'il est coché, alors on y ajoute le dataset obtenu par la fonction pushDataSet
        if (e.target.checked) {
            pushDataSet(data_label, chart, thematique);
        }
        // Si non, on enlève le dataset en question grâce à son index
        else {
            let label = data_label[1];
            let datasetIndexToRemove = chart.data.datasets.findIndex(dataset => dataset.label == label);
            if (datasetIndexToRemove > 0) {
                chart.data.datasets.splice(datasetIndexToRemove, 1);
                chart.update();
            }
        }
    }
    // Si non, (comparaison avec une commune)
    else if (e.type === 'submit' && e.target.tagName === 'FORM') {
        let datasetIndexToRemove = chart.data.datasets.findIndex(dataset => dataset.class == 'single');
        //Si l'index n'existe pas il sera égal à -1, alors s'il est >0, on supprime le dataset précédent
        if (datasetIndexToRemove > 0) {
            chart.data.datasets.splice(datasetIndexToRemove, 1);
            chart.update();}
        //On ajoute au chart le dataset obtenu
        let data_label = getLabelAndData(form_compare.elements["search"].value, json, feature);
        pushDataSet(data_label, chart, thematique);
    }
}

//Promesse : fetch sur les données indicateurs de chaque centre ville
fetch('http://localhost:3000/data')
.then(function(res){
    return res.json();
})
.then(function(json){
    let is_submitted = false;
    data_json = json;
    form.addEventListener('submit', (e) => {
        //Si l'affichage des périmètres de centre villes est désactivé lors de la recherche de commune
        if (!check_cv.checked){
            //Créer "artficiellement" un évenement "change" et cocher la checkbox
            check_cv.checked = true;
            check_cv.dispatchEvent(new Event ('change'));
        }
        //Utiliser de la fonction geolocalisation pour zoomer sur la commune et récuperer le code insee
        search = geolocalisation(e);
        //Mettre à jour le titre de la carte
        updateMapTitle(search, data_json);
        //Création des graphiques
        let chart_sdi = create_graph(data_json, search, is_submitted, 'chart_sdi', 'sdi');
        let chart_aec = create_graph(data_json, search, is_submitted, 'chart_aec', 'aec');
        let chart_sl1 = create_graph(data_json, search, is_submitted, 'chart_sl1', 'sl1');
        let chart_sl34 = create_graph(data_json, search, is_submitted, 'chart_sl34', 'sl34');
        let chart_slmen = create_graph(data_json, search, is_submitted, 'chart_slmen', 'slmen');
        let chart_sda1 = create_graph(data_json, search, is_submitted, 'chart_sda1', 'sda1');
        let chart_sda2 = create_graph(data_json, search, is_submitted, 'chart_sda2', 'sda2');
        let chart_es1 = create_graph(data_json, search, is_submitted, 'chart_es1', 'es1');
        let chart_es2 = create_graph(data_json, search, is_submitted, 'chart_es2', 'es2');
        let chart_ti13 = create_graph(data_json, search, is_submitted, 'chart_ti13', 'ti13');
        let chart_ti4 = create_graph(data_json, search, is_submitted, 'chart_ti4', 'ti4');
        is_submitted = true;
        for (let i = 0; i< checkboxes.length; i++){
            if (checkboxes[i].checked) {
                let feature = json.filter(obj => obj.codgeo == search);
                label_data = getLabelAndData(checkboxes[i].name, json, feature);
                pushDataSet(label_data, chart_sdi, 'sdi');
                pushDataSet(label_data, chart_aec, 'aec');
                pushDataSet(label_data, chart_sl1, 'sl1');
                pushDataSet(label_data, chart_sl34, 'sl34');
                pushDataSet(label_data, chart_sda1, 'sda1');
                pushDataSet(label_data, chart_sda2, 'sda2');
                pushDataSet(label_data, chart_es1, 'es1');
                pushDataSet(label_data, chart_es2, 'es2');
                pushDataSet(label_data, chart_ti13, 'ti13');
                pushDataSet(label_data, chart_slmen, 'slmen');
                pushDataSet(label_data, chart_ti4, 'ti4');
            }
        }
    });
    for (let i = 0; i < checkboxes.length; i++) {
        checkboxes[i].addEventListener('change', (e) => {
            if (is_submitted) {
                refreshDataSets(e, json, search, 'chart_sdi');
                refreshDataSets(e, json, search, 'chart_aec');
                refreshDataSets(e, json, search, 'chart_sl1');
                refreshDataSets(e, json, search, 'chart_sl34');
                refreshDataSets(e, json, search, 'chart_slmen');
                refreshDataSets(e, json, search, 'chart_sda1');
                refreshDataSets(e, json, search, 'chart_sda2');
                refreshDataSets(e, json, search, 'chart_es1');
                refreshDataSets(e, json, search, 'chart_es2');
                refreshDataSets(e, json, search, 'chart_ti13');
                refreshDataSets(e, json, search, 'chart_ti4');
            }
        });
    }
    form_compare.addEventListener('submit', (e) => {
        e.preventDefault();
        if(is_submitted){
            refreshDataSets(e, json, search, 'chart_sdi');
            refreshDataSets(e, json, search, 'chart_aec');
            refreshDataSets(e, json, search, 'chart_sl1');
            refreshDataSets(e, json, search, 'chart_sl34');
            refreshDataSets(e, json, search, 'chart_slmen');
            refreshDataSets(e, json, search, 'chart_sda1');
            refreshDataSets(e, json, search, 'chart_sda2');
            refreshDataSets(e, json, search, 'chart_es1');
            refreshDataSets(e, json, search, 'chart_es2');
            refreshDataSets(e, json, search, 'chart_ti13');
            refreshDataSets(e, json, search, 'chart_ti4');
        }
    })
})