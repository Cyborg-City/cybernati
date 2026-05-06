#!/bin/bash
# Smart Connections — Quick status check
# Usage: bash sc-status.sh [vault-name]
# Defaults to vault "cybernati"

VAULT="${1:-cybernati}"

obsidian vault="$VAULT" eval code="JSON.stringify({state:app.plugins.plugins['smart-connections']?.env?.state,sources:Object.keys(app.plugins.plugins['smart-connections']?.env?.smart_sources?.items??{}).length,model:app.plugins.plugins['smart-connections']?.env?.smart_settings?.settings?.smart_sources?.embed_model?.transformers?.model_key})"
