const inputField=document.getElementById("input-show")
const submitButton=document.getElementById("submit-data")
const showContainer=document.getElementsByClassName("show-container")[0]

submitButton.addEventListener("click", async function(){
    event.preventDefault();
    const baseUrl="https://api.tvmaze.com/search/shows?q=";
    const searchValue=inputField.value;
    const url=baseUrl+searchValue;
    const response=await fetch(url)
    const data=await response.json()
    createShowData(data)

})

function createShowData(data) {
    // Clear previous search results
    showContainer.innerHTML = '';

    data.forEach(show => {
        const showData = document.createElement('div');
        showData.classList.add('show-data');

        const showImage = document.createElement('img');
        // I found that some shows do not have a picture
        if (show.show.image && show.show.image.medium) {
            showImage.src = show.show.image.medium;
        } else {
            showImage.src = 'Screenshot 2024-06-08 194612.png';
        }
        showData.appendChild(showImage);

        const showInfo = document.createElement('div');
        showInfo.classList.add('show-info');

        const showTitle = document.createElement('h1');
        showTitle.textContent = show.show.name;
        showInfo.appendChild(showTitle);
        const showSummary = document.createElement('p');
        showSummary.innerHTML = show.show.summary;
        showInfo.appendChild(showSummary);

        showData.appendChild(showInfo);

        showContainer.appendChild(showData);
    });
}