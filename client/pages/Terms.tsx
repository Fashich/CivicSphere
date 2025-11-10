import React from "react";
import BackButton from "@/components/BackButton";
import { useI18n } from "@/lib/i18n";

export default function Terms() {
  const { t } = useI18n();
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <BackButton fallback="/" />
      </div>

      <h1 className="text-3xl font-bold mb-4">{t("terms")}</h1>

      <section className="space-y-4 text-sm text-muted-foreground">
        <p>
          Selamat datang di CivicSphere. Dengan menggunakan layanan kami, Anda
          setuju untuk mematuhi syarat dan ketentuan berikut. Jika Anda tidak
          setuju, harap jangan gunakan platform ini.
        </p>

        <h2 className="font-bold">1. Penggunaan Layanan</h2>
        <p>
          Layanan ini disediakan untuk membantu koordinasi tindakan iklim dan
          kolaborasi komunitas. Anda setuju untuk tidak menggunakan layanan
          untuk tujuan ilegal, menyalahi hak orang lain, atau menyalahgunakan
          fitur yang tersedia.
        </p>

        <h2 className="font-bold">2. Akun dan Keamanan</h2>
        <p>
          Jika Anda membuat akun, Anda bertanggung jawab menjaga kerahasiaan
          informasi login dan semua aktivitas yang terjadi di bawah akun Anda.
          Laporkan segera jika terjadi akses tidak sah.
        </p>

        <h2 className="font-bold">3. Konten Pengguna</h2>
        <p>
          Pengguna bertanggung jawab atas konten yang mereka unggah. CivicSphere
          dapat menghapus konten yang melanggar kebijakan kami atau hukum yang
          berlaku.
        </p>

        <h2 className="font-bold">4. Kepemilikan dan Lisensi</h2>
        <p>
          Semua hak atas platform dan materi yang disediakan oleh CivicSphere
          tetap menjadi milik pemiliknya. Dengan mengunggah konten, Anda memberi
          CivicSphere lisensi non-eksklusif untuk menampilkan dan menyebarkan
          konten tersebut sesuai layanan.
        </p>

        <h2 className="font-bold">5. Pembatasan Tanggung Jawab</h2>
        <p>
          CivicSphere disediakan apa adanya. Kami tidak menjamin ketersediaan
          tanpa gangguan, akurasi konten pihak ketiga, atau hasil tertentu.
          Pertanggungjawaban kami dibatasi sejauh diizinkan oleh hukum.
        </p>

        <h2 className="font-bold">6. Perubahan Ketentuan</h2>
        <p>
          Kami dapat mengubah syarat ini dari waktu ke waktu. Perubahan akan
          diumumkan dan terus menggunakan layanan berarti Anda menerima
          perubahan tersebut.
        </p>

        <h2 className="font-bold">7. Hubungi Kami</h2>
        <p>
          Jika Anda memiliki pertanyaan terkait syarat dan ketentuan ini,
          silakan hubungi tim kami melalui halaman Support atau email yang
          tersedia di situs.
        </p>
      </section>
    </div>
  );
}
