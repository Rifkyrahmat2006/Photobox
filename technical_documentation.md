
# 📸 Documentation: Web Photobox & Template Manager

## 1\. Project Overview

Website ini berfungsi sebagai *virtual photobooth*. User bisa mengambil foto (via webcam) atau upload foto, lalu memilih frame/template yang tersedia.
**Core Requirement:** Adanya dashboard admin untuk melakukan CRUD (Create, Read, Update, Delete) pada aset template, sehingga penambahan desain frame baru tidak perlu mengubah *source code*.

## 2\. Tech Stack Recommendation

Mengingat kamu familiar dengan Python dan SQL, berikut adalah rekomendasi stack yang *robust*:

  * **Frontend:** HTML5, CSS (Tailwind/Bootstrap), JavaScript (wajib untuk manipulasi Canvas).
      * *Library (Optional):* **Fabric.js** atau **Konva.js** (Sangat direkomendasikan untuk mempermudah fitur *drag-and-drop* foto ke dalam frame).
  * **Backend:** Python (Flask atau Django) atau Node.js.
      * *Reason:* Flask sangat ringan untuk handle routing dan API upload gambar.
  * **Database:** MySQL.
  * **Storage:** Local Folder (untuk development) atau Cloud Storage (AWS S3/Cloudinary) untuk production.

-----

## 3\. Database Design (Schema)

Kita butuh tabel yang fleksibel. Template bukan hanya gambar, tapi juga butuh data "posisi" (koordinat) di mana foto user akan ditempel.

[Image of database schema for image gallery system]

### Table: `templates`

| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | INT (PK) | Auto Increment ID. |
| `name` | VARCHAR(100) | Nama template (misal: "Polaroid Classic"). |
| `image_path` | VARCHAR(255) | Lokasi file frame (format PNG transparan). |
| `layout_type` | ENUM | 'single', 'strip\_3', 'grid\_4'. |
| `config_json` | JSON | **(Penting)** Menyimpan koordinat area foto. |
| `created_at` | TIMESTAMP | Waktu upload. |

> **Note tentang `config_json`:**
> Kolom ini krusial. Ini akan menyimpan data posisi `x`, `y`, `width`, dan `height` dimana foto user harus diletakkan di belakang frame.
>
> *Contoh isi JSON:*
>
> ```json
> {
>   "slots": [
>     {"x": 50, "y": 50, "width": 400, "height": 400},
>     {"x": 50, "y": 500, "width": 400, "height": 400}
>   ]
> }
> ```

-----

## 4\. Backend Architecture (API Endpoints)

Berikut adalah rancangan API untuk fitur CRUD Template.

### A. Create Template (Upload)

  * **Endpoint:** `POST /api/admin/templates`
  * **Input:**
      * `file`: File gambar frame (.png dengan area transparan).
      * `name`: String.
      * `coordinates`: JSON string (posisi slot foto).
  * **Process:**
    1.  Validasi ekstensi file (harus PNG).
    2.  Simpan file ke folder `public/uploads/frames/`.
    3.  Insert data path dan koordinat ke database MySQL.

### B. Read Templates (List)

  * **Endpoint:** `GET /api/templates`
  * **Process:** Query `SELECT * FROM templates`. Return JSON array agar Frontend bisa me-render daftar pilihan frame.

### C. Update Template

  * **Endpoint:** `PUT /api/admin/templates/<id>`
  * **Usage:** Misal ingin mengganti nama frame atau menggeser sedikit koordinat slot fotonya tanpa upload ulang gambar.

### D. Delete Template

  * **Endpoint:** `DELETE /api/admin/templates/<id>`
  * **Process:** Hapus row dari database **DAN** hapus file fisik dari folder server untuk menghemat storage.

-----

## 5\. Frontend Logic (The "Photobox" Engine)

Bagian ini adalah yang paling tricky. Bagaimana cara menggabungkan foto user dengan template yang di-upload via CRUD tadi?

### Langkah Kerja (Canvas Logic):

1.  **Fetch Data:** Frontend memanggil `GET /api/templates`.
2.  **Layering (Tumpukan Layer):**
      * **Layer Bawah (Background):** Canvas kosong atau warna solid.
      * **Layer Tengah (User Photos):** Foto dari webcam/upload user. Posisi `x, y` foto ini ditentukan oleh data `config_json` dari database tadi.
      * **Layer Atas (Overlay Frame):** Gambar Frame PNG yang di-load dari `image_path`.
3.  **Export:** Gunakan fungsi `canvas.toDataURL('image/png')` untuk menyatukan semua layer menjadi satu file gambar utuh yang bisa didownload user.

-----

## 6\. UI/UX Wireframe Plan

### Page 1: Admin Dashboard (CRUD)

  * Form Upload:
      * Input Nama.
      * Input File (Drag & drop zone).
      * **Feature Tool:** Buat *preview canvas* kecil di admin panel dimana admin bisa menggambar kotak (rectangle) di atas gambar frame yang diupload untuk menentukan koordinat `config_json` secara visual (daripada ngetik angka manual).
  * Table List Template (Ada tombol Edit & Delete).

### Page 2: Main Photobox (User)

  * **Left Sidebar:** Grid pilihan Template (hasil fetch dari DB).
  * **Center:** Area Kamera / Canvas Preview.
  * **Right/Bottom:** Tombol "Capture", "Retake", dan "Download".

-----

## 7\. Action Plan (Langkah Pengerjaan)

1.  **Setup Database:** Buat database MySQL dan tabel `templates`.
2.  **Backend Initialization:** Setup project (Flask/Express), koneksi DB, dan buat API endpoint dasar untuk upload file.
3.  **Testing API:** Gunakan **Postman** untuk tes upload gambar dan pastikan path-nya masuk ke DB.
4.  **Frontend Admin:** Buat halaman sederhana untuk admin upload template.
5.  **Frontend Canvas:** Implementasi HTML5 Canvas / Fabric.js untuk me-render frame dan foto user secara bertumpuk.
6.  **Integration:** Sambungkan pilihan template di frontend dengan data dari API.

\