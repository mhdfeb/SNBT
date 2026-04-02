# Experiment-Driven Product Decision Framework

Dokumen ini menjadi standar tim agar semua keputusan fitur didasarkan pada **hasil eksperimen**, bukan asumsi.

## 1) Event taxonomy produk

### Prinsip
- Semua event wajib punya: `event_name`, `user_id`, `session_id`, `timestamp`, `experiment_id`, `variant`, `platform`, `app_version`.
- Semua event harus bisa dihubungkan ke siklus belajar pengguna (mulai kuis → submit → remedial → selesai/terblokir → kembali hari berikutnya).

### Event inti

| Event | Trigger | Properti minimal | Tujuan analitik |
|---|---|---|---|
| `quiz_start` | Pengguna menekan tombol mulai kuis | `quiz_id`, `subject`, `difficulty_band`, `question_count` | Entry funnel & baseline engagement |
| `quiz_submit` | Pengguna submit jawaban | `quiz_id`, `score_raw`, `score_norm`, `correct_count`, `duration_sec`, `attempt_no` | Outcome kuis & score lift |
| `remedial_click` | Pengguna klik CTA remedial | `quiz_id`, `weak_topic`, `source_screen`, `attempt_no` | Niat perbaikan setelah gagal/kurang optimal |
| `completion_block` | Pengguna terhenti (time-out, paywall, validasi gagal, dst.) | `quiz_id`, `block_type`, `step`, `error_code` | Friksi utama yang menurunkan completion |
| `return_next_day` | Pengguna aktif lagi H+1 setelah aktivitas belajar | `prev_active_date`, `gap_days`, `activity_type` | Retensi D1 |

### Event turunan KPI
- `learning_milestone_reached`: untuk menghitung **time-to-mastery**.
- `session_end`: untuk normalisasi sesi dan quality check data.

### Naming & governance
- Gunakan `snake_case` untuk event/properti.
- Versikan schema: `event_schema_version` (mis. `v1`).
- Semua perubahan taxonomy harus backward-compatible minimal 1 release.

---

## 2) Kerangka A/B sederhana (UI + algoritma)

### Template eksperimen
Gunakan template ini sebelum eksperimen mulai:

```yaml
experiment_id: EXP-2026-UI-REM-01
owner: growth-pod
hypothesis: "Mengubah CTA remedial menjadi personal meningkatkan remedial CTR dan completion rate."
population: active_users_grade_12
variants:
  - control: existing_cta
  - treatment_a: personalized_cta
allocation:
  control: 50
  treatment_a: 50
primary_metric: completion_rate
guardrail_metrics:
  - d1_retention
  - average_duration_sec
  - crash_rate
minimum_sample_size: 2000
confidence_level: 0.95
mde: 0.03
run_window_days: 14
kill_switch_rules:
  - d1_retention_drop_gt: 0.02
  - crash_rate_increase_gt: 0.005
```

### Desain eksekusi
1. **Pre-register hipotesis & metrik** (hindari p-hacking).
2. Randomisasi stabil berbasis `user_id` hash.
3. Jalankan minimal 1 siklus mingguan (hindari bias hari).
4. Freeze perubahan lain di area yang sama selama run.
5. Evaluasi berdasarkan primary + guardrail metrics.

### Formula randomisasi yang disarankan
- `bucket = hash(user_id + experiment_id) % 100`
- `0-49 => control`, `50-99 => treatment_a`

---

## 3) KPI inti (definisi operasional)

| KPI | Definisi | Formula ringkas | Catatan |
|---|---|---|---|
| **D1 retention** | % pengguna aktif di hari H yang kembali aktif di H+1 | `retained_d1_users / active_users_day0` | Gunakan timezone produk konsisten |
| **D7 retention** | % pengguna aktif di hari H yang kembali dalam 7 hari | `retained_d7_users / active_users_day0` | Laporkan cohort harian |
| **Completion rate** | % kuis yang selesai dari yang dimulai | `quiz_submit / quiz_start` | Exclude sesi invalid/bot |
| **Time-to-mastery** | Waktu median dari quiz_start pertama sampai milestone mastery | `median(mastery_ts - first_quiz_start_ts)` | Segmentasi per topik |
| **Score lift** | Kenaikan skor treatment vs control | `(avg_score_treat - avg_score_ctrl) / avg_score_ctrl` | Laporkan absolute + relative lift |

### Guardrail wajib
- Crash/error rate
- Latency submit
- Drop-off step kritikal

---

## 4) Dashboard internal ringkas

### Layout 1 halaman (untuk weekly review)
1. **Header eksperimen:** `experiment_id`, status, owner, tanggal mulai/selesai.
2. **Primary KPI card:** completion rate control vs treatment + uplift + confidence.
3. **Retention panel:** D1 dan D7 per varian (line/column chart).
4. **Learning quality panel:** time-to-mastery & score lift.
5. **Funnel panel:** `quiz_start → quiz_submit → remedial_click` + breakdown `completion_block`.
6. **Guardrail panel:** error/crash/latency (warna merah bila melewati threshold).
7. **Decision box:** `Ship`, `Iterate`, atau `Rollback` dengan alasan data.

### Query dataset minimum (contoh)
- `fact_events` (append-only)
- `dim_users`
- `dim_experiments`

Contoh pseudo-SQL completion rate per varian:

```sql
SELECT
  experiment_id,
  variant,
  COUNTIF(event_name = 'quiz_submit') / NULLIF(COUNTIF(event_name = 'quiz_start'), 0) AS completion_rate
FROM fact_events
WHERE event_date BETWEEN @start_date AND @end_date
  AND experiment_id = @experiment_id
GROUP BY 1,2;
```

---

## 5) Rollout bertahap + kill-switch

### Tahapan rollout
1. **Stage 0 (Internal dogfood):** 1-5% trafik internal.
2. **Stage 1 (Canary):** 10% pengguna produksi.
3. **Stage 2 (Limited):** 25-50% pengguna.
4. **Stage 3 (General availability):** 100% jika semua KPI aman.

### Aturan kill-switch (otomatis)
Aktifkan rollback ke control jika salah satu kondisi terjadi selama window observasi 24 jam:
- D1 retention turun > **2 p.p.** dari control.
- Completion rate turun > **3 p.p.** dari baseline.
- Crash/error rate naik > **0.5 p.p.**.
- Time-to-mastery memburuk > **10%**.

### Protokol insiden
- Auto-alert ke channel tim produk + eng.
- Freeze eksperimen terkait.
- Tulis postmortem singkat (penyebab, dampak, mitigasi).

---

## Definition of Done (DoD)
Eksperimen dinyatakan selesai jika:
- Event taxonomy tervalidasi dan data completeness > 98%.
- Sample size minimum tercapai.
- Hasil lulus evaluasi primary metric + guardrail.
- Keputusan `Ship/Iterate/Rollback` didokumentasikan di dashboard.
