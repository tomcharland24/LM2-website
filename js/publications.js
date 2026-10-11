let allPublications = [];

function escapeHtml(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function populateYearFilter(publications) {
    const yearSelect = document.querySelector("[data-publication-year]");
    if (!yearSelect) return;

    const years = [...new Set(publications.map((pub) => pub.year).filter(Boolean))]
        .sort((a, b) => Number(b) - Number(a));

    yearSelect.innerHTML = `
        <option value="">All years</option>
        ${years.map((year) => `<option value="${escapeHtml(year)}">${escapeHtml(year)}</option>`).join("")}
    `;
}

function populateAuthorFilter(publications) {
    const authorList = document.querySelector("#author-list");
    if (!authorList) return;

    const authors = [...new Set(
        publications.flatMap((pub) => pub.authors || [])
    )].sort();

    authorList.innerHTML = authors
        .map((author) => `<option value="${escapeHtml(author)}"></option>`)
        .join("");
}

function renderPublications(publications) {
    const list = document.querySelector("[data-publication-list]");
    if (!list) return;

    if (publications.length === 0) {
        list.innerHTML = `<p>No publications found.</p>`;
        return;
    }

    list.innerHTML = publications
        .slice()
        .sort((a, b) => Number(b.year) - Number(a.year))
        .map((publication) => {
            const authors = (publication.authors || []).join(", ");
            const link = publication.url || (publication.doi ? `https://doi.org/${publication.doi}` : "#");
            const title = escapeHtml(publication.title);
            const linkedTitle = link === "#"
                ? `<span class="pub-title">“${title}”</span>`
                : `<a class="pub-title" href="${escapeHtml(link)}" target="_blank" rel="noopener">“${title}”</a>`;
            const journal = publication.journal || publication.type;
            const details = [publication.publisher, publication.year].filter(Boolean).join(", ");

            return `
                <article class="publication-card">
                    <p class="pub-citation">${escapeHtml(authors)}. ${linkedTitle} <span class="pub-journal">${escapeHtml(journal)}</span>${details ? `, ${escapeHtml(details)}` : ""}${publication.doi ? `. <a class="pub-doi" href="${escapeHtml(link)}" target="_blank" rel="noopener">DOI</a>` : "."}</p>
                </article>
            `;
        })
        .join("");
}

function setupJsonPublicationFilters() {
    const textInput = document.querySelector("[data-publication-search]");
    const authorInput = document.querySelector("[data-author-search]");
    const yearSelect = document.querySelector("[data-publication-year]");

    function applyFilters() {
        const textQuery = textInput?.value.trim().toLowerCase() || "";
        const authorQuery = authorInput?.value.trim().toLowerCase() || "";
        const year = yearSelect?.value || "";

        const filtered = allPublications.filter((pub) => {
            const authors = (pub.authors || []).join(" ").toLowerCase();

            const searchableText = [
                pub.title,
                pub.journal,
                pub.publisher,
                pub.type,
                pub.doi,
                pub.keywords,
                authors
            ].join(" ").toLowerCase();

            const matchesText = !textQuery || searchableText.includes(textQuery);
            const matchesAuthor = !authorQuery || authors.includes(authorQuery);
            const matchesYear = !year || pub.year === year;

            return matchesText && matchesAuthor && matchesYear;
        });

        renderPublications(filtered);
    }

    textInput?.addEventListener("input", applyFilters);
    authorInput?.addEventListener("input", applyFilters);
    yearSelect?.addEventListener("change", applyFilters);
}

async function loadPublications() {
    const list = document.querySelector("[data-publication-list]");
    if (!list) return;

    const isFrench = window.location.pathname.includes("/fr/");
    const dataPath = isFrench ? "../Publication_Data/publications.json" : "Publication_Data/publications.json";

    try {
        const response = await fetch(dataPath);
        allPublications = await response.json();

        populateYearFilter(allPublications);
        populateAuthorFilter(allPublications);
        renderPublications(allPublications);
        setupJsonPublicationFilters();
    } catch (error) {
        list.innerHTML = `<p>Publications could not be loaded.</p>`;
        console.error(error);
    }
}

document.addEventListener("DOMContentLoaded", loadPublications);
