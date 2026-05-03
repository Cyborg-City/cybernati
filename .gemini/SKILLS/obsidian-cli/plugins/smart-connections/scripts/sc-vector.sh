#!/bin/bash
# Smart Connections v4.x — Semantic Vector Search
# Two-step pattern: fire the lookup, wait, read the result.
#
# Usage: bash sc-vector.sh "your search query here"
# Requires: obsidian CLI, Smart Connections v4.x installed and indexed

QUERY="${1:?Usage: bash sc-vector.sh \"your search query\"}"
K="${2:-5}"

# Step 1: Fire the lookup (obsidian eval doesn't await this Promise)
obsidian vault=lofi-monk eval code="window.__sc_test=app.plugins.plugins[\"smart-connections\"].env.smart_sources.lookup({hypotheticals:[\"${QUERY}\"],k:${K}}).then(r=>{window.__sc_result=r;window.__sc_done=true}).catch(e=>{window.__sc_err=e.message;window.__sc_done=true});\"fired\"" > /dev/null

# Step 2: Wait for the embedding to compute
sleep 2

# Step 3: Read the results
obsidian vault=lofi-monk eval code="JSON.stringify(window.__sc_result?.map(r=>({score:r.score?.toFixed(4),path:r.item?.path})))"
