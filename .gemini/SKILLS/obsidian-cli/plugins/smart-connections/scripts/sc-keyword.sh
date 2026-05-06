#!/bin/bash
# Smart Connections — Keyword Search (fire-and-read pattern)
# Usage: bash sc-keyword.sh [vault=name] keyword1 keyword2 keyword3
# Defaults to vault "cybernati"

VAULT="cybernati"
if [[ "$1" == vault=* ]]; then
  VAULT="${1#vault=}"
  shift
fi

if [ $# -eq 0 ]; then echo "Usage: bash sc-keyword.sh [vault=name] keyword1 keyword2 ..."; exit 1; fi

# Build JSON array from args
KEYWORDS=$(printf '"%s",' "$@" | sed 's/,$//')

# Step 1: Fire
obsidian vault="$VAULT" eval code="window.__kw_test=app.plugins.plugins['smart-connections'].env.smart_sources.search({keywords:[${KEYWORDS}]}).then(r=>{window.__kw_result=r}).catch(e=>{window.__kw_err=e.message});'fired'" > /dev/null 2>&1

# Step 2: Wait
sleep 3

# Step 3: Read
obsidian vault="$VAULT" eval code="JSON.stringify(window.__kw_result?.slice(0,10)?.map(r=>({path:r.item?.path??r.path})))"
