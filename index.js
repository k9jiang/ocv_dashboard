const express = require("express");

const path = require("path");

const app = express();

const fs = require('fs');

require('dotenv').config();


//Où trouver les fichiers statiques si le chemin n'existe pas
app.use(express.static(path.join(__dirname, "public")));

app.use(express.urlencoded({ extended: true })); //Autoriser les req.body
app.use(express.json());

//Système de vues à préciser. Set pour configurer
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); //Où trouver les vues

//Listen pour écouter le port 3000
app.listen(3000, () => {
    console.log("Serveur démarré (http://localhost:3000/) !");
});

app.get("/", (req, res) => {
  res.render("index");
})

let perimetre_ocv;
let perimetre_commune;
let indicateurs_ocv;
let cities;

//Lit les fichiers json et geojson et les stocke dans des variables
fs.readFile('public/json/perimetre_ocv.geojson', 'utf8', function(err, data){
  if(err) throw err;
  perimetre_ocv = JSON.parse(data);
})

fs.readFile('public/json/commune.geojson', 'utf8', function(err, data){
  if(err) throw err;
  perimetre_commune = JSON.parse(data);
})

fs.readFile('public/json/indicateurs_ocv2.json', 'utf8', function(err, data){
  if(err) throw err;
  indicateurs_ocv = JSON.parse(data);
  //Filtration pour n'avoir que les communes et leur code insee
  cities = Object.keys(indicateurs_ocv).map(key => {
    const { nom_com, codgeo } = indicateurs_ocv[key];
    return { nom_com, codgeo };
  });
  cities.sort((a, b) => a.nom_com.localeCompare(b.nom_com));
});

//Routage
app.get("/villes", (req, res) => {
  res.json(cities);
});

app.get("/data", (req, res) => {
  res.json(indicateurs_ocv);
});

app.get("/perimetre_ocv", (req, res) => {
  res.json(perimetre_ocv);
});

app.get("/perimetre_commune", (req, res) => {
  res.json(perimetre_commune);
});
app.get("/dl-data", (req, res) => {
  res.download('public/export_data/indicateurs_ocv.xlsx');
})