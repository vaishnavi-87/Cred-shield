#!/bin/bash

set -e

FILE="USERS.md"

addresses=$(grep -oE 'mn_addr_preprod[a-z0-9]+' "$FILE" || true)

count=$(printf "%s\n" "$addresses" | grep -c '^mn_addr_preprod' || true)
duplicates=$(printf "%s\n" "$addresses" | sort | uniq -d | wc -l)

echo "CredShield Level 5 User Registry Validation"
echo "-------------------------------------------"
echo "Wallet addresses found: $count"

if [ "$count" -ne 50 ]; then
    echo "FAIL: Expected exactly 50 wallet addresses."
    exit 1
fi

if [ "$duplicates" -ne 0 ]; then
    echo "FAIL: Duplicate wallet addresses found."
    exit 1
fi

invalid=$(printf "%s\n" "$addresses" | grep -vc '^mn_addr_preprod' || true)

if [ "$invalid" -ne 0 ]; then
    echo "FAIL: Invalid Preprod wallet address found."
    exit 1
fi

echo "PASS: Exactly 50 unique Midnight Preprod addresses found."
