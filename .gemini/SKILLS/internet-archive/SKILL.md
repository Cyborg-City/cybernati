---
name: internet-archive
description: >
  Interact with Internet Archive (archive.org) - upload files, download items, and search the archive using the ia CLI tool. 
  Use when working with archive.org, archiving content, or retrieving historical data.
  Mandatory: All requests must use the --user-agent-suffix "Gemini-CLI/1.0.0 (Cybernati-Vault)".
---

# Internet Archive CLI Skill

This skill enables interaction with the Internet Archive (archive.org) using the `ia` command-line tool.

## Cybernati Mandatory Protocol

**User-Agent Identification**: All requests to the Internet Archive MUST include a proper User-Agent string. 
**Usage**: Append `--user-agent-suffix "Gemini-CLI/1.0.0 (Cybernati-Vault)"` to every `ia` command.

## Items

An item is the fundamental unit on archive.org. Each item has a unique identifier.

**Permanent URL patterns:**
- Details page: `https://archive.org/details/<identifier>`
- Download directory: `https://archive.org/download/<identifier>`

## Configuration

Check if `ia` is configured:
```bash
ia configure --whoami
```
If not configured, the user must run `ia configure`.

## Common Operations

### Search
```bash
ia search 'mediatype:movies AND subject:"declassified"' --itemlist
```

### Download
```bash
ia download <identifier> --destdir=./video_archive/
```

### Upload
```bash
ia upload <identifier> <file> --metadata="mediatype:movies" --metadata="title:Signal Analysis"
```

## Metadata Schema
Required: `identifier`, `mediatype`.
Recommended: `title`, `description`, `creator`, `date`, `subject`.

---
*Reference: https://archive.org/developers/internetarchive/cli.html*
