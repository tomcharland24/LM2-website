"""Regenerate both static team pages from the LM2 membership workbook."""

import argparse
import re
from html import escape
from pathlib import Path, PurePosixPath
from urllib.parse import quote, urlsplit

from openpyxl import load_workbook


ROOT = Path(__file__).resolve().parents[1]
ROLES = {
    "professor": ("Professors", "Corps professoral", "Professor", "Professeur"),
    "associate": ("Research associates", "Associés de recherche", "Research associate", "Associé de recherche"),
    "postdoc": ("Postdoctoral fellows", "Stagiaires postdoctoraux", "Postdoctoral fellow", "Postdoctorat"),
    "phd": ("PhD students", "Doctorat", "PhD", "Doctorat"),
    "msc": ("Master’s students", "Maîtrise", "M.Sc.", "M. Sc."),
    "intern": ("Interns", "Stagiaires", "Intern", "Stage"),
    "staff": ("Staff", "Personnel", "Staff", "Personnel"),
    "other": ("Other members", "Autres membres", "Member", "Membre"),
}
REQUIRED = {
    "id", "person_id", "name", "status", "role", "country", "country_fr", "country_code",
    "publish_country", "start", "end", "period_en", "period_fr", "supervisor", "cosupervisor",
    "theme_en", "theme_fr", "project_en", "project_fr", "description_en", "description_fr",
    "credential", "title_en", "title_fr", "email", "publish_email", "linkedin", "expertise_en",
    "expertise_fr", "scholar", "website", "photo",
}


def read_members(path):
    workbook = load_workbook(path, read_only=True, data_only=True)
    try:
        values = workbook["Membres"].values
        headings = next(values, ())
        missing = REQUIRED.difference(headings)
        if missing:
            raise ValueError("Colonnes manquantes : " + ", ".join(sorted(missing)))
        members = [
            {key: str(value).strip() if value is not None else "" for key, value in zip(headings, row)}
            for row in values if any(value is not None and str(value).strip() for value in row)
        ]
    finally:
        workbook.close()
    if not members:
        raise ValueError("La feuille Membres est vide.")
    ids = set()
    for row_number, member in enumerate(members, start=2):
        if any(not member[key] for key in ("id", "person_id", "name")) or member["id"] in ids:
            raise ValueError(f"Ligne {row_number} : id unique, person_id et name sont requis.")
        ids.add(member["id"])
        if member["status"] not in ("active", "alumni") or member["role"] not in ROLES:
            raise ValueError(f"Ligne {row_number} : status ou role invalide.")
        if any(member[key] not in ("", "yes", "no") for key in ("publish_country", "publish_email")):
            raise ValueError(f"Ligne {row_number} : publish_country et publish_email acceptent yes ou no.")
        code = member["country_code"].upper()
        if member["publish_country"] == "yes" and (not member["country"] or not re.fullmatch(r"[A-Z]{2}", code)):
            raise ValueError(f"Ligne {row_number} : pays et code ISO requis pour publier le pays.")
        member["country_code"] = code
        if member["publish_email"] == "yes" and not re.fullmatch(r"[^\s@?&#]+@[^\s@?&#]+", member["email"]):
            raise ValueError(f"Ligne {row_number} : courriel public invalide.")
        photo = PurePosixPath(member["photo"])
        if member["photo"] and (photo.parts[:2] != ("Images", "Team") or ".." in photo.parts
                                or "\\" in member["photo"] or not (ROOT / photo).is_file()):
            raise ValueError(f"Ligne {row_number} : photo introuvable dans Images/Team.")
        for key in ("linkedin", "expertise_en", "expertise_fr", "scholar", "website"):
            if member[key]:
                parts = urlsplit(member[key])
                if parts.scheme != "https" or not parts.hostname:
                    raise ValueError(f"Ligne {row_number} : URL HTTPS invalide dans {key}.")
    return members


def paragraph(value, css=""):
    attribute = f' class="{css}"' if css else ""
    return f"<p{attribute}>{escape(value)}</p>" if value else ""


def render_card(member, french, alumni):
    language = "fr" if french else "en"
    name = escape(member["name"])
    country = ""
    if member["publish_country"] == "yes":
        country = escape((member["country_fr"] if french else "") or member["country"])
    code = escape(member["country_code"]) if country else ""
    origin = f' data-person-id="{escape(member["person_id"])}" data-nationality="{country}" data-country-code="{code}"'
    role = ROLES[member["role"]][2 + french]
    photo = quote(member["photo"] or "Images/Team/user.webp")
    prefix = "../" if french else ""
    image = f'<img src="{prefix}{photo}" alt="" loading="lazy">'
    expertise = member[f"expertise_{language}"] or member["expertise_en"]
    email = "mailto:" + member["email"] if member["publish_email"] == "yes" else ""
    links = [
        (member["linkedin"], "LinkedIn", "fa-brands fa-linkedin-in"),
        (email, "Courriel" if french else "Email", "fa-solid fa-envelope"),
        (member["scholar"], "Google Scholar", "fa-solid fa-graduation-cap"),
        (member["website"], "Site web" if french else "Website", "fa-solid fa-globe"),
        (expertise, "Page d’expertise" if french else "Expertise page", "fa-solid fa-arrow-right"),
    ]
    link_markup = "".join(
        f'<a href="{escape(url)}" aria-label="{label}"><i class="{icon}" aria-hidden="true"></i></a>'
        for url, label, icon in links if url
    )
    project = member[f"project_{language}"]
    description = member[f"description_{language}"]
    theme = member[f"theme_{language}"]
    period = member[f"period_{language}"] or " – ".join(dict.fromkeys(filter(None, (member["start"], member["end"]))))
    supervision = paragraph(("Direction" if french else "Supervisor") + " — " + member["supervisor"]) if member["supervisor"] else ""
    cosupervision = paragraph(("Codirection" if french else "Co-supervisor") + " — " + member["cosupervisor"]) if member["cosupervisor"] else ""
    if alumni:
        category = "intern" if member["role"] == "intern" else "graduate" if member["role"] in ("msc", "phd") else "other"
        origin_label = f'<p class="former-student-origin">{country}</p>' if country else ""
        return (
            f'<article class="former-student-card" data-former-student data-former-category="{category}"{origin}>'
            f'<div class="former-student-info"><div class="former-student-socials">{link_markup}</div>'
            f'<h3>{name}</h3>{paragraph(role, "former-student-status")}{origin_label}'
            f'{paragraph(period)}{supervision}{cosupervision}{paragraph(theme)}{paragraph(project, "former-student-research")}'
            f'{paragraph(description, "former-student-research")}</div>{image}</article>'
        )
    flag = f'<span class="member-nationality">{country}</span>' if country else ""
    return (
        f'<article class="member-card"{origin}>{flag}{image}'
        f'<div class="member-body"><div class="member-head"><h3>{name}</h3>'
        f'<div class="member-socials">{link_markup}</div></div>'
        f'<div class="member-credentials">{paragraph(member["credential"])}'
        f'{paragraph(member[f"title_{language}"])}{supervision}{cosupervision}{paragraph(theme)}</div>'
        f'{paragraph(project, "member-expertise")}{paragraph(description, "member-expertise")}</div></article>'
    )


def render_team(members, french):
    lines = ['        <main>', '            <section class="section">', '                <div class="container">']
    active = [member for member in members if member["status"] == "active"]
    for role, labels in ROLES.items():
        cards = [render_card(member, french, False) for member in active if member["role"] == role]
        if cards:
            lines.extend([
                '                    <div class="team-category">',
                f'                        <h2>{labels[french]}</h2>',
                '                        <div class="member-grid">',
                *("                            " + card for card in cards),
                '                        </div>', '                    </div>',
            ])
    lines.extend([
        '                </div>', '            </section>', '            <section class="section alt">',
        '                <div class="container">', '                    <div class="section-header">',
        '                        <h2>Anciens membres</h2>' if french else '                        <h2>Former members</h2>',
        '                    </div>', '                    <div class="former-student-filters">',
    ])
    filters = {
        "all": ("All", "Tous"), "graduate": ("Graduates", "Diplômés"),
        "intern": ("Interns", "Stagiaires"), "other": ("Other roles", "Autres rôles"),
    }
    for key, labels in filters.items():
        active_class = " active" if key == "all" else ""
        lines.append(f'                        <button class="filter-btn{active_class}" type="button" data-former-filter="{key}">{labels[french]}</button>')
    lines.extend(['                    </div>', '                    <div class="former-student-grid">'])
    lines.extend(
        "                        " + render_card(member, french, True)
        for member in members if member["status"] == "alumni"
    )
    lines.extend(['                    </div>', '                </div>', '            </section>', '        </main>'])
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("workbook", type=Path)
    args = parser.parse_args()
    members = read_members(args.workbook)
    pages = {}
    for french, relative in enumerate(("team.html", "fr/team.html")):
        path = ROOT / relative
        content = path.read_text(encoding="utf-8")
        updated, count = re.subn(r"        <main>.*?</main>", lambda _: render_team(members, french), content, flags=re.S)
        if count != 1:
            raise ValueError(f"Une section <main> attendue dans {relative}.")
        pages[path] = updated
    for path, content in pages.items():
        path.write_text(content, encoding="utf-8")
    print(f"{len(members)} affiliations synchronisées.")


if __name__ == "__main__":
    main()
