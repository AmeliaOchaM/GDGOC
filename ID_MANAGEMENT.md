# ID Management System

## Fitur Manajemen ID Otomatis

Sistem ini memastikan bahwa ID untuk data baru selalu terkelola dengan baik, terutama setelah penghapusan data.

### Fitur Utama:

#### 1. **Auto-increment ID dengan Pengecekan**
Setiap kali data baru ditambahkan, sistem akan:
- Mengecek ID maksimum yang ada di database
- Menambahkan 1 dari ID maksimum tersebut
- Jika database kosong, ID akan dimulai dari 1

```javascript
// Contoh internal logic:
static getNextId() {
  const stmt = db.prepare('SELECT MAX(id) as maxId FROM menu');
  const result = stmt.get();
  return result.maxId ? result.maxId + 1 : 1;
}
```

#### 2. **Auto-reset Sequence saat Database Kosong**
Ketika semua data dihapus, sistem akan otomatis mereset sequence ID ke 1.

**Skenario 1: Hapus per item**
- Jika menghapus item terakhir (database menjadi kosong), ID sequence akan direset
- Data baru berikutnya akan dimulai dari ID 1

**Skenario 2: Hapus semua data sekaligus**
- Menggunakan endpoint khusus untuk menghapus semua data
- ID sequence otomatis direset ke 1
- Data baru akan dimulai dari ID 1

#### 3. **Konsistensi ID**
- ID selalu berurutan dan tidak ada gap (kecuali ada penghapusan manual)
- Sistem mencegah konflik ID
- ID tidak akan pernah digunakan ulang kecuali database direset

## Penggunaan API

### Menghapus Satu Item
```bash
DELETE /api/menu/:id
```

**Perilaku:**
- Menghapus item dengan ID tertentu
- Jika item yang dihapus adalah item terakhir (database kosong), ID sequence direset
- Data baru berikutnya akan mulai dari ID 1

**Contoh:**
```bash
curl -X DELETE http://localhost:3000/api/menu/1
```

### Menghapus Semua Data
```bash
DELETE /api/menu/all
```

**Perilaku:**
- Menghapus SEMUA item di database
- Otomatis mereset ID sequence
- Data baru berikutnya akan mulai dari ID 1

**Contoh:**
```bash
curl -X DELETE http://localhost:3000/api/menu/all
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully deleted 10 menu items and reset ID sequence",
  "data": {
    "deleted_count": 10
  }
}
```

### Menambahkan Data Baru
```bash
POST /api/menu
```

**Perilaku:**
- ID baru = MAX(id sebelumnya) + 1
- Jika database kosong, ID = 1

**Contoh:**
```bash
curl -X POST http://localhost:3000/api/menu \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nasi Goreng",
    "category": "main-course",
    "calories": 500,
    "price": 25000,
    "ingredients": ["rice", "egg", "vegetables"],
    "description": "Delicious fried rice"
  }'
```

## Contoh Skenario

### Skenario 1: Database Kosong → Tambah Data
```
State awal: Database kosong
Action: POST /api/menu (data 1)
Result: ID = 1

Action: POST /api/menu (data 2)
Result: ID = 2

Action: POST /api/menu (data 3)
Result: ID = 3
```

### Skenario 2: Hapus Semua → Tambah Data Baru
```
State awal: Database memiliki data dengan ID 1, 2, 3, 5, 8
Action: DELETE /api/menu/all
Result: Database kosong, sequence direset

Action: POST /api/menu (data baru)
Result: ID = 1 ✅ (dimulai dari 1, bukan 9)

Action: POST /api/menu (data baru)
Result: ID = 2

Action: POST /api/menu (data baru)
Result: ID = 3
```

### Skenario 3: Hapus Item Satu per Satu
```
State awal: Database memiliki 3 item (ID: 1, 2, 3)
Action: DELETE /api/menu/1
Result: Tersisa ID 2, 3

Action: DELETE /api/menu/2
Result: Tersisa ID 3

Action: DELETE /api/menu/3
Result: Database kosong, sequence direset ✅

Action: POST /api/menu (data baru)
Result: ID = 1 ✅ (dimulai dari 1)
```

### Skenario 4: Data dengan Gap ID
```
State awal: Database memiliki data dengan ID 1, 2, 5, 7 (ada gap)
Action: POST /api/menu (data baru)
Result: ID = 8 (MAX(7) + 1, gap tetap ada)

Note: Gap terjadi karena ada penghapusan manual sebelumnya.
Jika ingin menghilangkan gap, gunakan DELETE /api/menu/all
```

## Keuntungan Sistem Ini

1. **Konsistensi**: ID selalu terkelola dengan baik
2. **Predictable**: Perilaku ID dapat diprediksi
3. **No Conflicts**: Tidak akan ada konflik ID
4. **Auto-reset**: Otomatis reset saat database kosong
5. **Safe**: ID tidak akan overflow atau duplicated

## Catatan Teknis

- Menggunakan SQLite AUTOINCREMENT
- Memanfaatkan table `sqlite_sequence` untuk tracking
- Reset dilakukan dengan `DELETE FROM sqlite_sequence WHERE name='menu'`
- ID selalu berupa INTEGER PRIMARY KEY AUTOINCREMENT

## Peringatan

⚠️ **DELETE /api/menu/all** akan menghapus SEMUA data secara permanen!
- Gunakan dengan hati-hati
- Tidak ada konfirmasi tambahan
- Data tidak dapat dikembalikan setelah dihapus
- Sebaiknya buat backup database sebelum menggunakan endpoint ini

## Testing

Untuk menguji fungsionalitas:

1. Tambahkan beberapa data
2. Hapus semua data dengan `DELETE /api/menu/all`
3. Tambahkan data baru
4. Verifikasi ID dimulai dari 1

```bash
# Tambah data
curl -X POST http://localhost:3000/api/menu -H "Content-Type: application/json" -d '{...}'

# Hapus semua
curl -X DELETE http://localhost:3000/api/menu/all

# Tambah data baru
curl -X POST http://localhost:3000/api/menu -H "Content-Type: application/json" -d '{...}'

# Cek ID (seharusnya 1)
curl http://localhost:3000/api/menu
```
