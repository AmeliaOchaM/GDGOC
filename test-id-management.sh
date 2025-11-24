#!/bin/bash

# Test ID Management System
# This script tests the automatic ID management functionality

BASE_URL="http://localhost:3000/api"
COLORS=true

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Test ID Management System${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to print colored output
print_step() {
    echo -e "${YELLOW}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Test 1: Delete all existing data
print_step "1. Menghapus semua data yang ada..."
response=$(curl -s -X DELETE "$BASE_URL/menu/all")
echo "$response" | jq '.'
print_success "Data berhasil dihapus"
echo ""

# Test 2: Add first item (should get ID 1)
print_step "2. Menambahkan data pertama (seharusnya ID = 1)..."
response=$(curl -s -X POST "$BASE_URL/menu" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Menu 1",
    "category": "test",
    "calories": 100,
    "price": 10000,
    "ingredients": ["ingredient1"],
    "description": "Test menu 1"
  }')
id1=$(echo "$response" | jq -r '.data.id')
echo "$response" | jq '.'
if [ "$id1" == "1" ]; then
    print_success "✓ ID pertama = 1"
else
    print_error "✗ ID pertama = $id1 (seharusnya 1)"
fi
echo ""

# Test 3: Add second item (should get ID 2)
print_step "3. Menambahkan data kedua (seharusnya ID = 2)..."
response=$(curl -s -X POST "$BASE_URL/menu" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Menu 2",
    "category": "test",
    "calories": 200,
    "price": 20000,
    "ingredients": ["ingredient2"],
    "description": "Test menu 2"
  }')
id2=$(echo "$response" | jq -r '.data.id')
echo "$response" | jq '.'
if [ "$id2" == "2" ]; then
    print_success "✓ ID kedua = 2"
else
    print_error "✗ ID kedua = $id2 (seharusnya 2)"
fi
echo ""

# Test 4: Add third item (should get ID 3)
print_step "4. Menambahkan data ketiga (seharusnya ID = 3)..."
response=$(curl -s -X POST "$BASE_URL/menu" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Menu 3",
    "category": "test",
    "calories": 300,
    "price": 30000,
    "ingredients": ["ingredient3"],
    "description": "Test menu 3"
  }')
id3=$(echo "$response" | jq -r '.data.id')
echo "$response" | jq '.'
if [ "$id3" == "3" ]; then
    print_success "✓ ID ketiga = 3"
else
    print_error "✗ ID ketiga = $id3 (seharusnya 3)"
fi
echo ""

# Test 5: Show all data
print_step "5. Menampilkan semua data saat ini..."
response=$(curl -s "$BASE_URL/menu")
echo "$response" | jq '.data[] | {id, name}'
print_success "Data saat ini ditampilkan"
echo ""

# Test 6: Delete all data again
print_step "6. Menghapus semua data lagi..."
response=$(curl -s -X DELETE "$BASE_URL/menu/all")
echo "$response" | jq '.'
print_success "Semua data dihapus dan ID direset"
echo ""

# Test 7: Add new item after delete all (should get ID 1 again)
print_step "7. Menambahkan data baru setelah hapus semua (seharusnya ID = 1 lagi)..."
response=$(curl -s -X POST "$BASE_URL/menu" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Test Menu 1",
    "category": "test",
    "calories": 150,
    "price": 15000,
    "ingredients": ["new_ingredient1"],
    "description": "New test menu after reset"
  }')
new_id1=$(echo "$response" | jq -r '.data.id')
echo "$response" | jq '.'
if [ "$new_id1" == "1" ]; then
    print_success "✓ ID baru dimulai dari 1 setelah reset"
else
    print_error "✗ ID baru = $new_id1 (seharusnya 1)"
fi
echo ""

# Test 8: Add one more item
print_step "8. Menambahkan data lagi (seharusnya ID = 2)..."
response=$(curl -s -X POST "$BASE_URL/menu" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Test Menu 2",
    "category": "test",
    "calories": 250,
    "price": 25000,
    "ingredients": ["new_ingredient2"],
    "description": "New test menu 2"
  }')
new_id2=$(echo "$response" | jq -r '.data.id')
echo "$response" | jq '.'
if [ "$new_id2" == "2" ]; then
    print_success "✓ ID berikutnya = 2"
else
    print_error "✗ ID berikutnya = $new_id2 (seharusnya 2)"
fi
echo ""

# Final summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
print_info "Test 1: Delete all data - OK"
print_info "Test 2: First insert ID = $id1 (expected: 1)"
print_info "Test 3: Second insert ID = $id2 (expected: 2)"
print_info "Test 4: Third insert ID = $id3 (expected: 3)"
print_info "Test 5: Display all data - OK"
print_info "Test 6: Delete all data again - OK"
print_info "Test 7: New insert after reset ID = $new_id1 (expected: 1)"
print_info "Test 8: Next insert ID = $new_id2 (expected: 2)"

# Check if all tests passed
if [ "$id1" == "1" ] && [ "$id2" == "2" ] && [ "$id3" == "3" ] && [ "$new_id1" == "1" ] && [ "$new_id2" == "2" ]; then
    echo ""
    print_success "========================================="
    print_success "  SEMUA TEST BERHASIL! ✓"
    print_success "========================================="
else
    echo ""
    print_error "========================================="
    print_error "  BEBERAPA TEST GAGAL! ✗"
    print_error "========================================="
fi

echo ""
print_info "Test selesai. Data test masih ada di database."
print_info "Gunakan: curl -X DELETE $BASE_URL/menu/all untuk membersihkan."
