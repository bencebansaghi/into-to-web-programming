document.addEventListener("DOMContentLoaded", function() {
    initializeCode();
})

function initializeCode() {
    const logHello = document.getElementById("my-button");

    logHello.addEventListener("click", function() {
        console.log("hello world");

        const h1Element = document.getElementsByTagName("h1")[0];
        h1Element.textContent = "Moi maailma";
    })

    const addListElement = document.getElementById("add-data");
    
    addListElement.addEventListener("click", function() {
        const list = document.getElementById("my-list");
        const value = document.getElementById("textarea").value;
        const listElement = document.createElement("li");
        listElement.textContent = value;
        list.appendChild(listElement);
    })



}
