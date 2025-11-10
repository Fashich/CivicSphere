import React from "react";
import BackButton from "@/components/BackButton";
import { useI18n } from "@/lib/i18n";

export default function Privacy() {
  const { t } = useI18n();
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <BackButton fallback="/" />
      </div>

      <h1 className="text-3xl font-bold mb-4">{t("privacy")}</h1>

      <section className="space-y-4 text-sm text-muted-foreground">
        <p>
          CivicSphere menghormati privasi Anda. Kebijakan ini menjelaskan data
          apa yang kami kumpulkan, bagaimana kami menggunakannya, dan pilihan
          yang Anda miliki.
        </p>

        <h2 className="font-bold">1. Data yang Kami Kumpulkan</h2>
        <p>
          Kami dapat mengumpulkan data yang Anda berikan secara langsung (misal
          nama, email, informasi profil), data penggunaan (misal aktivitas di
          platform), dan data teknis (misal alamat IP, jenis perangkat).
        </p>

        <h2 className="font-bold">2. Tujuan Penggunaan Data</h2>
        <p>
          Data digunakan untuk menyediakan dan meningkatkan layanan, melakukan
          komunikasi penting (misal notifikasi akun), serta untuk tujuan
          keamanan dan pencegahan penyalahgunaan.
        </p>

        <h2 className="font-bold">3. Berbagi dengan Pihak Ketiga</h2>
        <p>
          Kami tidak menjual data pribadi. Data dapat dibagikan dengan penyedia
          layanan pihak ketiga yang membantu operasional (misal hosting,
          analytics) dan hanya untuk tujuan yang diperlukan.
        </p>

        <h2 className="font-bold">4. Keamanan Data</h2>
        <p>
          Kami menerapkan langkah-langkah teknis dan organisasi untuk melindungi
          data Anda. Namun, tidak ada sistem yang sepenuhnya aman; harap waspada
          terhadap risiko siber.
        </p>

        <h2 className="font-bold">5. Hak Pengguna</h2>
        <p>
          Anda berhak mengakses, memperbaiki, atau meminta penghapusan data
          pribadi Anda sesuai ketentuan hukum yang berlaku. Untuk permintaan
          terkait data, hubungi tim kami melalui halaman Support.
        </p>

        <h2 className="font-bold">6. Perubahan Kebijakan</h2>
        <p>
          Kami dapat memperbarui kebijakan privasi ini. Perubahan akan diumumkan
          dan penggunaan layanan setelah perubahan berarti Anda menerima versi
          terbaru.
        </p>

        <h2 className="font-bold">7. Kontak</h2>
        <p>
          Untuk pertanyaan atau permintaan terkait privasi, silakan hubungi tim
          CivicSphere melalui halaman Support atau email yang tersedia di situs.
        </p>
      </section>
    </div>
  );
}
