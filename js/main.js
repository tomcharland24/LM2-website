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
        <li><a href="${prefix}infrastructure.html" onclick="toggleMenu()">Infrastructure</a></li>
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
            code: card.dataset.countryCode || card.dataset.nationality,
            label: card.dataset.countryLabel || card.dataset.nationality
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
        const current = counts.get(key) || {
            country: member.country,
            code: key,
            label: member.label || member.country,
            count: 0,
            names: []
        };

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
        legend: {
            textStyle: {
                color: "#333",
                fontSize: 12
            }
        }
    };

    const chart = new google.visualization.GeoChart(chartContainer);
    chart.draw(data, options);

    if (listContainer) {
        listContainer.innerHTML = Array.from(countryCounts.values())
            .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country))
            .map((item) => `<li><strong>${item.label}</strong><br>${item.names.join(", ")}</li>`)
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
function setupInfrastructureFilters() {
    const buttons = Array.from(document.querySelectorAll("[data-infrastructure-filter]"));
    const sections = Array.from(document.querySelectorAll("[data-infrastructure-section]"));

    if (buttons.length === 0 || sections.length === 0) return;

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            const filter = button.dataset.infrastructureFilter;

            buttons.forEach((item) => item.classList.toggle("active", item === button));

            sections.forEach((section) => {
                const isVisible = filter === "all" || section.dataset.infrastructureSection === filter;
                section.classList.toggle("hidden", !isVisible);
            });
        });
    });
}

function setupDesktopMenuContent() {
    const menu = document.querySelector("[data-desktop-menu]");
    const logoLink = document.querySelector("[data-site-logo]");
    const logoImg = document.querySelector("[data-site-logo-img]");

    if (!menu || !logoLink || !logoImg) return;

    const path = window.location.pathname.replace(/\\/g, "/");
    const currentPage = path.split("/").pop() || "index.html";
    const isFrench = path.includes("/fr/");
    const inResearchFolder = path.includes("/research/");
    const prefix = inResearchFolder ? "../" : "";
    const assetPrefix = isFrench
        ? (inResearchFolder ? "../../" : "../")
        : prefix;

    const labels = {
        about: isFrench ? "&Agrave; propos" : "About",
        team: isFrench ? "&Eacute;quipe" : "Team",
        members: isFrench ? "Membres" : "Members",
        originMap: isFrench ? "Carte des origines" : "Origin map",
        research: isFrench ? "Recherche" : "Research",
        infrastructure: "Infrastructure",
        publications: "Publications",
        contact: "Contact",
        language: isFrench ? "EN" : "FR"
    };

    const languageHref = isFrench
        ? (inResearchFolder ? "../../research/" : "../") + currentPage
        : (inResearchFolder ? "../fr/research/" : "fr/") + currentPage;

    function activeClass(section) {
        if (section === "about") return currentPage === "index.html" ? " active" : "";
        if (section === "team") return ["team.html", "team-map.html"].includes(currentPage) ? " active" : "";
        if (section === "research") return currentPage === "research.html" || inResearchFolder ? " active" : "";
        if (section === "infrastructure") return currentPage === "infrastructure.html" ? " active" : "";
        if (section === "publications") return currentPage === "publications.html" ? " active" : "";
        if (section === "contact") return currentPage === "contact.html" ? " active" : "";

        return "";
    }

    logoLink.href = `${prefix}index.html`;
    logoImg.src = isFrench
        ? `${assetPrefix}Images/Logo_Labo-meca-multi-echelles_Fran_3li_RGB.jpg`
        : `${assetPrefix}Images/Logo_Labo-meca-multi-echelles_Ang_3li_RGB.jpg`;
    logoImg.alt = isFrench ? "Logo LM2" : "LM2 logo";

    menu.innerHTML = `
        <li>
            <a class="nav-link${activeClass("about")}" href="${prefix}index.html">${labels.about}</a>
        </li>
        <li class="nav-item">
            <a class="nav-link${activeClass("team")}" href="${prefix}team.html">${labels.team}</a>
            <div class="dropdown-menu">
                <a href="${prefix}team.html">${labels.members}</a>
                <a href="${prefix}team-map.html">${labels.originMap}</a>
            </div>
        </li>
        <li class="nav-item">
            <a class="nav-link${activeClass("research")}" href="${prefix}research.html">${labels.research}</a>
            <div class="dropdown-menu">
                <a href="${prefix}research/multiscale-mechanics.html">${isFrench ? "M&eacute;canique multi-&eacute;chelles" : "Multiscale Mechanics"}</a>
                <a href="${prefix}research/mechanical-metamaterials.html">${isFrench ? "Métamatériaux mécaniques" : "Mechanical Metamaterials"}</a>
                <a href="${prefix}research/multistable-structures.html">${isFrench ? "Structures multistables" : "Multistable Structures"}</a>
                <a href="${prefix}research/biomimetics-bio-inspiredsystems.html">${isFrench ? "Biomimétique et les systèmes bio-inspirés" : "Biomimetics & Bio-Inspired Systems"}</a>
                <a href="${prefix}research/deployable-structures-inspired-origami-kirigami.html">${isFrench ? "Structures déployables inspirées d'origami et kirigami" : "Deployable Structures Inspired by Origami and Kirigami"}</a>
                <a href="${prefix}research/soft-robotics.html">${isFrench ? "Robotique souple" : "Soft Robotics"}</a>
                <a href="${prefix}research/fluids-structures-interactions.html">${isFrench ? "Interactions fluide-structure" : "Fluid–Structure Interactions"}</a>
                <a href="${prefix}research/additive-manufacturing.html">${isFrench ? "Fabrication additive" : "Additive Manufacturing"}</a>             
                <a href="${prefix}research/additive-manufacturing-smart-composites.html">${isFrench ? "Fabrication additive de composites intelligents" : "Additive Manufacturing of Smart Composites"}</a>
                <a href="${prefix}research/digital-twins-physics-informed-AI.html">${isFrench ? "Jumeaux numériques et IA guidée par la physique" : "Digital Twins & Physics-Informed AI"}</a>
            </div>
        </li>
        <li>
            <a class="nav-link${activeClass("infrastructure")}" href="${prefix}infrastructure.html">${labels.infrastructure}</a>
        </li>
        <li>
            <a class="nav-link${activeClass("publications")}" href="${prefix}publications.html">${labels.publications}</a>
        </li>
        <li>
            <a class="nav-link${activeClass("contact")}" href="${prefix}contact.html">${labels.contact}</a>
        </li>
        <li>
            <a class="lang-switch" href="${languageHref}">${labels.language}</a>
        </li>
        <li class="logo-mark-item">
            <span class="logo-mark">
                <img src="${assetPrefix}Images/LM2_3.png" alt="">
            </span>
        </li>
    `;
}

function setupAboutCarousel() {
    const carousel = document.querySelector("[data-about-carousel]");

    if (!carousel) return;

    const images = Array.from(carousel.querySelectorAll(".image-panel"));
    const prevButton = carousel.querySelector("[data-carousel-prev]");
    const nextButton = carousel.querySelector("[data-carousel-next]");
    let currentIndex = 0;
    let intervalId;

    function showImage(index) {
        currentIndex = (index + images.length) % images.length;

        images.forEach((image, imageIndex) => {
            image.classList.toggle("active", imageIndex === currentIndex);
        });
    }

    function nextImage() {
        showImage(currentIndex + 1);
    }

    function restartInterval() {
        window.clearInterval(intervalId);
        intervalId = window.setInterval(nextImage, 5000);
    }

    prevButton?.addEventListener("click", () => {
        showImage(currentIndex - 1);
        restartInterval();
    });

    nextButton?.addEventListener("click", () => {
        showImage(currentIndex + 1);
        restartInterval();
    });

    restartInterval();
}

function setupFormerStudentFilters() {
    const buttons = Array.from(document.querySelectorAll("[data-former-filter]"));
    const cards = Array.from(document.querySelectorAll("[data-former-student]"));

    if (buttons.length === 0 || cards.length === 0) return;

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            const filter = button.dataset.formerFilter;

            buttons.forEach((item) => {
                item.classList.toggle("active", item === button);
            });

            cards.forEach((card) => {
                const isVisible = filter === "all" || card.dataset.formerCategory === filter;
                card.classList.toggle("hidden", !isVisible);
            });
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    setupDesktopMenuContent();
    setupMobileMenuContent();
    setupAboutCarousel();
    setupPublicationFilters();
    setupInfrastructureFilters();
    setupTeamNationalityData();
    setupFormerStudentFilters();
    setupTeamGeoChart();
});