# Menu Recommendations API

## Endpoint untuk Mendapatkan Rekomendasi Menu Personalized

Endpoint ini menggunakan AI (Gemini) untuk memberikan rekomendasi menu yang dipersonalisasi berdasarkan preferensi, pantangan, dan budget user. **Rekomendasi hanya akan memberikan menu yang sudah ada di database**.

---

## **POST** `/api/menu/recommendations`

### Request Body

```json
{
  "budget": 100000,
  "dietary_restrictions": ["vegetarian", "halal"],
  "dislikes": ["kopi", "pedas", "durian"],
  "preferences": ["manis", "coklat", "cheese"],
  "meal_type": "lunch",
  "cuisine": "Indonesian",
  "occasion": "casual dining",
  "additional_notes": "Saya ingin makanan yang mengenyangkan dan tidak terlalu berminyak"
}
```

### Parameter Explanation

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `budget` | number | ❌ | Budget maksimal dalam Rupiah |
| `dietary_restrictions` | array | ❌ | Batasan diet (contoh: "vegetarian", "vegan", "halal", "gluten-free", "lactose-free") |
| `dislikes` | array | ❌ | Makanan/minuman/bahan yang tidak disukai |
| `preferences` | array | ❌ | Makanan/minuman/rasa yang disukai |
| `meal_type` | string | ❌ | Jenis waktu makan ("breakfast", "lunch", "dinner", "snack") |
| `cuisine` | string | ❌ | Jenis masakan yang diinginkan (contoh: "Indonesian", "Japanese", "Italian") |
| `occasion` | string | ❌ | Acara/suasana makan (contoh: "casual dining", "formal dinner", "quick meal") |
| `additional_notes` | string | ❌ | Catatan tambahan atau permintaan khusus |

> **Note:** Minimal satu parameter harus diisi untuk mendapatkan rekomendasi.

### Response (Success - 200 OK)

```json
{
  "success": true,
  "message": "Menu recommendations generated successfully",
  "data": {
    "recommendations": {
      "main_course": {
        "id": 1,
        "name": "Nasi Goreng Spesial Sayuran",
        "category": "main-course",
        "description": "Nasi goreng dengan sayuran segar, telur, dan bumbu khas Indonesia tanpa pedas",
        "price": 35000,
        "calories": 450,
        "ingredients": ["nasi", "sayuran", "telur", "bawang", "kecap manis"],
        "reason": "Makanan ini cocok untuk vegetarian, mengenyangkan, dan tidak berminyak sesuai permintaan Anda"
      },
      "beverage": {
        "id": 15,
        "name": "Es Teh Manis",
        "category": "beverage",
        "description": "Teh manis dingin yang menyegarkan",
        "price": 8000,
        "calories": 120,
        "ingredients": ["teh", "gula", "es"],
        "reason": "Minuman manis yang Anda sukai dan cocok untuk menemani makan siang"
      },
      "dessert": {
        "id": 23,
        "name": "Cheese Cake Coklat",
        "category": "dessert",
        "description": "Kue keju lembut dengan lapisan coklat premium",
        "price": 45000,
        "calories": 380,
        "ingredients": ["cream cheese", "coklat", "biskuit", "gula"],
        "reason": "Menggabungkan kesukaan Anda pada cheese dan coklat, tekstur lembut dan manis"
      }
    },
    "total_price": 88000,
    "total_calories": 950,
    "summary": "Kombinasi menu ini dipilih khusus untuk Anda dengan total harga Rp 88.000 (di bawah budget). Semua item vegetarian, halal, dan menghindari kopi, pedas, dan durian. Menu ini mengenyangkan dengan kalori seimbang dan tidak berminyak sesuai permintaan Anda."
  }
}
```

### Response (Error - 400 Bad Request)

```json
{
  "success": false,
  "message": "Please provide your preferences for recommendations"
}
```

### Response (Error - 400 Bad Request - Insufficient Menu)

```json
{
  "success": false,
  "message": "Insufficient menu items in database. Please ensure there are items in all categories (main-course, beverage, dessert)"
}
```

---

## Contoh Penggunaan

### Contoh 1: User dengan Budget Terbatas dan Tidak Suka Kopi

```bash
curl -X POST http://localhost:3000/api/menu/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "budget": 50000,
    "dislikes": ["kopi", "alpukat"],
    "preferences": ["teh", "manis"],
    "meal_type": "breakfast"
  }'
```

### Contoh 2: User Vegetarian yang Suka Pedas

```bash
curl -X POST http://localhost:3000/api/menu/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "budget": 150000,
    "dietary_restrictions": ["vegetarian"],
    "preferences": ["pedas", "keju", "coklat"],
    "meal_type": "dinner",
    "occasion": "romantic dinner"
  }'
```

### Contoh 3: User dengan Alergi dan Preferensi Khusus

```bash
curl -X POST http://localhost:3000/api/menu/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "budget": 200000,
    "dietary_restrictions": ["gluten-free", "lactose-free"],
    "dislikes": ["seafood", "mushroom"],
    "preferences": ["ayam", "sayuran hijau", "buah-buahan"],
    "cuisine": "Western",
    "additional_notes": "Saya sedang diet rendah kalori, maksimal 1000 kalori untuk semua menu"
  }'
```

### Contoh 4: User Sederhana Tanpa Pantangan

```bash
curl -X POST http://localhost:3000/api/menu/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": ["nasi", "ayam goreng", "es teh manis", "pisang goreng"],
    "meal_type": "lunch"
  }'
```

---

## Tips Penggunaan

1. **Database First**: Sistem akan **HANYA** merekomendasikan menu yang sudah ada di database. Pastikan database Anda memiliki cukup menu di setiap kategori (main-course, beverage, dessert).

2. **Semakin Detail, Semakin Baik**: Berikan informasi sebanyak mungkin untuk mendapatkan rekomendasi yang lebih akurat dari menu yang tersedia.

3. **Budget**: Sistem akan mencoba memberikan kombinasi menu dari database yang sesuai atau di bawah budget yang ditentukan.

4. **Dietary Restrictions**: Sistem akan SANGAT KETAT menghindari menu yang mengandung bahan yang tercantum dalam dietary restrictions.

5. **Dislikes vs Dietary Restrictions**: 
   - `dislikes`: Hal yang tidak disukai (preferensi pribadi)
   - `dietary_restrictions`: Pantangan yang harus dihindari (alergi, agama, kesehatan)

6. **Kombinasi Menu**: Sistem akan memilih kombinasi menu dari database yang saling melengkapi dan cocok dimakan bersama.

7. **ID Menu**: Response akan menyertakan `id` dari setiap menu yang direkomendasikan, sehingga Anda bisa melakukan order atau operasi lanjutan.

---

## Error Handling

### 400 Bad Request
- Request body kosong atau tidak ada preferensi yang diberikan
- Database tidak memiliki cukup menu di setiap kategori yang diperlukan

### 500 Internal Server Error
- Gagal terhubung ke Gemini AI
- Error dalam pemrosesan data

---

## Notes

- Endpoint ini menggunakan **Gemini AI** untuk generate rekomendasi **dari menu yang ada di database**
- Response time mungkin memakan waktu 3-10 detik tergantung kompleksitas preferensi dan jumlah menu di database
- Setiap request akan menganalisis semua menu di database dan memilih kombinasi terbaik berdasarkan preferensi user
- Harga dan kalori yang diberikan adalah data aktual dari database
- Menu yang direkomendasikan dijamin ada di database dan bisa langsung di-order

## Prerequisites

Pastikan database Anda memiliki menu dengan kategori berikut:
- `main-course`: Makanan utama
- `beverage`: Minuman
- `dessert`: Makanan penutup

Minimal harus ada 1 item di setiap kategori agar sistem rekomendasi bisa bekerja.
