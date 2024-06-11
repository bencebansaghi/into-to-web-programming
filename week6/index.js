let jsonQuery = {
    "query": [
        {
            "code": "Vuosi",
            "selection": {
                "filter": "item",
                "values": [
                    "2000", "2001", "2002", "2003", "2004", "2005", "2006",
                    "2007", "2008", "2009", "2010", "2011", "2012", "2013",
                    "2014", "2015", "2016", "2017", "2018", "2019", "2020",
                    "2021"
                ]
            }
        },
        {
            "code": "Alue",
            "selection": {
                "filter": "item",
                "values": ["SSS"]
            }
        },
        {
            "code": "Tiedot",
            "selection": {
                "filter": "item",
                "values": ["vaesto"]
            }
        }
    ],
    "response": {
        "format": "json-stat2"
    }
};

const getData = async () => {
    const url = "https://statfin.stat.fi/PxWeb/api/v1/en/StatFin/synt/statfin_synt_pxt_12dy.px";
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(jsonQuery)
        });
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch data:", error);
    }
};

const buildChart = async () => {
    const data = await getData();
    if (!data) return;

    const labels = Object.values(data.dimension.Vuosi.category.label);
    const values = data.value;

    let chartData = {
        labels: labels,
        datasets: [
            {
                name: "Population",
                values: values
            }
        ]
    };

    const chart = new frappe.Chart("#chart", {
        title: "Population data",
        data: chartData,
        type: "line",
        height: 450,
        colors: ["#eb5146"]
    });

    const addButton = document.getElementById("add-data");

    addButton.addEventListener("click", async () => {
        const deltas = [];
        const val=chartData.datasets[0].values;
        for (let i = 1; i < val.length; i++) {
            const delta = val[i] - val[i - 1];
            deltas.push(delta);
        }
        let meanDelta = deltas.reduce((sum, delta) => sum + delta, 0) / deltas.length;
        const nextValue = val[val.length - 1] + meanDelta;
        chartData.labels.push(Number(chartData.labels[chartData.labels.length - 1]) + 1);
        chartData.datasets[0].values.push(Number(nextValue.toFixed(2)));
        chart.update(chartData);
    });
    

};

const button = document.getElementById("submit-data");

button.addEventListener("click", async () => {
    const input = document.getElementById("input-area");
    const inputValue = input.value.toLowerCase();

    const response = await fetch("https://statfin.stat.fi/PxWeb/api/v1/en/StatFin/synt/statfin_synt_pxt_12dy.px");
    const json = await response.json();
    const areaCodes = json.variables[1].values;
    const areaNames = json.variables[1].valueTexts;
    areaNames.forEach((name, index) => areaNames[index] = name.toLowerCase());
    const areaCode = areaCodes[areaNames.indexOf(inputValue)];
    
    if (areaCode) {
        jsonQuery.query[1].selection.values[0] = areaCode;
        await buildChart();
    } else {
        console.error("Area code not found for the provided input.");
    }
});

const nextPage = document.getElementById("navigation");
nextPage.addEventListener("click", () => {
    window.location.href = "newchart.html";
});