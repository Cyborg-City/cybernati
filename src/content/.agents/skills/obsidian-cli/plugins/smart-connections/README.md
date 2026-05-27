# Smart Connections Plugin

Semantic vector search and keyword search across the Obsidian vault via the Smart Connections v4 API.

## Prerequisites

- **Smart Connections v4.x** installed and indexed in Obsidian
- **Vault**: `lofi-monk` (path: `D:/openclaw/charlie/lofi-monk`)
- **Embedding model**: `TaylorAI/bge-micro-v2` (local, no API key needed)

## Scripts

All scripts are opaque tools — invoke them, don't read them.

| Script | Usage | Description |
|--------|-------|-------------|
| `sc-vector.sh` | `bash sc-vector.sh [vault=name] "your query" [k]` | Semantic vector search. Returns scored results at block-level precision. Default k=5, vault=cybernati. |
| `sc-keyword.sh` | `bash sc-keyword.sh [vault=name] word1 word2 word3` | Keyword search across file content. Fast, no embeddings. Default vault=cybernati. |
| `sc-status.sh` | `bash sc-status.sh [vault=name]` | Check if SC is loaded, source count, and model info. Default vault=cybernati. |

Scripts live in: `plugins/smart-connections/scripts/` (relative to the obsidian-cli skill root)

## Score Interpretation (vector search)

- **0.70+**: Strong match — directly relevant
- **0.50–0.69**: Useful context
- **< 0.30**: Tangential

## Gotchas

- `obsidian eval` does not await the Promise from `lookup()`. The `sc-vector.sh` script handles this with a fire-and-read pattern (two eval calls with a sleep).
- Keyword search produces warnings for non-text files — the script filters these out.
- Use escaped double quotes inside `code="..."` — single quotes break silently.
