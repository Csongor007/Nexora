function filterByCategory(category) {
    const termekek = document.querySelectorAll(".termek");

    termekek.forEach((elem) => {
        if (category === "all" || category === "termek" || elem.classList.contains(category)) {
            elem.style.display = "block";
        } else {
            elem.style.display = "none";
        }
    });
}

function filterSearch() {
    const searchQuery = document.getElementById("search").value.toLowerCase();
    const termekek = document.querySelectorAll(".termek");

    termekek.forEach((elem) => {
        const termekNev = elem.querySelector(".nev").innerText.toLowerCase();
        if (termekNev.includes(searchQuery)) {
            elem.style.display = "block";
        } else {
            elem.style.display = "none";
        }
    });
}

document.getElementById("Visszanyil").addEventListener("click", function() {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});

