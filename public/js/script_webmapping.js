import * as L from 'leaflet';
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet';

let input = document.getElementById('input-map');
let list = document.querySelector('.list');
let items;
window.L = L;
var map = L.map('map').setView([46.855, 2.15], 6);
let profil_age;
const errtxt = document.querySelectorAll('.err-text');

var max_bounds = L.latLngBounds(
    L.latLng(41.294317, -5.27348), // top-left corner
    L.latLng(51.124213, 9.887695) // bottom-right corner
);

var form = document.getElementById('map-search-form');
let layer_group;
let locationRequestId = 0;
var check_cv = document.getElementById("check-cv");
var cv_group;
var legend;

let type_cv = {
    1: "Polarité structurante",
    2: "Centralité indépendante",
    3: "Polarité multi-connectée",
    4: "Centralité relais",
    5: "Centralité résidentielle",
}

let geom_style = {
    1: {
        weight: 1,
        fillColor: "#9f04c9",
        fillOpacity: 0.5,
        color: "#000"},

    2: {
        weight: 1,
        fillColor: "#ab4700",
        fillOpacity: 0.5,
        color: "#000"},

    3: {
        weight: 1,
        fillColor: "#ed6fc3",
        fillOpacity: 0.5,
        color: "#000"},

    4: {
        weight: 1,
        fillColor: "#2baeff",
        fillOpacity: 0.5,
        color: "#000"},

    5: {
        weight: 1,
        fillColor: "#23a300",
        fillOpacity: 0.5,
        color: "#000"},
}

// Autocomplete is shared by the map search and comparison search fields.
function is_part_of(chaine_recherchee, chaine_a_verifier) {
    return chaine_a_verifier.toLocaleLowerCase().includes(chaine_recherchee.toLocaleLowerCase());
}

function remove_elements(items){
    items.forEach(item => item.remove());
}

function renderCitySuggestions(searchInput, suggestionsList, itemClass) {
    remove_elements(suggestionsList.querySelectorAll('li'));
    const query = searchInput.value.trim();
    const cityNames = window.villes || [];
    const matches = (query ? cityNames.filter(ville => is_part_of(query, ville)) : cityNames).slice(0, 30);
    matches.forEach(ville => {
        const item = document.createElement('li');
        item.className = itemClass;
        item.setAttribute('role', 'option');
        item.setAttribute('tabindex', '0');

        const matchIndex = ville.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
        item.append(document.createTextNode(ville.slice(0, matchIndex)));
        const match = document.createElement('b');
        match.textContent = ville.slice(matchIndex, matchIndex + query.length);
        item.append(match, document.createTextNode(ville.slice(matchIndex + query.length)));

        const selectCity = () => {
            searchInput.value = ville;
            suggestionsList.hidden = true;
            searchInput.setAttribute('aria-expanded', 'false');
            searchInput.focus();
            searchInput.closest('form')?.requestSubmit();
        };
        item.addEventListener('click', selectCity);
        item.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                selectCity();
            }
        });
        suggestionsList.appendChild(item);
    });

    suggestionsList.hidden = matches.length === 0;
    searchInput.setAttribute('aria-expanded', String(matches.length > 0));
}

function display_names(value, target){
    const isComparison = target === 'compare';
    const searchInput = document.getElementById(isComparison ? 'compare' : 'input-map');
    const suggestionsList = document.getElementById(isComparison ? 'list-compare' : 'list-map');
    searchInput.value = value;
    suggestionsList.hidden = true;
    searchInput.setAttribute('aria-expanded', 'false');
    searchInput.closest('form')?.requestSubmit();
}

input.addEventListener('input', () => renderCitySuggestions(input, list, 'list-item'));
input.addEventListener('focus', () => renderCitySuggestions(input, list, 'list-item'));
list.addEventListener('mousedown', event => event.preventDefault());
input.addEventListener('blur', () => {
    window.setTimeout(() => {
        list.hidden = true;
        input.setAttribute('aria-expanded', 'false');
    }, 120);
});


function geolocalisation(event){
    event.preventDefault();
    var search = form.elements["search"].value;
    if (!villes.includes(search)){
        errtxt[0].style.display = 'block';
        return 'non'
    }
    else{
        errtxt[0].style.display = 'none';
        const link = 'https://api-adresse.data.gouv.fr/search/?q=' + encodeURIComponent(search);
        get_fetch_location(link);
        return search.substring(search.length -6, search.length-1)
    }
}

async function get_fetch_location(link){
    const requestId = ++locationRequestId;
    try {
        const response = await fetch(link);
        if (!response.ok) throw new Error('Unable to locate the selected commune');
        const result = await response.json();
        const feature = result.features?.[0];
        if (!feature || requestId !== locationRequestId) return;

        const coordinates = feature.geometry?.coordinates;
        const longitude = Array.isArray(coordinates) ? Number(coordinates[0]) : NaN;
        const latitude = Array.isArray(coordinates) ? Number(coordinates[1]) : NaN;
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
            || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            throw new Error('The location service returned invalid coordinates');
        }

        map.setView([latitude, longitude], 13);
    } catch (error) {
        console.error('Commune location failed:', error);
    }
}

function format_number(num) {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ');
}

function createLegend() {
    legend = L.control({ position: "bottomleft" });
    legend.onAdd = () => {
        const div = L.DomUtil.create("div", "legend");
        const labels = Object.values(type_cv); // Labels des couches
        const colors = Object.values(geom_style).map(style => style.fillColor); // Couleurs des couches
        let svg_content = "<svg>";
        let y = 50;
        svg_content += "<rect width='180' height='180' x='0' y='45' fill='#ffffff' fill-opacity='0.7'/>";
        // loop over layers too add labels and colors in the legend
        for (let i = 0; i < labels.length; i++) {
            let y_lab = y+12; //adjusting y position of labels according to rectangles
            svg_content += `<rect width="30" height="15" x="5" y="${y}" fill-opacity="${geom_style[i+1].fillOpacity}" style="fill:${colors[i]};
            stroke-width:${geom_style[i+1].weight};
            stroke:${geom_style[i+1].color}"/>`;
            svg_content += `<text y="${y_lab}" x="40">${labels[i]}</text>`;
            y +=20;
        }
        svg_content += "</svg>";
        div.innerHTML = svg_content;
        return div;
    };
    legend.addTo(map);
}

map.setMaxBounds(max_bounds);
map.setMinZoom(6);

//L.tileLayer('https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.jpg', {
//    maxZoom: 19,
//    attribution: '&copy Map tiles by <a href="https://carto.com/attribution/#basemaps">CartoDB</a>'
//}).addTo(map);

maplibreGL({ style: 'https://tiles.openfreemap.org/styles/positron' }).addTo(map);

let contour_commune;
fetch('/perimetre_commune')
.then(res => {
    if (!res.ok) throw new Error('Unable to load commune boundaries');
    return res.json();
})
.then(res2 => {
    contour_commune = L.geoJSON(res2, {
        style : function(feature) {
            return {
                fillColor : 'transparent',
                color : 'blue',
                weight : 1,
                opacity: 1
            }
        }
    } ).addTo(map);
})

//On charge une seule fois les données du geoserver
//fetch('http://localhost:8080/geoserver/ocv/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=ocv%3Aperimetre_cv_viz_4326&outputFormat=application%2Fjson')
fetch('/perimetre_ocv')
.then(res => res.json())
.then(res2 => {
    check_cv.addEventListener('change', (e) => {
        if (e.target.checked){
            cv_group = L.geoJSON(res2, {
                style: function(feature) {
                return geom_style[feature.properties.categ_cent]}
            }
            ).addTo(map).eachLayer(function(layer){
                //En hover d'un périmètre CV on retrouve le nom de la commune, son type et sa population.
                layer.bindTooltip(`
                ${layer.feature.properties.nom_com} (${layer.feature.properties.codgeo}) : ${type_cv[layer.feature.properties.categ_cent]}
                <br>Population du centre (2017) : ${format_number(layer.feature.properties.pop_cv)}
                <br>Population totale de la commune (2017) : ${format_number(layer.feature.properties.totpop_com)}`,
                {sticky: true, bubblingMouseEvents: false});
            });
            createLegend();
        }
        else {
            if (cv_group) cv_group.removeFrom(map);
            if (legend && map.hasLayer(legend)) map.removeControl(legend);
        }
    })
})

function openTab(evt, tabName) {
    // Récupère tous les éléments avec la classe "tab-content" et cache-les
    const tabContent = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabContent.length; i++) {
      tabContent[i].style.display = 'none';
      tabContent[i].classList.remove('active');
    }
  
    // Récupère tous les éléments avec la classe "tab-button" et retire la classe "active"
    const tabButton = document.getElementsByClassName('tab-button');
    for (let i = 0; i < tabButton.length; i++) {
      tabButton[i].classList.remove('active');
    }
  
    // Affiche le contenu de l'onglet sélectionné et maintient son état actif en classe.
    const activeContent = document.getElementById(tabName);
    activeContent.style.display = 'block';
    activeContent.classList.add('active');
    evt.currentTarget.classList.add('active');

    // Construire/redimensionner uniquement les graphiques de l'onglet visible.
    if (typeof window.refreshDashboardTab === 'function') {
      window.refreshDashboardTab(tabName);
    }
  }

// Définir le nombre maximum de cases à cocher activées
const maxChecked = 2;

// Fonction pour vérifier le nombre de cases à cocher activées
function checkCheckboxLimits(e) {
  var checkedCount = 0;
  for (var i = 0; i < checkboxes.length; i++) {
    if (checkboxes[i].checked) {
      checkedCount++;
    }
  }
  
  if (checkedCount > maxChecked && e.target.checked) {
    e.preventDefault();
    e.target.checked = false;
  }
}

function updateMapTitleAndAgeProfile(commune, data){
    const mapTitle = document.getElementById('map-title');
    const communeData = data.find(obj => obj.codgeo == commune);
    if (!communeData) return;

    mapTitle.textContent = '';
    mapTitle.innerHTML = `<b>${communeData.nom_com}</b>, ${type_cv[communeData.categ_cent]}`;
    const ageProfile = document.getElementById('profil-age');
    ageProfile.textContent = '';
    ageProfile.innerHTML = `<b>Profil lié à l'âge</b> : ${window.types_profil_age?.[communeData.sl_age] || ''}`;
}

// This file is an ES module, so explicitly expose the legacy API used by the
// dashboard script and inline tab handlers.
Object.assign(window, {
    map,
    form,
    check_cv,
    errtxt,
    type_cv,
    geom_style,
    checkCheckboxLimits,
    openTab,
    geolocalisation,
    updateMapTitleAndAgeProfile,
    is_part_of,
    remove_elements,
    renderCitySuggestions,
    display_names,
});

window.webmappingReady = window.webmappingReady || Promise.resolve();
window.dispatchEvent(new Event('webmapping-ready'));