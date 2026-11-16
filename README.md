# SITTA — Aplikasi Pemesanan Bahan Ajar UT (Vue.js 2)

Tugas Praktik 3 STSI4209. Refactor Tugas Praktik 2 menjadi aplikasi berbasis **Vue Component + template terpisah**, data dari `data/dataBahanAjar.json` (tanpa database, tanpa build tool).

## 1. Cara Menjalankan

Aplikasi memakai `fetch()` untuk JSON dan template, jadi **tidak bisa dibuka dengan `file://`**. Jalankan server statis dari folder ini:

```bash
cd tugas3-vue-ut
python3 -m http.server 8000
# buka http://localhost:8000
```

Alternatif: ekstensi **Live Server** di VS Code (“Open with Live Server”), atau `npx serve .`.

Koneksi internet diperlukan sekali untuk memuat Vue 2 dari CDN (`cdn.jsdelivr.net`).

## 2. Struktur Folder

```
tugas3-vue-ut/
├─ index.html                  # root #app + navigasi tab
├─ assets/css/style.css        # seluruh gaya
├─ assets/img/favicon.svg    # ikon tab browser
├─ data/dataBahanAjar.json     # data dummy (skema tidak diubah)
├─ js/
│  ├─ app.js                   # filter global + root instance + CRUD data
│  ├─ components/
│  │  ├─ status-badge.js       # <ba-status-badge>
│  │  ├─ app-modal.js          # <app-modal>
│  │  ├─ order-form.js         # <ba-order-form>
│  │  ├─ stock-table.js        # <ba-stock-table>
│  │  └─ do-tracking.js        # <ba-do-tracking>
│  └─ services/api.js          # fetch JSON + pemuat template
├─ templates/                  # <script type="text/x-template" id="tpl-...">
│  ├─ status-badge.html        # tpl-status-badge
│  ├─ app-modal.html           # tpl-modal
│  ├─ order-form.html          # tpl-order-form
│  ├─ stock-table.html         # tpl-stock
│  └─ do-tracking.html         # tpl-tracking
└─ README.md
```

## 3. Arsitektur & Keputusan Teknis

**Komponen global, bukan file `.vue`.** Semua komponen didaftarkan dengan `Vue.component('ba-...', { ... })` dan template-nya berupa `template: '#tpl-...'`. Ini syarat tugas: tanpa Webpack/Vite, cukup CDN Vue 2.

**Cara memuat template.** `<script type="text/x-template" src="templates/x.html">` tidak dipakai karena browser tidak mengunduh script bertipe non-JavaScript. `app.js` memuat semua template lewat `fetch()` (di `ApiService.loadTemplates`), menyisipkan `<script type="text/x-template">` ke `<body>`, lalu baru membuat root instance. Jadi template sudah ada di DOM sebelum komponen dirender. `api.js` juga memverifikasi setiap `id` template agar salah nama langsung terlihat di pesan error.

**Urutan script** (`index.html`): Vue CDN → `api.js` → komponen kecil ke besar (status-badge, app-modal, order-form, stock-table, do-tracking) → `app.js` paling akhir. Template dimuat oleh `app.js`, bukan oleh tag `<script src>`.

**State & komunikasi.** Root `app.js` memegang data (`stok`, `tracking`, daftar master) dan `tab`. Anak menerima data via props, mengirim aksi via `$emit`:

| Komponen | Props | Emits |
|---|---|---|
| `ba-stock-table` | `stok`, `upbjjList`, `kategoriList` | `create-stok`, `update-stok`, `delete-stok` |
| `ba-order-form` | `item` (null = tambah), `kategoriList`, `upbjjList` | `save`, `cancel` |
| `ba-status-badge` | `qty`, `safety` | — |
| `app-modal` | `show`, `title`, `confirmLabel`, `cancelLabel`, `danger` | `confirm`, `close` |
| `ba-do-tracking` | `tracking`, `paket`, `pengirimanList`, `nextNoDo` | `add-do`, `add-perjalanan` |

**Computed vs methods.** `filteredStok`, `sortedStok`, `kategoriOptions`, `hasilPencarian`, `selectedDO`, `perjalananUrut`, `paketDO`, `nextNoDO`, `jumlahReorder` adalah `computed` karena hasilnya diturunkan dari state dan dipakai berulang di template — Vue meng-cache hasilnya, bukan menghitung ulang tiap render. `methods` dipakai untuk aksi berparameter/berefek samping: `addStok`, `updateStok`, `deleteStok`, `addDO`, `addPerjalanan`, `searchDO`, `tambahPerjalanan`, `resetFilter`, `openModal`, `confirmDelete`, `showTooltip`. `statusStok(item)` sengaja method karena butuh argumen; logika status yang dipakai badge ada di `computed.status` pada `ba-status-badge`.

**Watcher (3, wajib minimal 2).**
1. `filterUpbjj` di `ba-stock-table`: reset `filterKategori` ke `"Semua"` saat UT-Daerah berubah, supaya dependent filter tidak menyisakan kategori yang tidak ada di daerah baru. Log ke console.
2. `selectedPaket` di `ba-do-tracking`: mengambil detail paket, mengisi daftar `isi` (kode MK), dan menyetel `total` dari `paket.harga` secara otomatis. Log ke console.
3. `tab` di root: log perpindahan halaman dan scroll ke atas. Tab memakai `v-show` supaya filter/pencarian tidak hilang saat pindah halaman.

**Filter kustom.** `currency` (`Rp 65.000`), `satuan` (`28 buah`), `tanggalID` (`25 Agustus 2025`), `tanggalWaktu` (`2025-08-25 10:12:20`). Semua didaftarkan global di `app.js`.

**Normalisasi data.** `tracking` di JSON berbentuk array objek berkunci nomor DO, diubah saat load menjadi `[{ noDO, ...detail }]`. JSON dummy memuat `DO2025-0001` **dua kali**; duplikat dibuang saat normalisasi (skema file JSON tidak diubah).

**Nomor DO.** Format sesuai tugas `DO{tahun}-{seq:03d}`, mis. `DO2026-001`. Data dummy memakai 4 digit (`DO2025-0001`), sehingga DO baru tampil beda panjang dari data lama — ini disengaja mengikuti format yang diminta. Nomor dijamin unik (loop jika sudah terpakai). Tahun mengikuti tahun berjalan.

**Pencarian DO.** Satu input untuk dua kriteria: teks dicocokkan (case-insensitive, *contains*) ke Nomor DO **dan** NIM. `Enter` mengunci kata kunci lalu memilih hasil pertama; `Esc` mengosongkan pencarian dan menampilkan semua DO. Bila hasil lebih dari satu, muncul daftar DO yang bisa diklik.

**Edit & delete stok.** Form yang sama dipakai untuk create/update; mode ditentukan prop `item` (`null` = tambah). Kode MK menjadi identitas baris, jadi kode duplikat ditolak dengan pesan error. Delete memakai `app-modal` dan baru jalan setelah “Ya, Hapus”.

**Tooltip catatan.** Kolom Status punya `@mouseenter`/`@mouseleave`. Catatan dirender dengan `v-html` pada elemen `position: fixed` yang mengikuti kursor, supaya tidak terpotong oleh `overflow` tabel. `v-show` dipakai untuk menampilkan/menyembunyikannya.

## 4. Peta Fitur ↔ Indikator Penilaian

| Indikator | Implementasi | Letak |
|---|---|---|
| 1.1 Component & Template (20) | 5 komponen global + template `x-template` di file terpisah; props/$emit; tab tanpa router | `js/components/*`, `templates/*`, root `index.html`/`app.js` |
| 1.2 Data binding, v-for, filter (10) | `{{ }}`, `v-text` (jumlah DO), `v-html` (catatan stok); `:class`, `:style`, `:disabled`; `v-model` semua form; `v-for` + `:key` (stok, paket, isi paket, perjalanan, upbjjList, kategoriList, pengirimanList); filter `currency`, `satuan`, `tanggalID`, `tanggalWaktu` | semua template, `app.js` |
| 1.3 Conditional (7) | `v-if/v-else-if/v-else` badge status; mode form create vs edit; dependent kategori; empty state tabel & DO; `v-show` tooltip, panel form, tab | `status-badge`, `stock-table`, `do-tracking`, `order-form` |
| 1.4 Computed & Methods (10) | `filteredStok`, `sortedStok`, `kategoriOptions`, `hasilPencarian`, `selectedDO`, `perjalananUrut`, `nextNoDO`, `jumlahReorder`, `status` badge; methods CRUD & pencarian | `stock-table.js`, `do-tracking.js`, `status-badge.js`, `app.js` |
| 1.5 Watchers (10) | `filterUpbjj` (reset kategori), `selectedPaket` (isi paket + total), `tab` (scroll & log) | `stock-table.js`, `do-tracking.js`, `app.js` |
| 1.6 Form, validasi, event (20) | Validasi kode/judul/kategori/upbjj + angka ≥ 0; validasi DO (NIM angka, nama, ekspedisi, paket); error reaktif `v-if`; `@click`; `@mouseenter/@mouseleave`; `@keyup.enter` (simpan stok, simpan DO, cari, tambah progress); `@keyup.esc` (reset pencarian) | `order-form`, `do-tracking`, `stock-table` |
| 1.7 UI/UX (8) | Card, shadow, radius, spacing konsisten; badge hijau/oranye/merah; hover baris; focus ring; empty state; toast feedback; responsif < 640px | `assets/css/style.css` |
| 1.8 Video (15) | README ini: cara run, arsitektur, peta fitur | `README.md` |

## 5. Fitur per Halaman

**Stok Bahan Ajar**
- Tabel: kode — judul, kategori, UT-Daerah, lokasi rak, harga (`Rp`), qty & safety (`buah`), badge status, aksi.
- Filter UT-Daerah + Kategori dependen, toggle “Hanya stok perlu re-order”, sort judul/qty/harga, reset filter.
- Tambah (panel form, `Enter` menyimpan), edit (data masuk form), hapus (modal konfirmasi).
- Status: `qty ≥ safety` → Aman; `0 < qty < safety` → Menipis; `qty = 0` → Kosong.
- Tooltip catatan HTML saat hover badge status.

**Tracking DO**
- Pencarian Nomor DO / NIM (`Enter` cari, `Esc` reset), daftar hasil bila lebih dari satu.
- Form DO baru: Nomor DO otomatis, NIM (angka), nama, ekspedisi (nama tampil, kode disimpan), paket (kode + nama, isi paket tampil setelah dipilih, total otomatis dari `paket.harga`), tanggal kirim (`25 Agustus 2025`).
- Detail DO + timeline riwayat perjalanan urut kronologis.
- Tambah progress perjalanan: waktu otomatis `YYYY-MM-DD HH:mm:ss` (waktu lokal).

## 6. Checklist Pengiriman

- [x] Struktur folder sesuai spesifikasi
- [x] 5 komponen terdaftar & dipakai (`ba-stock-table`, `ba-do-tracking`, `ba-order-form`, `ba-status-badge`, `app-modal`)
- [x] Stok: tabel, filter dependent, re-order, sort, reset, create, update, delete, badge, tooltip
- [x] Tracking: pencarian Enter/Esc, DO baru, nomor otomatis, detail paket, format tanggal & harga, tambah perjalanan
- [x] Filter kustom `currency`, `satuan`, `tanggalID`, `tanggalWaktu`
- [x] 3 watcher aktif & berdampak
- [x] Validasi form dengan pesan error reaktif
- [x] Event mouse & keyboard
- [x] README (cara run + arsitektur + peta fitur)
- [x] Tanpa error console saat dibuka via `http://localhost`
