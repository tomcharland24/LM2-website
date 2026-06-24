import csv
import json
from collections import OrderedDict

input_path = "Publication_Data/polypublie-export.csv"
output_path = "Publication_Data/publications.json"

# run in terminal : python Publication_Data\convert-publications.py

publications = OrderedDict()

with open(input_path, "r", encoding="utf-8-sig", newline="") as file:
    reader = csv.DictReader(file)

    for row in reader:
        pub_id = row.get("eprintid", "").strip()
        if not pub_id:
            continue

        if pub_id not in publications:
            date = row.get("date", "").strip()
            year = date[:4] if date else ""

            publications[pub_id] = {
                "id": pub_id,
                "title": row.get("title", "").strip(),
                "year": year,
                "date": date,
                "type": row.get("type", "").strip(),
                "articleType": row.get("article_type", "").strip(),
                "journal": row.get("publication", "").strip(),
                "publisher": row.get("publisher", "").strip(),
                "doi": row.get("id_number", "").strip(),
                "url": row.get("official_url", "").strip(),
                "abstractEn": row.get("abstract_en", "").strip(),
                "abstractFr": row.get("abstract_fr", "").strip(),
                "keywords": row.get("keywords", "").strip(),
                "researchCenter": row.get("rcenters", "").strip(),
                "authors": []
            }

        family = row.get("creators_name.family", "").strip()
        given = row.get("creators_name.given", "").strip()

        if family or given:
            author = f"{given} {family}".strip()
            if author and author not in publications[pub_id]["authors"]:
                publications[pub_id]["authors"].append(author)

data = list(publications.values())

with open(output_path, "w", encoding="utf-8") as file:
    json.dump(data, file, ensure_ascii=False, indent=2)

print(f"{len(data)} publications written to {output_path}")