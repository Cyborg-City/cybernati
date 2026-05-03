#!/bin/bash
# Smart Connections — Quick status check
# Usage: bash sc-status.sh

obsidian vault=lofi-monk eval code="JSON.stringify({state:app.plugins.plugins[\"smart-connections\"]?.env?.state,sources:Object.keys(app.plugins.plugins[\"smart-connections\"]?.env?.smart_sources?.items??{}).length,model:app.plugins.plugins[\"smart-connections\"]?.env?.smart_settings?.settings?.smart_sources?.embed_model?.transformers?.model_key})"
