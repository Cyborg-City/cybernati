# PURSUE Internet Archive Project

> Presidential Unsealing and Reporting System for UAP Encounters
> Coordinated government-wide effort overseen by Department of War, with ODNI support.

**Project Root:** `src/content/_Internet-Archive/`

---

## Key Concepts

- **PURSUE** = Presidential Unsealing and Reporting System for UAP Encounters
- **IA item** = one collection on archive.org, has its own URL, player, metadata
- **Release** = one DOD drop, becomes multiple IA items (index, documents, video)
- **Upload config** = `*-upload.txt` file with item name + path, enables auto mode
- **cybernati.txt** = placeholder file to initialize IA items (deleted after upload)
- **Sorting** = agent sorts files after metadata confirmed, creates upload configs

---

## Architecture

**Structure:** By Release

```
DOD_releases/release_01/
├── Release_1/              # Source: mixed PDFs + still images
├── images/                  # Sorted: still images (NASA-VM*.jpg, FBI-Photo-A*.png)
├── documents/              # Sorted: all PDFs
├── video/                  # Sorted: videos (MP4)
├── images-upload.txt       # Config: item + path for index upload
├── documents-upload.txt    # Config: item + path for documents upload
└── video-upload.txt        # Config: item + path for video upload

_Internet-Archive/
├── cybernati.txt           # Reusable placeholder for IA item init
├── logs/                   # Upload logs
├── scripts/pursue-upload/
│   ├── pursue-upload.py   # Upload script (auto-detect config)
│   └── README.md
├── IA-RELEASE-01.md        # Release MOC
└── IA-ITEM-*.md            # Item notes

_AI/skills/PURSUE/
└── SKILL.md                # Skill for creating releases
```

---

## Item Structure (Release 01)

| IA Item | Mediatype | Contents |
|---------|-----------|----------|
| `pursue-release-01-index` | `image` | Still images (NASA-VM*.jpg, FBI-Photo-A*.png) |
| `pursue-release-01-documents` | `texts` | All PDFs |
| `pursue-release-01-video` | `movies` | MP4 videos |

**Thumbnails:** NASA-UAP-VM5-Apollo-12-1969.jpg for all items

---

## Local File Inventory

### Release 01 (`_Internet-Archive/DOD_releases/release_01/`)

| Path | Type | Count | Notes |
|------|------|-------|-------|
| `Release_1/` | PDFs | ~80 | Docs, mission reports, FBI, NASA, serials |
| `Release_1/` | Images | ~14 | NASA-VM1-6.jpg, FBI-Photo-A1-8.png |
| `uapvideos/` | MP4 | 27 | DOD_111688723.mp4 → DOD_111689759.mp4 |

### Release 02
- ZIP only — hold until release 01 processed

---

## Processing Workflow

1. **SIP Ingestion** → Drop raw release folder (zip already extracted)
2. **Gather info** → release #, thumbnail, confirm items
3. **Create notes** → IA-RELEASE-*.md MOC + IA-ITEM-*.md per item
4. **Initialize IA items** → `ia upload` with cybernati.txt + metadata
5. **Upload thumbnails** → set item thumbnails
6. **Sort files** → organize into images/, documents/, video/ subfolders
7. **Create configs** → `*-upload.txt` files
8. **Report** → give simple upload instructions
9. **User uploads** → `cd folder && python pursue-upload.py`
10. **Log** → Processing log in vault (`_Internet-Archive/logs/`)
11. **Delete** → Remove from disk after upload complete (keep zip backup)
12. **Cleanup** → Delete cybernati.txt placeholders from IA items

**Goal:** Space-efficient workflow. Source zip stays, processed files go.

---

## To-Do

- [ ] Delete existing `dod-aaro-uap-declassified-release-1` on IA (after all releases processed)
- [ ] Process release 01 — index (sort files, create config, user uploads)
- [ ] Process release 01 — documents (sort files, create config, user uploads)
- [ ] Process release 01 — video (sort files, create config, user uploads)
- [ ] Delete cybernati.txt placeholders from all IA items
- [ ] Delete local files after verified upload
- [ ] Process release 02

---

## Notes

- `Western_US_Event_Slides_5.08.2026.pdf` — filename suggests May 8, 2026 date; verify
- Upload script uses Python + tqdm + ia CLI (no secrets in code)
- Friends workflow: Clone repo → install ia cli → cd into folder → `python pursue-upload.py`
- **Important:** Use `ia upload` WITHOUT `--no-derive` — let IA generate OCR and derivatives
- Note naming: `IA-ITEM-<identifier>.md` (e.g., `IA-ITEM-pursue-release-01-documents.md`)
- Creator field stays with official DOD/AARO only — no legal risk
- `curated-by: Cybernati` as attribution field
- `call_number: DOW-UAP`
- **`contributor` uses `Cybernati` not `@cybernati`** (Obsidian frontmatter compatibility)
- Script auto-detects `*-upload.txt` config file in current directory