#!/usr/bin/env bash

RAW_KEYS=$(cat -- ../Terraform\ Logs\ Example/*.json | jq 'keys' | jq -r '.[]' | sort | uniq)

echo "type Log struct {"
while IFS= read -r line; do
    printf "\t%s string \`json:\"%s,omitempty\"\`\n" "$(tr '-' '_' <<<"${line^}" | sed -E 's/^@/At_/')" "$line"
done <<<"$RAW_KEYS"
echo "}"
