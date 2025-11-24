#!/bin/bash

# Script untuk memasukkan semua menu dari data.json ke API

API_URL="http://localhost:3000/api/menu"
DATA_FILE="data.json"

# Periksa apakah file data.json ada
if [ ! -f "$DATA_FILE" ]; then
    echo "Error: File $DATA_FILE tidak ditemukan!"
    exit 1
fi

# Counter untuk tracking
total=$(jq length "$DATA_FILE")
success=0
failed=0

echo "Memulai import $total menu items..."
echo "=================================="

# Loop setiap item dan kirim ke API
jq -c '.[]' "$DATA_FILE" | while read -r item; do
    name=$(echo "$item" | jq -r '.name')
    echo -n "Importing: $name... "
    
    response=$(curl -s -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "$item" \
        -w "\n%{http_code}")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "201" ]; then
        echo "✓ SUCCESS"
        ((success++))
    else
        echo "✗ FAILED (HTTP $http_code)"
        echo "  Response: $body"
        ((failed++))
    fi
done

echo "=================================="
echo "Import selesai!"
echo "Berhasil: $success"
echo "Gagal: $failed"
