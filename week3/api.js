document.addEventListener("DOMContentLoaded", function() {
    fetchAPI();
})


async function fetchAPI() {
    const tbody = document.getElementById("tbody");
    const url_population="https://statfin.stat.fi/PxWeb/sq/4e244893-7761-4c4f-8e55-7a8d41d86eff";
    const response_pop = await fetch(url_population);
    const data_pop = await response_pop.json();
    const municipalities=Object.values(data_pop.dataset.dimension.Alue.category.label);
    const values=data_pop.dataset.value;

    const url_employment="https://statfin.stat.fi/PxWeb/sq/5e288b40-f8c8-4f1e-b3b0-61b86ce5c065";
    const response_emp = await fetch(url_employment);
    const data_emp = await response_emp.json();
    const employment=data_emp.dataset.value;
    for (let i=0; i<municipalities.length; i++) {
        const tr = document.createElement("tr");
        const td1 = document.createElement("td");
        const td2 = document.createElement("td");
        const td3 = document.createElement("td");
        const td4 = document.createElement("td");
        td1.innerText = municipalities[i];
        td2.innerText = values[i];
        td3.innerText = employment[i];
        const emprate=employment[i]/values[i];
        td4.innerText = (emprate*100).toFixed(2)+'%';
        tr.appendChild(td1);
        tr.appendChild(td2);
        tr.appendChild(td3);
        tr.appendChild(td4);
        if (emprate>0.45) {
            tr.classList.add('high-employment');
        } else if (emprate<0.25) {
            tr.classList.add('low-employment');
        }
        tbody.appendChild(tr);
    }
}