const RESULT_CONTENT = {
    transaction: {
        "PALSU (FRAUD) - Transaksi Mencurigakan": {
            kelas: "fraud",
            iconClass: "ti ti-alert-triangle",
            eyebrow: "Hasil Deteksi Transaksi",
            keterangan: "Transaksi ini terdeteksi berisiko tinggi. Terdapat kombinasi sinyal yang perlu dicek sebelum transaksi diproses lebih lanjut.",
            saran: [
                "Tahan transaksi dan lakukan verifikasi manual",
                "Hubungi pemilik akun untuk konfirmasi identitas",
                "Periksa negara kartu, AVS, CVV, dan 3D Secure",
                "Tinjau riwayat transaksi akun untuk pola tidak wajar",
            ],
        },
        "ASLI (NON-FRAUD) - Transaksi Aman": {
            kelas: "safe",
            iconClass: "ti ti-circle-check",
            eyebrow: "Hasil Deteksi Transaksi",
            keterangan: "Transaksi terlihat aman berdasarkan input yang diberikan. Sistem tidak menemukan sinyal risiko utama pada simulasi ini.",
            saran: [
                "Proses transaksi sesuai prosedur standar",
                "Tetap simpan log transaksi untuk audit",
                "Pantau akun secara berkala bila nominal mulai berubah drastis",
            ],
        },
    },
    stunting: {
        "Sangat Pendek": {
            kelas: "sangat-pendek",
            iconClass: "ti ti-alert-triangle",
            eyebrow: "Hasil Prediksi Stunting",
            keterangan: "Tinggi badan balita berada jauh di bawah perkiraan standar untuk usia dan jenis kelamin. Kondisi ini memerlukan perhatian segera.",
            saran: [
                "Segera konsultasi ke puskesmas, posyandu, atau dokter anak",
                "Diskusikan rencana makan bergizi tinggi dengan tenaga kesehatan",
                "Pantau berat dan tinggi badan secara rutin setiap bulan",
                "Pastikan kebersihan makanan, air minum, dan lingkungan",
            ],
        },
        "Pendek": {
            kelas: "pendek",
            iconClass: "ti ti-alert-circle",
            eyebrow: "Hasil Prediksi Stunting",
            keterangan: "Tinggi badan berada di bawah perkiraan normal. Perlu pemantauan dan perbaikan asupan gizi sejak dini.",
            saran: [
                "Rutin cek tumbuh kembang di posyandu",
                "Tingkatkan asupan protein, sayur, buah, dan makanan segar",
                "Pastikan imunisasi dan pemantauan kesehatan berjalan",
                "Konsultasikan pola makan bila pertumbuhan tidak membaik",
            ],
        },
        "Normal": {
            kelas: "normal",
            iconClass: "ti ti-circle-check",
            eyebrow: "Hasil Prediksi Stunting",
            keterangan: "Tinggi badan sesuai dengan rentang pertumbuhan normal untuk data yang dimasukkan.",
            saran: [
                "Pertahankan pola makan bergizi seimbang",
                "Tetap rutin pantau tumbuh kembang",
                "Pastikan anak cukup tidur, aktif bergerak, dan sehat",
            ],
        },
        "Tinggi": {
            kelas: "tinggi",
            iconClass: "ti ti-trending-up",
            eyebrow: "Hasil Prediksi Stunting",
            keterangan: "Tinggi badan berada di atas rata-rata perkiraan. Ini umumnya baik, namun tetap perlu dipantau agar proporsional.",
            saran: [
                "Pertahankan kebiasaan makan dan aktivitas yang baik",
                "Pantau berat badan agar tetap proporsional",
                "Lakukan pemeriksaan rutin bila ada perubahan tumbuh kembang yang tidak biasa",
            ],
        },
    },
};

const WHO_MEDIAN = {
    "laki-laki":  [49.9,54.7,58.4,61.4,63.9,65.9,67.6,69.2,70.6,72.0,73.3,74.5,75.7,76.9,78.0,79.1,80.2,81.2,82.3,83.2,84.2,85.1,86.0,86.9,87.8,88.7,89.6,90.4,91.2,92.1,93.0,93.8,94.6,95.4,96.2,97.0,97.8],
    "perempuan":  [49.1,53.7,57.1,59.8,62.1,64.0,65.7,67.3,68.7,70.1,71.5,72.8,74.0,75.2,76.4,77.5,78.6,79.7,80.7,81.7,82.7,83.7,84.6,85.5,86.4,87.4,88.3,89.1,90.0,90.8,91.7,92.5,93.3,94.1,94.9,95.7,96.5],
};

/* ─── Helpers ─── */
function setErr(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
}

function clearErrors(scope = document) {
    scope.querySelectorAll(".field-err").forEach(el => (el.textContent = ""));
    scope.querySelectorAll(".is-error").forEach(el => el.classList.remove("is-error"));
}

/* ─── Tool switch ─── */
function setActiveTool(tool) {
    // Switcher buttons — pakai data-target (struktur HTML baru)
    document.querySelectorAll(".switcher-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.target === tool);
    });
    // Panels — pakai id="panel-fraud" / id="panel-stunting"
    document.querySelectorAll(".tool-panel").forEach(panel => {
        panel.classList.toggle("active", panel.id === "panel-" + tool);
    });
    // Sembunyikan result card saat ganti tab
    const resultCard = document.getElementById("resultCard");
    if (resultCard) resultCard.style.display = "none";
}

function initToolSwitch() {
    document.querySelectorAll(".switcher-btn").forEach(btn => {
        btn.addEventListener("click", () => setActiveTool(btn.dataset.target));
    });
    // Set default aktif saat load
    setActiveTool("fraud");
}

/* ─── Radio cards ─── */
function initRadioCards() {
    document.querySelectorAll(".radio-card").forEach(card => {
        const input = card.querySelector("input[type='radio']");
        if (!input) return;

        // Tandai selected bila sudah checked (misal dari server-side render)
        if (input.checked) card.classList.add("selected");

        card.addEventListener("click", () => {
            // Hapus selected dari semua radio segroup
            document.querySelectorAll(`input[name="${input.name}"]`).forEach(inp => {
                inp.closest(".radio-card")?.classList.remove("selected");
            });
            card.classList.add("selected");
            input.checked = true;
        });
    });
}

/* ─── Validation ─── */
function requireNumber(formData, field, config) {
    const el = document.getElementById(field);
    const raw = formData.get(field);
    const num = parseFloat(raw);
    if (raw === "" || raw === null || Number.isNaN(num)) {
        setErr(config.errId, `${config.name} wajib diisi.`);
        el?.classList.add("is-error");
        return false;
    }
    if (num < config.min || num > config.max) {
        setErr(config.errId, `${config.name} harus antara ${config.min} – ${config.max}.`);
        el?.classList.add("is-error");
        return false;
    }
    return true;
}

function validateTransaction(formData) {
    let ok = true;
    const numFields = {
        account_age_days:        { min: 1,   max: 10000,   errId: "err-account-age",        name: "Umur Akun" },
        total_transactions_user: { min: 0,   max: 5000,    errId: "err-total-transactions", name: "Total Transaksi" },
        avg_amount_user:         { min: 0,   max: 1000000, errId: "err-avg-amount",         name: "Rata-rata Nominal" },
        amount:                  { min: 0,   max: 1000000, errId: "err-amount",             name: "Nominal Transaksi" },
        shipping_distance_km:    { min: 0,   max: 50000,   errId: "err-shipping",           name: "Jarak Pengiriman" },
    };
    Object.entries(numFields).forEach(([field, config]) => {
        if (!requireNumber(formData, field, config)) ok = false;
    });

    [
        ["country",           "err-country",     "Negara Pengguna"],
        ["bin_country",       "err-bin-country", "Negara Kartu"],
        ["merchant_category", "err-merchant",    "Kategori Toko"],
    ].forEach(([field, errId, name]) => {
        if (!formData.get(field)) {
            setErr(errId, `${name} wajib dipilih.`);
            document.getElementById(field)?.classList.add("is-error");
            ok = false;
        }
    });

    [
        ["channel",       "err-channel", "Channel"],
        ["promo_used",    "err-promo",   "Pakai Promo"],
        ["avs_match",     "err-avs",     "AVS Match"],
        ["cvv_result",    "err-cvv",     "Verifikasi CVV"],
        ["three_ds_flag", "err-3ds",     "3D Secure"],
    ].forEach(([field, errId, name]) => {
        if (!formData.get(field)) {
            setErr(errId, `${name} wajib dipilih.`);
            ok = false;
        }
    });

    return ok;
}

function validateStunting(formData) {
    let ok = true;
    if (!requireNumber(formData, "umur",   { min: 0,  max: 36,  errId: "err-umur",   name: "Umur"   })) ok = false;
    if (!requireNumber(formData, "tinggi", { min: 45, max: 110, errId: "err-tinggi", name: "Tinggi" })) ok = false;
    if (!formData.get("jenis_kelamin")) {
        setErr("err-gender", "Jenis kelamin wajib dipilih.");
        ok = false;
    }
    return ok;
}

/* ─── Simulation logic ─── */
function simulateTransaction(formData) {
    const securityScore = ["avs_match", "cvv_result", "three_ds_flag"]
        .reduce((total, key) => total + parseInt(formData.get(key), 10), 0);
    const amount          = parseFloat(formData.get("amount"));
    const avgAmount       = parseFloat(formData.get("avg_amount_user"));
    const distance        = parseFloat(formData.get("shipping_distance_km"));
    const countryMismatch = formData.get("country") !== formData.get("bin_country");
    const amountSuspicious = avgAmount > 0 && amount / avgAmount > 5;

    if (securityScore < 2 || amountSuspicious || (countryMismatch && distance > 1000)) {
        return "PALSU (FRAUD) - Transaksi Mencurigakan";
    }
    return "ASLI (NON-FRAUD) - Transaksi Aman";
}

function simulateStunting(formData) {
    const umur   = Math.round(parseFloat(formData.get("umur")));
    const gender = formData.get("jenis_kelamin");
    const tinggi = parseFloat(formData.get("tinggi"));
    const median = WHO_MEDIAN[gender]?.[umur] ?? 75;
    const diff   = ((tinggi - median) / median) * 100;

    if (diff < -10) return "Sangat Pendek";
    if (diff < -5)  return "Pendek";
    if (diff <= 10) return "Normal";
    return "Tinggi";
}

/* ─── Show result ─── */
function showResult(tool, key) {
    const data = RESULT_CONTENT[tool]?.[key];
    if (!data) return;

    const card      = document.getElementById("resultCard");
    const iconWrap  = document.getElementById("resultIconWrap");
    const eyebrowEl = document.getElementById("resultEyebrow");
    const statusEl  = document.getElementById("resultStatus");
    const keteEl    = document.getElementById("resultKeterangan");
    const saranEl   = document.getElementById("resultSaran");

    // Update kelas warna pada inner card
    const innerCard = document.getElementById("resultCardInner");
    if (innerCard) innerCard.className = `result-card ${data.kelas}`;

    // Icon (Tabler icon)
    iconWrap.innerHTML = `<i class="${data.iconClass}" aria-hidden="true"></i>`;

    eyebrowEl.textContent = data.eyebrow;
    statusEl.textContent  = key;
    keteEl.textContent    = data.keterangan;

    // Saran icon per kelas
    const saranIconClass = (data.kelas === "fraud" || data.kelas === "sangat-pendek")
        ? "ti ti-alert-triangle"
        : (data.kelas === "pendek" ? "ti ti-alert-circle" : "ti ti-circle-check");

    saranEl.innerHTML = "";
    data.saran.forEach(text => {
        const li   = document.createElement("li");
        li.innerHTML = `<i class="${saranIconClass}" aria-hidden="true"></i><span>${text}</span>`;
        saranEl.appendChild(li);
    });

    card.style.display = "block";
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/* ─── Button loading state ─── */
function setButtonLoading(button, isLoading) {
    button.classList.toggle("loading", isLoading);
    button.disabled = isLoading;
}

/* ─── Form init ─── */
function initForms() {
    const transactionForm = document.getElementById("transactionForm");
    const stuntingForm    = document.getElementById("stuntingForm");

    transactionForm?.addEventListener("submit", event => {
        event.preventDefault();
        clearErrors(transactionForm);
        const formData = new FormData(transactionForm);
        if (!validateTransaction(formData)) return;

        const button = document.getElementById("btnTransaction");
        setButtonLoading(button, true);
        setTimeout(() => {
            showResult("transaction", simulateTransaction(formData));
            setButtonLoading(button, false);
        }, 650);
    });

    stuntingForm?.addEventListener("submit", event => {
        event.preventDefault();
        clearErrors(stuntingForm);
        const formData = new FormData(stuntingForm);
        if (!validateStunting(formData)) return;

        const button = document.getElementById("btnStunting");
        setButtonLoading(button, true);
        setTimeout(() => {
            showResult("stunting", simulateStunting(formData));
            setButtonLoading(button, false);
        }, 650);
    });
}

/* ─── Boot ─── */
document.addEventListener("DOMContentLoaded", () => {
    initToolSwitch();
    initRadioCards();
    initForms();
});