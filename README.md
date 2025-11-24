# Menu Catalog API

REST API untuk manajemen menu catalog dengan Express.js dan SQLite.

## 📁 Struktur Folder

```
gdgoc/
├── src/
│   ├── config/          # Konfigurasi database dan environment
│   ├── controllers/     # Request handlers
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── middlewares/     # Custom middlewares
│   ├── utils/           # Helper functions
│   └── index.js         # Entry point aplikasi
├── .env                 # Environment variables
├── .env.example         # Template environment variables
├── database.sqlite      # SQLite database file (auto-generated)
└── package.json
```

## 🚀 Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Jalankan aplikasi:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📡 API Endpoints

Base URL: `http://localhost:3000/api`

### Menu Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/menu` | Buat menu baru |
| GET | `/menu` | List semua menu (dengan filter & pagination) |
| GET | `/menu/:id` | Dapatkan menu by ID |
| PUT | `/menu/:id` | Update menu (full update) |
| DELETE | `/menu/:id` | Hapus menu |
| DELETE | `/menu/all` | Hapus semua menu (⚠️ use with caution) |
| GET | `/menu/group-by-category` | Group menu by category |
| GET | `/menu/search` | Search menu |

### Query Parameters

#### GET /menu
- `q` - Search by name or description
- `category` - Filter by category
- `min_price` - Minimum price
- `max_price` - Maximum price
- `max_cal` - Maximum calories
- `page` - Page number (pagination)
- `per_page` - Items per page
- `sort` - Sort (format: `field:order`, contoh: `price:asc`)

#### GET /menu/group-by-category
- `mode` - `count` atau `list`
- `per_category` - Jumlah item per kategori (untuk mode list)

#### GET /menu/search
- `q` - Search query (required)
- `page` - Page number
- `per_page` - Items per page

## 📝 Contoh Request

### Create Menu
```bash
POST /api/menu
Content-Type: application/json

{
  "name": "Es Kopi Susu",
  "category": "drinks",
  "calories": 180,
  "price": 25000.00,
  "ingredients": ["coffee", "milk", "ice", "sugar"],
  "description": "Classic iced coffee with milk"
}
```

### List Menu with Filters
```bash
GET /api/menu?category=drinks&max_price=50000&page=1&per_page=10&sort=price:asc
```

### Update Menu
```bash
PUT /api/menu/1
Content-Type: application/json

{
  "name": "Es Kopi Susu Premium",
  "category": "drinks",
  "calories": 190,
  "price": 30000.00,
  "ingredients": ["coffee", "milk", "ice", "condensed_milk"],
  "description": "Premium recipe"
}
```

### Group By Category
```bash
# Count mode
GET /api/menu/group-by-category?mode=count

# List mode
GET /api/menu/group-by-category?mode=list&per_category=5
```

### Search Menu
```bash
GET /api/menu/search?q=kopi&page=1&per_page=10
```

## 🛠️ Tech Stack

- **Express.js** - Web framework
- **better-sqlite3** - SQLite database driver
- **dotenv** - Environment variables
- **cors** - CORS middleware
- **morgan** - HTTP request logger
- **nodemon** - Development auto-reload

## 📦 Database Schema

```sql
CREATE TABLE menu (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  calories INTEGER NOT NULL,
  price REAL NOT NULL,
  ingredients TEXT NOT NULL,
  description TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
)
```

## 🎯 Fitur

- ✅ CRUD operations lengkap
- ✅ Search & filtering
- ✅ Pagination
- ✅ Sorting
- ✅ Group by category
- ✅ Error handling
- ✅ Input validation
- ✅ Standardized response format
- ✅ SQLite database dengan better-sqlite3
- ✅ **ID Management System** - Auto-increment ID dengan pengecekan otomatis

### 🆔 ID Management System

Sistem manajemen ID yang memastikan:
- ID selalu berurutan mulai dari yang terakhir + 1
- Auto-reset ID ke 1 ketika semua data dihapus
- Tidak ada konflik atau duplikasi ID
- ID konsisten dan predictable

**Cara kerja:**
1. Setiap data baru akan mendapat ID = MAX(id_sebelumnya) + 1
2. Jika database kosong, ID dimulai dari 1
3. Saat menghapus item terakhir (database kosong), ID auto-reset
4. Saat menggunakan `DELETE /menu/all`, ID auto-reset

Untuk dokumentasi lengkap, lihat: [ID_MANAGEMENT.md](./ID_MANAGEMENT.md)

## 📄 License

ISC
