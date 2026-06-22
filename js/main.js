function toggleMenu() {
    const menu = document.querySelector(".menu-links");
    const icon = document.querySelector(".hamburger-icon");

    if (!menu || !icon) return;

    menu.classList.toggle("open");
    icon.classList.toggle("open");
}

function setupMobileMenuContent() {
    const menu = document.querySelector(".menu-links");

    if (!menu) return;

    const path = window.location.pathname.replace(/\\/g, "/");
    const isFrench = path.includes("/fr/");
    const inResearchFolder = path.includes("/research/");
    const prefix = inResearchFolder ? "../" : "";
    const languageHref = isFrench
        ? (inResearchFolder ? "../../research/" : "../") + (path.split("/").pop() || "index.html")
        : (inResearchFolder ? "../fr/research/" : "fr/") + (path.split("/").pop() || "index.html");

    const aboutLabel = isFrench ? "&Agrave; propos" : "About";
    const teamLabel = isFrench ? "&Eacute;quipe" : "Team";
    const languageLabel = isFrench ? "English" : "Francais";
    const logoPrefix = isFrench ? (inResearchFolder ? "../../" : "../") : prefix;

    menu.innerHTML = `
        <li><a href="${prefix}index.html" onclick="toggleMenu()">${aboutLabel}</a></li>
        <li><a href="${prefix}team.html" onclick="toggleMenu()">${teamLabel}</a></li>
        <li><a href="${prefix}research.html" onclick="toggleMenu()">${isFrench ? "Recherche" : "Research"}</a></li>
        <li><a href="${prefix}publications.html" onclick="toggleMenu()">Publications</a></li>
        <li><a href="${prefix}contact.html" onclick="toggleMenu()">Contact</a></li>
        <li><a href="${languageHref}" onclick="toggleMenu()">${languageLabel}</a></li>
        <li class="mobile-menu-logo"><img src="${logoPrefix}Images/LM2_3.png" alt=""></li>
    `;
}

function setupPublicationFilters() {
    const searchInput = document.querySelector("[data-publication-search]");
    const yearSelect = document.querySelector("[data-publication-year]");
    const themeSelect = document.querySelector("[data-publication-theme]");
    const cards = Array.from(document.querySelectorAll("[data-publication-card]"));

    if (!searchInput || !yearSelect || !themeSelect || cards.length === 0) return;

    function filterPublications() {
        const query = searchInput.value.trim().toLowerCase();
        const year = yearSelect.value;
        const theme = themeSelect.value;

        cards.forEach((card) => {
            const haystack = card.textContent.toLowerCase();
            const matchesQuery = !query || haystack.includes(query);
            const matchesYear = !year || card.dataset.year === year;
            const matchesTheme = !theme || card.dataset.theme === theme;

            card.classList.toggle("hidden", !(matchesQuery && matchesYear && matchesTheme));
        });
    }

    searchInput.addEventListener("input", filterPublications);
    yearSelect.addEventListener("change", filterPublications);
    themeSelect.addEventListener("change", filterPublications);
}

function getStoredTeamNationalities() {
    const stored = window.localStorage.getItem("lm2TeamNationalities");

    if (!stored) return window.LM2_TEAM_NATIONALITIES || [];

    try {
        return JSON.parse(stored);
    } catch (error) {
        return window.LM2_TEAM_NATIONALITIES || [];
    }
}

function setupTeamNationalityData() {
    const cards = Array.from(document.querySelectorAll("[data-nationality]"));

    if (cards.length === 0) return;

    const nationalities = cards.map((card) => {
        const name = card.querySelector("h3")?.textContent.trim() || "Team member";
        const role = card.querySelector(".member-meta")?.textContent.trim() || "";

        return {
            name,
            role,
            country: card.dataset.nationality,
            code: card.dataset.countryCode || card.dataset.nationality
        };
    }).filter((member) => member.country);

    window.localStorage.setItem("lm2TeamNationalities", JSON.stringify(nationalities));
}

function drawTeamGeoChart() {
    const chartContainer = document.querySelector("[data-geochart]");
    const listContainer = document.querySelector("[data-origin-list]");

    if (!chartContainer || typeof google === "undefined" || !google.visualization) return;

    const members = getStoredTeamNationalities();
    const countryCounts = members.reduce((counts, member) => {
        const key = member.code || member.country;
        const current = counts.get(key) || { country: member.country, code: key, count: 0, names: [] };

        current.count += 1;
        current.names.push(member.name);
        counts.set(key, current);

        return counts;
    }, new Map());

    const rows = Array.from(countryCounts.values()).map((item) => [item.code, item.count]);
    const data = google.visualization.arrayToDataTable([
        ["Country", "Members"],
        ...rows
    ]);

    const options = {
        colorAxis: { colors: ["#f7b7bb", "#ed1c24", "#9f1015"] },
        datalessRegionColor: "#eef0f4",
        backgroundColor: "#ffffff",
        legend: "none"
    };

    const chart = new google.visualization.GeoChart(chartContainer);
    chart.draw(data, options);

    if (listContainer) {
        listContainer.innerHTML = Array.from(countryCounts.values())
            .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country))
            .map((item) => `<li><strong>${item.country}</strong><br>${item.count} member${item.count > 1 ? "s" : ""}: ${item.names.join(", ")}</li>`)
            .join("");
    }
}

function setupTeamGeoChart() {
    const chartContainer = document.querySelector("[data-geochart]");

    if (!chartContainer) return;

    if (typeof google === "undefined" || !google.charts) {
        chartContainer.innerHTML = "<p>Google Charts could not be loaded.</p>";
        return;
    }

    google.charts.load("current", { packages: ["geochart"] });
    google.charts.setOnLoadCallback(drawTeamGeoChart);
    window.addEventListener("resize", drawTeamGeoChart);
}

document.addEventListener("DOMContentLoaded", () => {
    setupMobileMenuContent();
    setupPublicationFilters();
    setupTeamNationalityData();
    setupTeamGeoChart();
});
