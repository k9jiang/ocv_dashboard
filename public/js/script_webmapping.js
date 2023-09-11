let input = document.getElementById('input-map');
let list = document.querySelector('.list');
let items;
var map = L.map('map').setView([46.855, 2.15], 6);
let profil_age;
const errtxt = document.querySelectorAll('.err-text');

var max_bounds = L.latLngBounds(
    L.latLng(41.294317, -5.27348), // top-left corner
    L.latLng(51.124213, 9.887695) // bottom-right corner
);

var form = document.querySelector('form');
var is_first = true; // Initialisation sur true, changement dès qu'on fait appel à l'api pour la géolocalisation
var layer_group;
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

//A chaque fois que le contenu de la barre de recherche change
input.addEventListener("keyup", (e) => {
    items = document.querySelectorAll(".list-item");
    remove_elements(items)
    for (let ville of villes) {
        //autocompletion
        if (is_part_of(input.value, ville) && input.value != ""){
            let list_item = document.createElement("li");
            list_item.classList.add("list-item");
            list_item.style.cursor = "pointer";
            list_item.setAttribute("onclick", "display_names(`"+ville+"`, input)"); //backticks here and not apostrophes because of cities that contain one
            let match_index = ville.toLowerCase().indexOf(input.value.toLowerCase());
            let item = `${ville.substr(0,match_index)}<b>${ville.substr(match_index, input.value.length)}</b>${ville.substr(match_index+input.value.length)}`;
            list_item.innerHTML = item;
            document.querySelector(".list").appendChild(list_item);
        }
    }
    set_border();
});

list.addEventListener("click", (e) => {
    set_border();
})

function is_part_of(chaine_recherchee, chaine_a_verifier) {
    chaine_recherchee = chaine_recherchee.toLowerCase();
    chaine_a_verifier = chaine_a_verifier.toLowerCase();
    return chaine_a_verifier.indexOf(chaine_recherchee) !== -1;
}

function display_names(value, input){
    if (input != 'compare'){
        items = document.querySelectorAll(".list-item");
        input.value = value;}
    else {
        input_compare.value = value;
        items = document.querySelectorAll(".list-item-compare");
    };
    remove_elements(items);
}
function remove_elements(items){
    items.forEach((item) => {
        item.remove();
    });
}

function set_border(){
    items = document.querySelectorAll(".list-item");
    if (items.length>0) {
        list.style.border = "1px solid";
    }
    else{
        list.style.border ="";
    }
}

function geolocalisation(event){
    event.preventDefault();
    var search = form.elements["search"].value;
    if (!villes.includes(search)){
        errtxt[0].style.display = 'block';
        return 'non'
    }
    else{
        errtxt[0].style.display = 'none';
        var link = 'http://api-adresse.data.gouv.fr/search/?q='+search;
        if (is_first){
            get_fetch_location(link);
            is_first = false;
        }
        else {
            layer_group.clearLayers(); //Réinitialise le layergroup s'il s'agit de la deuxième requête de géolocalisation
            get_fetch_location(link);
        }
        return search.substring(search.length -6, search.length-1)
    }
}

function get_fetch_location(link){
    fetch(link)
    .then(function (result) {
    return result.json();
    })
    .then(function (result2) {
    layer_group = L.geoJSON(result2.features[0]);
    var bounds = layer_group.getBounds();
    map.setView([bounds._northEast.lat, bounds._northEast.lng], 13);
    })
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

L.tileLayer('https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.jpg', {
    maxZoom: 19,
    attribution: '&copy Map tiles by <a href="https://carto.com/attribution/#basemaps">CartoDB</a>'
}).addTo(map);

fetch('http://localhost:3000/perimetre_commune')
.then(res => res.json())
.then (res2 => {
    contour_commune = L.geoJSON(res2, {
        style : function(feature) {
            return {
                fillColor : 'transparent',
                color : 'blue',
                weight : 0.5,
                opacity: 1
            }
        }
    } ).addTo(map);
})

//On charge une seule fois les données du geoserver
//fetch('http://localhost:8080/geoserver/ocv/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=ocv%3Aperimetre_cv_viz_4326&outputFormat=application%2Fjson')
fetch('http://localhost:3000/perimetre_ocv')
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
                {sticky: true});
            });
            createLegend();
        }
        else {
            cv_group.removeFrom(map);
            map.removeControl(legend);
        }
    })
})

function openTab(evt, tabName) {
    // Récupère tous les éléments avec la classe "tab-content" et cache-les
    const tabContent = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabContent.length; i++) {
      tabContent[i].style.display = 'none';
    }
  
    // Récupère tous les éléments avec la classe "tab-button" et retire la classe "active"
    const tabButton = document.getElementsByClassName('tab-button');
    for (let i = 0; i < tabButton.length; i++) {
      tabButton[i].classList.remove('active');
    }
  
    // Affiche le contenu de l'onglet sélectionné et ajoute la classe "active" au bouton correspondant
    document.getElementById(tabName).style.display = 'block';
    evt.currentTarget.classList.add('active');
  }

// Récupérer toutes les cases à cocher
var checkboxes = document.querySelectorAll('input[class="compare"]');

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
    map_title = document.getElementById('map-title');
    //réinitialiser le titre de la carte
    map_title.textContent = '';
    //récupérer l'array d'information de la commune avec le json en filtrant par le code insee
    let data_commune = data.filter(obj => obj.codgeo == commune);
    map_title.innerHTML = `<b>${data_commune[0].nom_com}</b>, ${type_cv[data_commune[0].categ_cent]}`;
    sl_age = document.getElementById('profil-age');
    sl_age.textContent = '';
    sl_age.innerHTML = `<b>Profil lié à l'âge</b> : ${types_profil_age[data_commune[0].sl_age]}`;
}