---
name: pursue
description: >
  Create Internet Archive items for PURSUE (UAP) releases. Walks through a full release,
  creates a release MOC note, generates IA-ITEM notes for each media type, sorts files into
  organized folders, creates upload config/log files (*.md format), initializes IA items, uploads
  thumbnails, and provides upload instructions. Use after receiving a new PURSUE release dump.
triggers:
  - "create pursue release"
  - "new pursue release"
  - "set up pursue release"
  - "process pursue release"
allowed-tools: Bash, Read, Write, Edit
---

# PURSUE Release Creation Skill

## Overview

PURSUE = Presidential Unsealing and Reporting System for UAP Encounters

This skill creates IA items for PURSUE releases, setting up everything needed for the
bulletproof upload script to take over.

---

## File Locations

Source files for PURSUE releases (dumped by user):
```
src/content/_Internet-Archive/PURSUE_releases/release_{##}/
└── [various unzipped folders and files from DOD]
```

Processed output:
```
src/content/_Internet-Archive/PURSUE_releases/release_{##}/
├── images/              # Sorted still images (JPG, PNG, GIF)
├── documents/           # Sorted PDFs
├── video/               # Sorted videos (MP4, MOV)
└── audio/               # Sorted audio (MP3, WAV, etc.)
```

Scripts and configs:
```
src/content/_AI/skills/PURSUE/resources/
└── cybernati.md                     # Reusable placeholder for item init

src/content/_Internet-Archive/
├── scripts/Internet Archive CLI Bulk-Upload Script/
│   ├── bulk-upload.py               # Main upload script (interactive)
│   ├── vendor/                      # Bundled dependencies
│   └── README.md                    # Documentation
├── IA-RELEASE-{##}.md             # Release MOC
└── IA-ITEM-{identifier}.md         # Item notes
```

---

## Prerequisites

1. Internet Archive CLI installed (`pip install internetarchive`)
2. IA CLI configured (`ia configure`)
3. User has dumped release files into `_Internet-Archive/PURSUE_releases/release_{##}/`

---

## Item Structure

| Item | Mediatype | Contents |
|------|-----------|----------|
| `pursue-disclosure` | `texts` | **Evergreen master hub** — lists ALL releases. Created once, updated after every release. |
| `pursue-release-{##}` | `texts` | Landing page / portal linking to all sub-items |
| `pursue-release-{##}-images` | `image` | Still images (NASA-VM*.jpg, FBI-Photo-A*.png) |
| `pursue-release-{##}-documents` | `texts` | All PDFs |
| `pursue-release-{##}-video` | `movies` | MP4 videos |

---

## Workflow

### Session Hydration & Resumability Check (Start Here First!)

Before doing anything, search the `_Internet-Archive/` directory for any existing `IA-RELEASE-{##}.md` MOC notes or `IA-ITEM-*.md` item notes. 

- **If notes already exist for the release you are working on:**
  1. **Read them immediately** to hydrate your context (identifying the active release number, status, the target IA identifiers, and file structure).
  2. If the MOC status is `READY FOR UPLOAD` and the user reports that their local uploads are finished, **skip directly to Step 9 (Remove Placeholders), Step 10 (Cross-Link IA Items), and Step 11 (Update pursue-disclosure)**. Do not repeat the sorting or note creation steps!
- **If no notes exist:**
  1. Proceed normally starting with **Step 1 (Analyze & Sort)**.

### Step 1: Analyze & Sort Files by Type

Before exploring the unzipped files dumped in `release_{##}/`, you must follow this sequence:
1. Recursively list the files in the release directory.
2. Create subfolders for the detected media types (e.g., `documents/` for `.pdf`, `images/` for `.jpg` or `.png`, `video/` for `.mp4` or `.mov`, `audio/` for `.mp3` or `.wav`).
3. Move the files from their original dumped locations into these designated subfolders based on their extensions.
4. Clean up any empty folders left behind from the unzip process.

### Step 2: Gather Release Info

Once sorted, ask the user for:
1. **Release number** — e.g., `01`, `02`
2. **Release date** (optional) — defaults to current year
3. **Thumbnail** — path to thumbnail image (e.g., NASA-VM5-Apollo-12-1969.jpg)
4. **Items to create** — confirm which media types you sorted and will create IA items for.

### Step 3: Create Release MOC

Create `IA-RELEASE-{##}.md` in `_Internet-Archive/` as the master TOC.

### Step 4: Create IA-ITEM Notes

Create `IA-ITEM-{identifier}.md` for each media type.

**Automation Guideline for Notes & File Tables:**
When creating or updating `IA-ITEM` notes that list files (especially folders with more than 5 files, like videos or documents):
1. **Do NOT write the tables manually** to prevent typos, omissions, or formatting discrepancies.
2. **Do NOT run long, raw command-line loops** directly in the shell to avoid terminal length/quoting limits.
3. **Write and run a temporary script** (e.g. in Python or PowerShell) to programmatically scan the sorted directory, construct the YAML frontmatter, build the Markdown table with IA download links, and write out the `.md` note.
4. **Clean up immediately** by deleting the temporary script once the vault note is successfully generated.

In each vault note, you must add the following Rights section:

```markdown
## Rights

These materials are declassified U.S. Department of War records. In general, works prepared by U.S. Government employees as part of their official duties are not eligible for copyright protection in the United States. See [DVIDS Copyright Information](https://www.dvidshub.net/about/copyright) for full terms.

> **Non-endorsement disclaimer:** The appearance of U.S. Department of War visual information does not imply or constitute DoW endorsement.
```

You must also add a code block in each note containing the command the user needs to run to start the upload script for that item. This allows the user to click the "copy" button in Obsidian and run it easily. Do NOT run the python script yourself!

Example code block to put in the note:
````markdown
```bash
python "{Absolute path to bulk-upload.py}" pursue-release-{##}-{type} "{Absolute path to release folder}"
```
````
*(Replace {##} and {type} with the appropriate values. Note to Agent: The `bulk-upload.py` script is located at `_Internet-Archive/scripts/Internet Archive CLI Bulk-Upload Script/bulk-upload.py`. Resolve the absolute paths on the current filesystem before injecting them into the command above).*

### Step 5: Confirm All Items

Show the user the MOC note and ask for confirmation.

### Step 6: Initialize IA Items

Use `cybernati.md` as placeholder to initialize each item. Ensure you use the exact path to the placeholder file:
```bash
ia upload {identifier} "{Absolute path to cybernati.md}" --metadata="mediatype:{mediatype}" \
  --metadata="title:{title}" \
  --metadata="creator:U.S. Department of War / AARO" \
  --metadata="curated-by:Cybernati" \
  --metadata="contributor:Cybernati" \
  --metadata="subject:UAP; UFO; PURSUE; AARO; declassified; Cybernati" \
  --metadata="date:{date}" \
  --metadata="call_number:DOW-UAP" \
  --metadata="description:PURSUE Release {##} — {Type}. Department of War documents.<hr><h3>Rights</h3><p>These materials are declassified U.S. Department of War records. In general, works prepared by U.S. Government employees as part of their official duties are not eligible for copyright protection in the United States. See <a href='https://www.dvidshub.net/about/copyright'>DVIDS Copyright Information</a> for full terms.</p><p><i>Non-endorsement disclaimer: The appearance of U.S. Department of War visual information does not imply or constitute DoW endorsement.</i></p>"
```

### Step 7: Upload Thumbnails

Upload the selected thumbnail to each item:
```bash
ia upload {identifier} {thumbnail} --remote-name="{identifier}_itemimage.jpg"
```

### Step 8: Report

Update MOC with IA URLs and `READY FOR UPLOAD` status.

Tell the user they are ready to run the upload script. Explain that they can find the exact bash commands to run the script inside each of the `IA-ITEM` vault notes you created.

**CRITICAL INSTRUCTION:** Do NOT execute the `bulk-upload.py` script yourself. It is an interactive, long-running script with a terminal UI. You must leave this execution to the user.

**BOLD REMINDER:** You must explicitly instruct the user: "**Report back here when uploads are complete so I can link them together.**"

### Step 9: Remove Placeholder (After All Uploads Complete)

Once the user reports back that the uploads are complete, delete the placeholder file **only from the sub-items** (e.g., `-documents`, `-video`, `-images`):
```bash
ia delete pursue-release-{##}-{type} cybernati.md
```
*Note: Do **NOT** delete `cybernati.md` from the main portal item (`pursue-release-{##}`). Retaining it ensures the portal item has a file and remains publicly searchable on Archive.org.*

### Step 10: Cross-Link IA Items (After All Uploads Complete)

Once the placeholder is removed, run the following metadata commands to link the sub-items and the portal item together:

For each sub-item (e.g. `images`, `documents`, `video`):
```bash
ia metadata pursue-release-{##}-{type} --append="description:<br><br><b>Part of:</b> <a href='https://archive.org/details/pursue-release-{##}'>PURSUE Release {##}</a>"
```

For the main portal item (`pursue-release-{##}`):
```bash
ia metadata pursue-release-{##} --append="description:<br><br><h3>Media in this Release:</h3><ul><li><a href='https://archive.org/details/pursue-release-{##}-documents'>Documents</a></li><li><a href='https://archive.org/details/pursue-release-{##}-video'>Video</a></li><li><a href='https://archive.org/details/pursue-release-{##}-images'>Images</a></li></ul>"
```

### Step 11: Update pursue-disclosure Master Hub (After Every Release)

After completing all cross-linking, append a new release section to the `pursue-disclosure` description:

```bash
ia metadata pursue-disclosure --append="description:<br><hr><h3>&#128230; Release {##} — {date}</h3><table><tr><th>Item</th><th>Type</th><th>Contents</th></tr><tr><td><a href='https://archive.org/details/pursue-release-{##}'>Portal</a></td><td>texts</td><td>Release landing page</td></tr><tr><td><a href='https://archive.org/details/pursue-release-{##}-documents'>Documents</a></td><td>texts</td><td>{N} PDFs</td></tr><tr><td><a href='https://archive.org/details/pursue-release-{##}-video'>Video</a></td><td>movies</td><td>{N} MP4s</td></tr></table>"
```

Also append a `pursue-disclosure` backlink + sibling table to **all new sub-items** (use a script like `setup_pursue_disclosure.py` in the scratch directory as a template).

Finally, **update the vault note** `IA-ITEM-pursue-disclosure.md` to add the new release section to the markdown table.

---

## The Upload Script: bulk-upload.py

**Location:** `src/content/_Internet-Archive/scripts/Internet Archive CLI Bulk-Upload Script/bulk-upload.py`

### Overview

The bulk-upload script is a powerful, interactive terminal UI application that handles Internet Archive uploads gracefully.
It features bundled dependencies, meaning the user only needs to run `python bulk-upload.py`.

### Key Features
- **No Sibling Config Files:** Tracks uploaded files in a centralized SQLite database (`~/.config/internetarchive/upload_log.db`), eliminating the need to create `*-upload.md` log files in every folder.
- **Interactive Menu:** Colorful UI using `questionary` to select directories and identifiers.
- **Direct Execution:** Accepts command-line arguments to skip the interactive directory menus: `python bulk-upload.py [identifier] [path/to/files]`
- **Resumable:** Automatically skips already uploaded files based on the SQLite log.
- **Verification:** Automatically checks uploaded files against the Internet Archive via MD5.

### How it integrates into PURSUE
Because it accepts command-line arguments, you just need to generate the correct bash command for the user to copy-paste into their terminal. The script handles all the upload tracking behind the scenes!