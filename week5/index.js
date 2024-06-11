document.addEventListener('DOMContentLoaded', function () {
    fetchData();
});

async function fetchData() {
    const url = "https://geo.stat.fi/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=tilastointialueet:kunta4500k&outputFormat=json&srsName=EPSG:4326 ";
    const response = await fetch(url);
    const data = await response.json();
    initMap(data);
}

async function initMap(data) {
    let map = L.map('map', {
        minZoom: -3
    })

    let geoJson = L.geoJSON(data, {
        weight: 2
    }).addTo(map)

    geoJson.eachLayer(function (layer) {
        layer.bindTooltip(layer.feature.properties.nimi, {
        });
    });

    map.fitBounds(geoJson.getBounds())

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap"
    }).addTo(map);

    const posUrl = "https://statfin.stat.fi/PxWeb/sq/4bb2c735-1dc3-4c5e-bde7-2165df85e65f";
    const negUrl = "https://statfin.stat.fi/PxWeb/sq/944493ca-ea4d-4fd9-a75c-4975192f7b6e";

    async function fetchDataAndAssignProperties() {
        const posResponse = await fetch(posUrl);
        const posData = await posResponse.json();
        const negResponse = await fetch(negUrl);
        const negData = await negResponse.json();

        let posIndexes = posData.dataset.dimension.Tuloalue.category.index;
        let negIndexes = negData.dataset.dimension.Lähtöalue.category.index;

        let posValues = posData.dataset.value;
        let negValues = negData.dataset.value;

        const posKeyValuePairs = Object.keys(posIndexes).reduce((acc, key) => {
            acc[key] = posValues[posIndexes[key]];
            return acc;
        }, {});

        const negKeyValuePairs = Object.keys(negIndexes).reduce((acc, key) => {
            acc[key] = negValues[negIndexes[key]];
            return acc;
        }, {});

        console.log('Positive Key-Value Pairs:', posKeyValuePairs);
        console.log('Negative Key-Value Pairs:', negKeyValuePairs);


        for (let i = 0; i < geoJson.getLayers().length; i++) {
            const kuntaCode = geoJson.getLayers()[i].feature.properties.kunta;
            geoJson.getLayers()[i].feature.properties.pos = posKeyValuePairs["KU"+kuntaCode] || 0;
            geoJson.getLayers()[i].feature.properties.neg = negKeyValuePairs["KU"+kuntaCode] || 0;
        }
        
    }

    await fetchDataAndAssignProperties();

    geoJson.eachLayer(function (layer) {
        layer.on('click', function () {
            let name = layer.feature.properties.nimi;
            let pos = layer.feature.properties.pos;
            let neg = layer.feature.properties.neg;
            const popupContent = `<b>${name}</b><br>Positive migration: ${pos} <br>Negative migration: ${neg}`;
            layer.bindPopup(popupContent).openPopup();
        });
        let pos = layer.feature.properties.pos;
        let neg = layer.feature.properties.neg;
        let colorr = `hsl(${Math.min((parseInt(pos) / parseInt(neg)) ** 3 * 60, 120)}, 75%, 50%)`
        layer.setStyle({
            fillColor: colorr
            , color: colorr
        });
    });




}
