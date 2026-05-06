#!/bin/bash
# Smart Connections v4.x — Semantic Vector Search
# Two-step pattern: fire the lookup, wait, read the result.
#
# Usage: bash sc-vector.sh [vault=name] "your search query here" [k]
# Defaults to vault "cybernati" and k=5
# Requires: obsidian CLI, Smart Connections v4.x installed and indexed

VAULT="cybernati"
if [[ "$1" == vault=* ]]; then
  VAULT="${1#vault=}"
  shift
fi

QUERY="${1:?Usage: bash sc-vector.sh [vault=name] \"your search query\" [k]}"
K="${2:-5}"

# Step 1: Fire the lookup (obsidian eval doesn't await this Promise)
obsidian vault="$VAULT" eval code="window.__sc_test=app.plugins.plugins['smart-connections'].env.smart_sources.lookup({hypotheticals:['${QUERY}'],k:${K}}).then(r=>{window.__sc_result=r;window.__sc_done=true}).catch(e=>{window.__sc_err=e.message;window.__sc_done=true});'fired'" > /dev/null

# Step 2: Wait for the embedding to compute
sleep 2

# Step 3: Read the results
obsidian vault="$VAULT" eval code="JSON.stringify(window.__sc_result?.map(r=>({score:r.score?.toFixed(4),path:r.item?.path})))"
