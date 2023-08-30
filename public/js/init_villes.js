var villes =[];

//fetch('http://localhost:3000/villes')
//.then(res => res.json())
//.then(res2 => {
//    for (ville of res2) {
//        villes.push(ville.nom_com +' (' + ville.codgeo + ')');
//    }
//})


fetch('http://localhost:3000/villes')
.then(res => {
    if (!res.ok) {
        throw new Error('Network response was not ok');
    }
    return res.json();
})
.then(res2 => {
    for (ville of res2) {
        villes.push(ville.nom_com + ' (' + ville.codgeo + ')');
    }
})
.catch(error => {
    console.error('Fetch error:', error);
});