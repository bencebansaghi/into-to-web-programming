document.addEventListener("DOMContentLoaded", function() {
    initializeCode();
})

function initializeCode() {
    const submitData = document.getElementById("submit-data");
    submitData.addEventListener("click", function() {
        const username = document.getElementById("input-username").value;
        const email = document.getElementById("input-email").value;
        const isAdmin = document.getElementById("input-admin").checked;
        const imageFile = document.getElementById("input-image").files[0];

        // Check if the username is already in the table, modify and return if it is
        const table = document.getElementById("user-table");
        for (let i = 0; i < table.rows.length; i++) {
            const row = table.rows[i];
            if (row.cells[0].textContent === username) {
                if (email !== "") {
                    row.cells[1].textContent = email;
                }
                if (isAdmin) {
                    row.cells[2].textContent = "X";
                }
                else {
                    row.cells[2].textContent = "-";
                }
                if (imageFile) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        const image = document.createElement("img");
                        image.src = event.target.result;
                        image.width = 64;
                        image.height = 64;
                
                        const imageCell = document.createElement("td");
                        imageCell.appendChild(image);
                
                        row.appendChild(imageCell);
                        console.log("we here")
                    }
                    reader.readAsDataURL(imageFile);
                }
                return;
            }
        }

        const newRow = document.createElement("tr");
        const usernameCell = document.createElement("td");
        usernameCell.textContent = username;
        const emailCell = document.createElement("td");
        emailCell.textContent = email;
        const adminCell = document.createElement("td");
        if (isAdmin) {
            adminCell.textContent = "X";
        }
        else {
            adminCell.textContent = "-";
        }
        if (imageFile) {
            const reader = new FileReader();
            reader.onload = function(event) {
                try{
                    const image = document.createElement("img");
                    image.src = event.target.result;
                    image.width = 64;
                    image.height = 64;

                    const imageCell = document.createElement("td");
                    imageCell.appendChild(image);
                }
                catch(err){
                    console.log(err);
                    return;
                }

                newRow.appendChild(imageCell);
            }
            reader.readAsDataURL(imageFile);
        }

        newRow.appendChild(usernameCell);
        newRow.appendChild(emailCell);
        newRow.appendChild(adminCell);

        table.appendChild(newRow);

        // Clear the input fields
        document.getElementById("input-username").value = "";
        document.getElementById("input-email").value = "";
        document.getElementById("input-admin").checked = false;
    })
    const emptyTable = document.getElementById("empty-table");
    emptyTable.addEventListener("click", function() {
        const table = document.getElementById("user-table");
        while (table.rows.length > 1) {
            table.deleteRow(1);
        }
    })
}
