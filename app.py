from flask import Flask, render_template, request
import joblib
import numpy as np
import pandas as pd


app = Flask(__name__)


def load_pickle(path):
    try:
        return joblib.load(path)
    except Exception as exc:
        print(f"Gagal memuat {path}: {exc}")
        return None


transaction_model = load_pickle("model_knn_transaction.pkl")
transaction_scaler = load_pickle("scaler_transaction.pkl") or load_pickle("scaler.pkl")
stunting_model = load_pickle("model_knn_stunting.pkl")
stunting_scaler = load_pickle("scaler_stunting.pkl")
encoding_maps = load_pickle("encoding_maps.pkl") or {
    "country": {"US": 1, "GB": 2, "FR": 3, "NL": 4, "TR": 5, "PL": 6, "RO": 7, "DE": 8, "ES": 9, "IT": 10},
    "bin_country": {"US": 1, "GB": 2, "FR": 3, "NL": 4, "TR": 5, "PL": 6, "RO": 7, "DE": 8, "ES": 9, "IT": 10},
    "channel": {"web": 1, "app": 2},
    "merchant_category": {"travel": 1, "fashion": 2, "electronics": 3, "grocery": 4, "gaming": 5},
}


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/predict/transaction", methods=["POST"])
def predict_transaction():
    try:
        if transaction_model is None or transaction_scaler is None:
            raise RuntimeError("Model transaksi atau scaler belum tersedia.")

        account_age_days = float(request.form["account_age_days"])
        total_transactions = float(request.form["total_transactions_user"])
        avg_amount = float(request.form["avg_amount_user"])
        amount = float(request.form["amount"])
        shipping_distance = float(request.form["shipping_distance_km"])

        country = request.form["country"].upper()
        bin_country = request.form["bin_country"].upper()
        channel = request.form["channel"].lower()
        merchant_category = request.form["merchant_category"].lower()

        promo_used = int(request.form["promo_used"])
        avs_match = int(request.form["avs_match"])
        cvv_result = int(request.form["cvv_result"])
        three_ds_flag = int(request.form["three_ds_flag"])

        data_transaksi = pd.DataFrame([[
            avg_amount,
            amount,
            total_transactions,
            account_age_days,
            encoding_maps["country"].get(country, 0),
            encoding_maps["bin_country"].get(bin_country, 0),
            encoding_maps["channel"].get(channel, 0),
            encoding_maps["merchant_category"].get(merchant_category, 0),
            promo_used,
            avs_match,
            cvv_result,
            three_ds_flag,
            shipping_distance,
        ]], columns=[
            "avg_amount_user",
            "amount",
            "total_transactions_user",
            "account_age_days",
            "country",
            "bin_country",
            "channel",
            "merchant_category",
            "promo_used",
            "avs_match",
            "cvv_result",
            "three_ds_flag",
            "shipping_distance_km",
        ])

        prediksi = transaction_model.predict(transaction_scaler.transform(data_transaksi))
        status_map = {
            0: "ASLI (NON-FRAUD) - Transaksi Aman",
            1: "PALSU (FRAUD) - Transaksi Mencurigakan",
        }
        hasil_teks = status_map.get(int(prediksi[0]), f"Kode Status: {int(prediksi[0])}")
        return render_template("index.html", prediction_text=f"Hasil Deteksi Transaksi: {hasil_teks}", active_tool="transaction")
    except Exception as exc:
        return render_template("index.html", prediction_text=f"Kesalahan Sistem Transaksi: {exc}", active_tool="transaction")


@app.route("/predict/stunting", methods=["POST"])
def predict_stunting():
    try:
        if stunting_model is None or stunting_scaler is None:
            raise RuntimeError("Model stunting atau scaler belum tersedia.")

        umur = float(request.form["umur"])
        jenis_kelamin = request.form["jenis_kelamin"]
        tinggi = float(request.form["tinggi"])
        jk = 1 if jenis_kelamin == "laki-laki" else 0

        fitur_raw = np.array([[umur, jk, tinggi]])
        prediksi = stunting_model.predict(stunting_scaler.transform(fitur_raw))
        status_map = {
            0: "Normal",
            1: "Sangat Pendek",
            2: "Pendek",
            3: "Tinggi",
        }
        hasil_teks = status_map.get(int(prediksi[0]), f"Kode: {int(prediksi[0])}")
        return render_template("index.html", prediction_text=f"Hasil Analisis Stunting: {hasil_teks}", active_tool="stunting")
    except Exception as exc:
        return render_template("index.html", prediction_text=f"Kesalahan Sistem Stunting: {exc}", active_tool="stunting")


if __name__ == "__main__":
    app.run(debug=True)
