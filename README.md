# OEE Shift Leader & Section Head

1. Konteks Project

Ini adalah prototype clickable, frontend-only, dengan mock/dummy data (tidak perlu backend/API asli) dari dashboard OEE (Overall Equipment Effectiveness) untuk dua role di pabrik: Shift Leader (bertanggung jawab atas satu zona selama satu shift) dan Section Head (bertanggung jawab lintas zona/plant, termasuk evaluasi performa periodik). Tujuannya untuk review stakeholder/UAT sebelum development sungguhan, jadi:

Semua halaman harus benar-benar bisa diklik/dinavigasi (bukan gambar statis), dengan breadcrumb, tombol back, filter yang berfungsi, dan transisi antar state.

Semua komponen bersifat read-only — tidak ada input data oleh Shift Leader/Section Head di halaman manapun (input reason downtime/reject tetap tanggung jawab Operator di dashboard lain, di luar scope ini).

Data boleh 100% dummy/mock, tapi harus realistis dan bervariasi (jangan angka yang sama diulang-ulang di semua chart/level — lihat catatan di §5.3).


2. ATURAN PALING PENTING — cara menggabungkan mockup Before/After dengan dokumen teks

Ini bagian paling kritis, tolong benar-benar dipahami sebelum mulai membangun apapun:

Ketiga dokumen teks (2 Business Requirement + 1 URS/RNI) semuanya ditulis mengacu ke mockup Before. Sejak dokumen itu ditulis, desainnya sudah direvisi jadi mockup After — tapi dokumennya belum sempat diupdate. Jadi akan ada beberapa titik di mana teks dokumen dan mockup After tidak sinkron. Saya (pemilik project) sudah membandingkan keduanya secara detail; semua perbedaan yang saya temukan sudah didaftar di §4 dan §7 di bawah supaya kamu tidak perlu menebak-nebak sendiri dari gambar.

Urutan prioritas kalau ada konflik:

Visual & interaksi di mockup After — ini arah desain yang paling baru/disetujui. Ikuti tata letak, komponen, navigasi, dan copy yang ada di sana.

Teks BR/URS — dipakai untuk hal-hal yang TIDAK terlihat dari gambar statis After (karena After cuma kumpulan frame diam): logika filter, aturan cascading, empty/error state, aturan data yang lebih detail dari sekadar tampilan.

Mockup Before — hanya jadi referensi kalau ada bagian yang sama sekali tidak diubah di After (jarang terjadi); anggap sudah deprecated.

Kalau suatu komponen ada di After tapi behaviour detailnya tidak dijelaskan di teks maupun kelihatan dari gambar diam (misal: apa yang terjadi kalau di-klik), pakai pola interaksi yang paling mirip yang sudah dijelaskan di dokumen untuk komponen sejenis, lalu tandai sebagai asumsi (komentar kode singkat sudah cukup).


3. Ringkasan Perubahan Besar: Before → After

Supaya kamu langsung punya gambaran sebelum baca detail per halaman:

AreaBefore (sesuai dokumen)After (sesuai mockup terbaru)Hierarki navigasi Live MonitorShift Leader: langsung terkunci ke 1 Zone. Section Head: scope-nya "belum diputuskan" (open question).Ada hierarki drill-down baru dan lengkap: Multi Plant View → Plant View → Zone View → Line Detail → Machine Detail, dengan breadcrumb di setiap level. Ini kelihatannya menjawab open question tsb dengan opsi "switcher penuh", bukan sekadar terkunci.Halaman "Factory Floor Map" per zonaGrid kartu per Line (Line Card kiri = ringkasan, kanan = rantai mesin linear)Diganti jadi peta lantai pabrik isometrik ("Production Floor Map") dengan posisi line sesuai layout bay sungguhan, plus status Running/Slow/Down/Idle (4 state, sebelumnya cuma DOWN/RUNNING)Live Issue Log & Performance IssuesDua tabel terpisahDigabung jadi satu panel "Alarms" (kolom Line/Issue/Start/Duration/Status: OCCURRING atau Resolved) — sekarang muncul di level Plant View, bukan di level ZonePanel Detail MesinPanel inline yang muncul di bawah baris Machine Chain Card saat diklikJadi halaman tersendiri ("Machine Detail"), dibuka lewat "Open machine page →", dengan breadcrumb + tombol "‹ Back to {Line}"Isi panel "Machine Informations"Belum ditentukan (ditandai TBD di dokumen)Sudah ada contoh konkret di mockup: Temperature (Motor winding, Bearing, Gearbox oil), Pressure (Fill nozzle, Air supply), Drive & Throughput (Bottle current, Line speed, Cycle count, Reject count, Utilised)Panel "Current Stop" di Machine DetailTidak adaBaru: badge severity, fault, elapsed timer, loss category (path ke loss tree), downstream effect (mesin lain yang terdampak)Halaman OEE Analytics — ringkasan atas1 donut gauge "Average Zone OEE"Jadi 6 kartu: Average OEE (donut), Availability/Performance/Quality (masing-masing + mini sparkline), "Good output vs plan" (progress bar), "Biggest loss this week" (+ link "Open loss anatomy →")Panel "OEE Comparison"Tidak adaBaru: bandingkan 2 periode (mis. Week 32 vs Week 31), breakdown perubahan by OEE component & by LineOEE Waterfall + Loss TreeInline di halaman Analytics yang sama (Bagian C), langsung di atas Bagian DDipindah jadi halaman tersendiri, diakses lewat "Open loss anatomy →"Loss Tree — kedalaman expandCuma 1 level (mis. Breakdown → Machine Failure/Conveyor Jam/Power Outage)Bisa sampai 2-3 level (Breakdown → Bearing seizure/Conveyor Jam/Power Outage → Lubrication missed/Contamination)Toggle "By minutes / By occurrences"Ada di masing-masing chart Bagian DDipindah jadi toggle global di atas seluruh list Loss Tree, mempengaruhi urutan & nilai semua baris"Bagian D" (Root Cause Pareto + Rank by Machines per kategori loss)Inline di halaman yang sama, berubah sesuai item Loss Tree yang diklikJadi halaman tersendiri "Root Cause Pareto Chart", dengan pola drill Parent Issues → Child Issues Level 1 → Child Issues Level 2, berlaku untuk SEMUA kategori loss sekaligus (bukan per kategori)"Rank by Machines"Ada, jadi chart ke-2 di Bagian D untuk kategori Breakdown/Minor StopTidak terlihat di mockup After — lihat §7Chart khusus Reject / Speed Loss (Reject Over Time, Top Reject Reasons, Actual vs Standard PPM, Rank by SKU)Ada, spesifik per kategoriTidak dicontohkan di mockup After — lihat §7Filter Plant (Section Head)Didokumentasikan (single-select, di antara Resolution dan Zone)Tidak digambarkan di mockup After (mockup After yang ada cuma versi Shift Leader) — tetap pakai spesifikasi dari dokumen, tidak ada perubahan yang perlu diikuti di siniHalaman "Shift Performance" (khusus Section Head)Didokumentasikan lengkap di BR Section HeadTidak muncul di mockup After sama sekali, dan malah ditandai "Outside Scope" di URS — lihat §6


4. Spesifikasi per Halaman

4.1 Alur Live Monitor

4.1.1 Multi Plant View — halaman baru, entry point Section Head

Header: judul "Multi Plant View", breadcrumb "Kemas › Multi Plant", dropdown periode (pakai pola period-dropdown yang sama seperti di dokumen: Live/Last Shift/Today/Yesterday/This Week/Last Week), label Week + timestamp, theme toggle, avatar user.

Strip ringkasan: donut "Group OEE" + angka Avail/Perf/Qual, lalu satu kartu per plant (contoh: Jatake 1, Jatake 2, Jatake 4) masing-masing berisi donut kecil (OEE%) + progress bar A/P/Q.

Visual utama: peta isometrik 3D berupa gedung-gedung per plant, outline/warna sesuai tier OEE (merah/oranye/hijau — treat sebagai contoh, threshold pastinya belum final, lihat §7), label chip di atas tiap gedung (kode plant + OEE%). Kompas arah utara di pojok kanan atas (dekoratif saja).

Interaksi: klik gedung plant → navigasi ke Plant View plant tsb.

Data: buat 3-4 plant dummy dengan variasi OEE.

4.1.2 Plant View — drill-down dari Multi Plant, per plant

Breadcrumb: "Kemas › {Plant} › {Blok} · {Shift}" (contoh: "Kemas › J2 · Blok 7 · Shift 1"). Catatan: "Blok" ini istilah baru yang tidak dijelaskan di dokumen manapun — perlakukan sebagai label breadcrumb statis/dekoratif dulu (bukan filter fungsional), lihat §7.

Strip ringkasan: donut "Plant OEE" + A/P/Q, lalu satu kartu per Zone (Zone A/B/C) dengan pola kartu yang sama seperti Multi Plant View.

Panel kanan "Alarms": gabungan dari Live Issue Log + Performance Issues versi lama jadi satu tabel — kolom Line/Issue/Start/Duration/Status (Status: "OCCURRING" merah, atau "Resolved" abu-abu), dengan ringkasan di atas tabel ("{n} occurring · {n} resolved this shift"). Behaviour selebihnya (relasi real-time ke Line Detail, dsb.) ikuti logika Live Issue Log di dokumen (BR 1.2).

Visual utama: peta isometrik berupa deretan batang warna-warni per zona (bukan grid Line Card) — hijau=Running, oranye=Slow, merah=Down (ada legend di kiri bawah). Tiap zona punya label chip OEE%.

Interaksi: klik satu zona → navigasi ke Zone View.

Data: 3 zona per plant.

4.1.3 Zone View — ini yang paling dekat dengan "Live Monitor/Factory Floor Map" di dokumen; entry point / halaman "rumah" Shift Leader

Header: "Zone A", breadcrumb "Kemas › Zone A · Shift 1" (untuk Shift Leader yang langsung masuk sini, breadcrumb TIDAK perlu menyertakan Plant/Blok — beda dengan kalau diakses lewat drill-down dari Plant View oleh Section Head, di mana breadcrumb sebaiknya menyertakan Plant, mis. "Kemas › J2 › Zone A · Shift 1").

KPI strip (5 kartu): Zone OEE (+indikator "On target"/vs target), Availability, Performance, Quality (masing-masing ada delta vs rata-rata), dan "Lines Down" (contoh: "2 of 15", caption "1 slow · 1 idle"). Catatan konsistensi: di mockup label kartu ini kadang tertulis "LINES DOWN" kadang "LINES BREAKDOWN" untuk kartu yang sama — pilih SATU nama, rekomendasi pakai "LINES DOWN", dan pertahankan caption breakdown "n slow · n idle".

Visual utama "Production Floor Map": peta lantai pabrik isometrik literal (bukan grid card) — semua line (contoh: TUP01-TUP14, BLP02) diposisikan sesuai layout bay sungguhan, dengan caption "{n} lines · {n} machines · bays {baris} × {kolom} ({n} spare)". Tiap line = blok isometrik kecil + label chip (kode line + OEE% atau status), plus titik-titik kecil berwarna di area line tsb yang merepresentasikan status tiap mesin individual.

Legend kanan atas: Running (hijau) / Slow (oranye) / Down (merah) / Idle (abu-abu) — 4 state (di dokumen lama cuma 2: DOWN/RUNNING).

Interaksi: hover/klik sebuah line → popover card mengambang berisi: kode line + badge status, OEE%, Output (aktual/target), Machines (jumlah), fault aktif (kalau ada), chip ID tiap mesin, teks "Click to open line detail" → klik lagi/klik teks itu untuk masuk ke Line Detail.

Data: ~15 line dengan variasi status (mayoritas running, 1-2 down, 1-2 slow, beberapa idle), tiap line 2-4 mesin.

4.1.4 Line Detail — sebagian besar TIDAK berubah dari dokumen, hanya 1 perubahan interaksi besar

Pertahankan semua ini dari BR 1.4 (sama persis di Before & After secara visual):

Header + dropdown periode (Live/Last Shift/Today/Yesterday/This Week/Last Week, scope global ke seluruh halaman, Live=auto-refresh, historis=snapshot statis).

KPI Strip: Line OEE (+ vs zone avg), Performance, Output (+status pace "behind pace"), Running time, Status (DOWN/RUNNING + kode mesin penyebab).

Panel "Line Condition" (Current SKU, PO/Batch, Shift output, MPQ target ppm, Zone·Shift, Bottleneck).

Visual rantai mesin isometrik (snapshot statis, tidak clickable) dengan badge status line.

Panel "Active Alarms" (badge severity, kode line·mesin, jam, deskripsi fault; relasi real-time dengan Alarms di Plant View).

3 chart tren: OEE trend, Output trend (% cumulative, reset tiap ganti PO/batch), Line speed (dengan garis std/target).

Perubahan (ikuti After): Machine Chain Card di bagian bawah tetap clickable, tapi sekarang klik akan navigasi ke halaman Machine Detail terpisah lewat link "Open machine page →" (breadcrumb jadi "Zone A › TUP01 › LTF01"), BUKAN membuka panel inline di bawah baris seperti yang dijelaskan di teks dokumen. Implementasikan versi navigasi halaman ini, buang behaviour panel inline dari dokumen.

4.1.5 Machine Detail — halaman baru, dulunya panel inline

Breadcrumb "Zone A › TUP01 › LTF01" + tombol "‹ Back to TUP01", dropdown periode LIVE (pola sama).

KPI strip: Machine OEE, Availability, Performance, Quality, Status (Down + nama fault + elapsed).

Kiri: ilustrasi isometrik mesin 3D + nama & jenis mesin ("LTF01 · Tube Filler"), kartu kecil MTTR & MTBF, kartu "Stops this shift" (baru, hitungan jumlah stop).

Kanan atas: donut "Machine OEE" + 3 progress bar Availability/Performance/Quality (warna sesuai tier, sama seperti dokumen).

Kiri bawah "Machine Informations" — dokumen bilang list ini "belum ditentukan", tapi mockup After sudah kasih contoh konkret, pakai ini:

Temperature (°C): Motor winding, Bearing, Gearbox oil

Pressure (bar): Fill nozzle, Air supply

Drive & Throughput: Bottle current, Line speed, Cycle count, Reject count, Utilised

Nilai yang melewati ambang batas tampil merah (contoh: Bearing 52.3°C), nilai normal netral (aturan ini sudah ada di dokumen, konsisten).

Kanan bawah "Current Stop" (baru, tidak ada di dokumen lama): badge severity (contoh "CRITICAL") + kode line·mesin + jam mulai, deskripsi fault, "Elapsed" timer, "Loss category" (path ke loss tree, contoh "Breakdown · Bearing seizure · Lubrication missed"), "Downstream effect" (daftar kode mesin lain yang ikut terdampak).

4.2 Alur OEE Analytics — perubahan struktural paling besar

4.2.1 Halaman utama Analytics ("Shift Leader Dashboard" / "Section Head Dashboard")

Filter bar: Span, Resolution, Zone (multi-select), Line, SKU untuk Shift Leader; tambahkan filter Plant (single-select, posisi di antara Resolution dan Zone) untuk Section Head — semua logika cascading/reset/empty-state/max-span-1-bulan/auto-snap resolution ikuti dokumen BR 2.5 & URS 3.2.1 persis, ini tidak berubah di After, cuma gaya visualnya jadi pill/chip.

Strip ringkasan atas — desain baru, jadi 6 kartu: Average OEE (donut), Availability (angka + mini sparkline), Performance (angka + mini sparkline), Quality (angka + mini sparkline + panah delta), "Good output vs plan" (progress bar + caption "% attained · n short"), "Biggest loss this week" (nama kategori + durasi + link "Open loss anatomy →").

Chart "OEE Trend" — sama seperti "Zone OEE Trend" di dokumen (garis per zona + garis referensi putus-putus + tooltip breakdown OEE/A/P/Q saat hover titik). Tidak berubah.

Panel "OEE Comparison" (baru, kanan) — dua period-picker ("Compare: Week 32", "Against: Week 31"), angka besar before→after + chip delta, "By OEE Component" (delta Availability/Performance/Quality sebagai bar horizontal kecil, hijau=membaik/merah=memburuk), "By Line" (list delta per line dengan bar diverging kecil). Ini fitur baru tanpa acuan teks — gunakan pertimbangan terbaikmu untuk detail interaksi, anggap read-only, dan reuse pola Span-picker yang sudah ada untuk kedua dropdown periode ini.

Chart "OEE by Line" (bar chart, urut terendah→tertinggi) — sama seperti Bagian B di dokumen, termasuk dropdown "Select Line" (multi/single-select) + tombol Sort yang dijelaskan di teks (di frame After dropdown-nya tidak kelihatan tapi tetap harus ada sesuai dokumen).

Dihapus dari halaman ini (dipindah ke halaman terpisah, lihat 4.2.2 & 4.2.3): blok OEE Waterfall + Loss Tree + Bagian D yang dulu inline langsung di bawah.

4.2.2 Halaman "Loss Tree" (diakses lewat "Open loss anatomy →")

Filter bar sama seperti 4.2.1 (pilihan filter dibawa/persist saat pindah halaman).

Kiri "OEE Waterfall" — struktur identik BR 2.3.3 (Calendar Time → Scheduled Time → Gross Operating Time → Net Operating Time → Effective Time, dengan kategori Loading/Availability/Performance/Quality). 1 perubahan label: "Unutilized" → "Idle, no order". Label lain tetap sama (Unscheduled, Not Available, Planned Downtime, Breakdown, Setup, Minor Stop, Speed Loss, Reject, Rework, Effective Time). Ada label kecil di kanan atas card menunjukkan scope waterfall ini (contoh "BOP11 · Shift 2 · 05-Aug") — ambil dari filter Line/Span yang aktif.

Kanan "Loss Tree" — kategori sama seperti dokumen (Breakdown, Minor Stop, Setup, Speed Loss, Reject, Rework, Planned Downtime), tiap baris ada bar + durasi/jumlah + %. Catatan kecil: satu frame After menampilkan baris gabungan "Setup + Idle" — tampilkan sebagai satu baris gabungan di Loss Tree ini (meski di Waterfall sebelah kiri keduanya tetap terpisah; ini inkonsistensi kecil di sumber mockup, sudah ditandai di sini).

Toggle "By minutes / By occurrences" — di dokumen lama toggle ini ada di masing-masing chart Bagian D; di After dipindah jadi toggle global di atas seluruh list Loss Tree (mempengaruhi urutan & nilai semua baris sekaligus). Implementasikan sebagai toggle global per halaman ini.

Perubahan penting: kategori (terutama Breakdown) sekarang bisa expand sampai 2-3 level (Breakdown → Bearing seizure/Conveyor Jam/Power Outage → Bearing seizure diklik lagi → Lubrication missed/Contamination), lebih dalam dari dokumen yang cuma 1 level (Breakdown → Machine Failure/Conveyor Jam/Power Outage). Buat komponen tree yang generic/rekursif (2-3 level cukup), jangan di-hardcode cuma 1 level.

Klik salah satu baris Loss Tree sekarang navigasi ke halaman "Root Cause Pareto Chart" (4.2.3), bukan update konten inline di halaman yang sama seperti "Bagian D" di dokumen lama.

4.2.3 Halaman "Root Cause Pareto Chart" (halaman baru)

Breadcrumb: "Shift Leader Dashboard › Root Cause Pareto Chart" (atau "Section Head Dashboard › …").

Filter bar sama seperti halaman analytics lain (persist).

"Parent Issues" — satu Pareto chart (bar + garis kumulatif %) yang mencakup SEMUA kategori loss sekaligus (Breakdown, Minor Stop, Setup, Speed Loss, Reject, Rework) — beda dari "Bagian D" lama yang cuma tampil per satu kategori yang dipilih di Loss Tree. Ada toggle By Minutes/By Occurrences.

Klik satu bar (misal "Breakdown") → highlight bar itu, dan tampilkan "Child Issues Level 1" Pareto chart di bawah-kiri, scoped ke sub-penyebab kategori tsb.

Klik satu bar di Level 1 → tampilkan "Child Issues Level 2" Pareto chart di bawah-kanan, scoped lebih dalam lagi.

Empty state sebelum ada yang dipilih: pakai copy persis dari mockup — "Silahkan Pilih Child Issues Level 1" / "Silahkan Pilih Child Issues Level 2".

Data contoh di mockup After memakai angka yang SAMA PERSIS di semua level/kategori (artefak mockup) — di prototype, buat dataset dummy yang berbeda-beda per kategori & level supaya terlihat seperti data sungguhan (jangan copy pola "65/38/30/28" di semua tempat).

Ada beberapa hal yang tidak kelihatan di mockup After untuk halaman ini — lihat keputusan yang saya ambil di §7 poin 3 & 4.

4.3 Halaman khusus Section Head: "Shift Performance" — lihat §6, jangan langsung dikerjakan sebelum baca itu.


5. Aturan lintas-halaman yang TIDAK berubah (tetap ambil dari dokumen BR/URS apa adanya)

Read-only di semua komponen visual — rantai mesin cuma snapshot, Machine Chain Card/Loss Tree row cuma untuk navigasi, tidak ada input reason downtime/reject di halaman manapun.

Filter cascading: Plant me-reset pilihan Zone & Line (tapi tidak me-reset Span/Resolution/SKU); Zone membatasi opsi Line yang muncul; SKU tidak mengubah opsi yang tersedia, cuma menyaring/mengagregasi ulang data — termasuk kondisi valid di mana kombinasi filter membuat SELURUH halaman kosong sekaligus.

Kalau kombinasi filter (Line header vs dropdown "Select Line" di Bagian B, atau SKU yang tidak pernah diproduksi Line tsb) menghasilkan data kosong/konflik → tampilkan pesan eksplisit ("Tidak ada data untuk kombinasi filter ini"), jangan biarkan chart kosong tanpa keterangan.

Span maksimum 1 bulan; opsi Resolution otomatis dibatasi berdasarkan panjang Span (≤1 hari → sampai 15 menit; 2 hari-1 minggu → sampai 12 jam; 1 minggu-1 bulan → sampai 1 hari), dan kalau Span diubah sampai Resolution aktif jadi tidak valid, otomatis "snap" ke opsi tervalid terdekat yang lebih kasar (tanpa error).

Live = auto-refresh/real-time; opsi periode selain Live = snapshot statis, tidak auto-refresh.

Warna tier OEE (merah/oranye/hijau) dan ambang batas sensor "warning" (merah) bersifat contoh/config yang bisa diubah, bukan angka final — treat sebagai constant yang gampang diedit di satu tempat (jangan hardcode di banyak file).


6. Halaman "Shift Performance" (khusus Section Head) — perlu keputusan

Halaman ini (OPE by Shift Leader, Weekly Performance, Performance Leaders/Growth Focus, ranking Batch Count, Top/Bottom Operators — spesifikasi lengkap ada di BR Section Head bagian 3.1-3.8) punya 2 sinyal yang saling bertentangan:

BR Section Head men-spec-nya secara detail (satu-satunya sumber untuk halaman ini).

Dokumen URS gabungan justru menandainya "Outside Scope" untuk rilis ini, dan halaman ini tidak muncul sama sekali di mockup Before maupun After.

Rekomendasi: bangun halaman ini terakhir, sebagai halaman "bonus"/prioritas rendah, langsung dari spesifikasi teks BR Section Head 3.1-3.8 (karena itu satu-satunya sumber). Kalau waktu/budget terbatas, boleh dilewati dulu dan cukup disebut sebagai "coming soon" di navigasi Section Head. Jangan habiskan waktu polishing visualnya seperti halaman lain di atas.


7. Open Questions / Gap (gabungan dari URS + temuan baru dari perbandingan mockup)

Ini hal-hal yang belum final. Untuk prototype, ambil keputusan yang paling masuk akal (sudah saya kasih rekomendasi), tandai dengan komentar // TODO/confirm di kode, jangan sampai memblokir progress:

Scope akses Live Monitor Section Head — kelihatannya sudah terjawab oleh mockup After (hierarki Multi Plant → Plant → Zone penuh), tapi ini belum ditulis balik ke dokumen resmi. Rekomendasi: pakai hierarki penuh ini untuk Section Head.

Istilah "Blok" di breadcrumb Plant View (contoh "Kemas › J2 · Blok 7 · Shift 1") tidak dijelaskan di dokumen manapun. Rekomendasi: perlakukan sebagai teks breadcrumb statis dulu, bukan filter fungsional.

"Rank by Machines" (dulu ada sebagai chart ke-2 di Bagian D untuk kategori Breakdown & Minor Stop) tidak kelihatan di halaman Root Cause Pareto Chart versi After. Rekomendasi: tetap sediakan sebagai panel/card tambahan di halaman itu (mis. di samping atau di bawah chart Level 2) supaya informasinya tidak hilang, tapi ini murni tambahan dari saya, boleh dibuang kalau dianggap tidak perlu.

Chart spesifik untuk kategori Reject (Reject Over Time, Top Reject Reasons) dan Speed Loss (Actual vs Standard PPM, Rank by SKU) — ada di dokumen lama tapi tidak dicontohkan sama sekali di mockup After. Rekomendasi: default-nya pakai pola Pareto Parent→Level1→Level2 yang sama untuk semua kategori (termasuk Reject & Speed Loss) supaya konsisten, tapi buat komponennya modular supaya gampang diganti kalau nanti bisnis minta chart khusus untuk 2 kategori ini.

Label kartu KPI "LINES DOWN" vs "LINES BREAKDOWN" (nama beda untuk kartu yang sama di 2 frame After) — pakai "LINES DOWN".

Threshold warna tier OEE — contoh di dokumen (merah <38-52%, oranye ~65-70%, hijau ≥75%) tidak 100% konsisten dengan contoh angka di mockup After (mis. 77% ditampilkan oranye, bukan hijau). Threshold resmi memang belum ditetapkan tim produk. Rekomendasi: jadikan konstanta yang gampang diubah, jangan dianggap final.

List parameter sensor di "Machine Informations" — sudah ada contoh konkret di mockup After (lihat 4.1.5), tapi perlu dikonfirmasi apakah field-nya sama untuk semua jenis mesin atau beda-beda per jenis mesin (filler/wrapper/cartoner/case packer). Rekomendasi untuk prototype: pakai satu set field yang sama dulu untuk semua mesin, cukup untuk demo.

Formula agregasi "Average Zone OEE" saat multi-zona dipilih (rata-rata sederhana vs weighted) dan formula OEE level Plant — belum ditentukan secara resmi. Untuk prototype, pakai rata-rata sederhana saja, tidak perlu logika weighted yang rumit.

Default Plant untuk Section Head — belum diputuskan (dari profil user atau plant terakhir dipilih). Untuk prototype, hardcode salah satu plant dummy sebagai default.

Interaksi Weekly Performance (Shift Leader) di halaman Shift Performance — apakah ada tooltip 4 garis sekaligus dan bisa hide/show per shift lewat klik legend — belum diputuskan. Kalau halaman Shift Performance dikerjakan (lihat §6), sediakan saja tooltip + toggle legend, ini pola umum di chart library manapun.

Kategori "Non Shift" dan "Unmap" di chart "OPE by Shift Leader" (halaman Shift Performance) belum ada definisi final dari tim data — kalau halaman ini dikerjakan, cukup tampilkan sebagai 2 bar tambahan di ujung chart tanpa logika khusus.

Dataset untuk Minor Stop vs Breakdown di Root Cause Pareto sengaja disamakan di mockup (keterbatasan waktu bikin mockup) — wajib dibuatkan dataset independen/berbeda di prototype supaya tidak terlihat seperti bug data.

Formula "behind pace" di KPI Output (Line Detail) tidak dijelaskan detail — untuk prototype cukup pakai perbandingan linear sederhana (output aktual vs proyeksi linear dari target shift berdasarkan waktu yang sudah berjalan).


8. Panduan Data & Teknis

Stack yang disarankan: React + Tailwind (boleh + shadcn/ui) + library chart seperti Recharts untuk semua chart (bar, line, donut, waterfall, pareto); client-side routing untuk breadcrumb/drill-down (Multi Plant → Plant → Zone → Line → Machine, dan Analytics → Loss Tree → Pareto).

Mock data: generate di sisi frontend (JSON/array in-app), tidak perlu backend/API asli. Buat cukup variasi: beberapa plant, 3 zona per plant, ~10-15 line per zona, 2-5 mesin per line, angka OEE/PPM/output yang realistis dan tidak seragam, beberapa alarm aktif + resolved, dan dataset loss-tree multi-level yang berbeda per kategori (lihat §7 poin 12).

Visual language: ikuti gaya mockup After (tipografi, gaya card, warna tier, ilustrasi isometrik) sebagai design reference. Kalau ilustrasi isometrik 3D terlalu kompleks untuk dibuat presisi, versi 2D/SVG yang lebih sederhana tapi tetap membawa informasi yang sama (posisi, warna status, label) itu cukup untuk kebutuhan prototype clickable.

Role switcher: sediakan toggle sederhana di header (Shift Leader / Section Head) untuk keperluan demo, meskipun di produk aslinya role ditentukan dari login/SSO.

Urutan pengerjaan yang disarankan (biar tidak overwhelmed sekali jalan):

Layout shell + navigasi/breadcrumb + role switcher.

Alur Live Monitor lengkap: Multi Plant View → Plant View → Zone View → Line Detail → Machine Detail.

Alur Analytics lengkap: halaman utama → Loss Tree → Root Cause Pareto Chart.

Empty/conflict state, edge case dari §5.

(Opsional, prioritas rendah) Halaman Shift Performance — lihat §6.


9. Yang harus dihasilkan

Semua halaman di §4 sebagai route yang benar-benar bisa dinavigasi (bukan gambar statis), breadcrumb & tombol back yang berfungsi, filter yang benar-benar mem-filter data mock sesuai aturan di §5, dan data dummy yang variatif dan meyakinkan. Ini prototype untuk direview stakeholder, bukan build produksi — jadi utamakan kelengkapan alur & interaksi dibanding kesempurnaan pixel-perfect di setiap sudut.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b05867b5-9041-4146-af2a-db94aaf9c37a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
