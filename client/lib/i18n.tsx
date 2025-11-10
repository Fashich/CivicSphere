import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Lang = "en" | "id";

const translations: Record<Lang, Record<string, string>> = {
  en: {
    getStarted: "Get Started",
    learnMore: "Learn More",
    heroSubtitle:
      "A Web4 platform for collaborative climate action powered by AI",
    signIn: "Sign In",
    myProfile: "My Profile",
    username: "Username",
    avatar: "Avatar",
    bio: "Bio",
    fillWithAI: "Fill with AI",
    clear: "Clear",
    portfolioURL: "Portfolio URL",
    linkedinURL: "LinkedIn URL",
    instagramURL: "Instagram URL",
    whatsapp: "WhatsApp",
    customLinks: "Custom Links",
    addLink: "+ Add Link",
    label: "Label",
    url: "URL",
    saveProfile: "Save Profile",
    cancel: "Cancel",
    dragImageHere: "Drag image here or click to select",
    supportedFormats: "PNG, JPG, GIF, WebP (max 5MB)",
    dragVideoHere: "Drag image or video here or click to select",
    supportedVideoFormats: "PNG, JPG, GIF, WebP, MP4, WebM (max 20MB)",
    uploadFailed: "Upload failed",
    uploadSuccess: "Avatar uploaded successfully",
    profileSaved: "Profile saved",
    profileSavedDesc: "Your profile changes have been saved",
    invalidPortfolioURL: "Portfolio URL is not valid",
    invalidLinkedinURL: "LinkedIn URL is not valid",
    invalidInstagramURL: "Instagram URL is not valid",

    // Landing page
    featuresTitle: "Key Features",
    featureVisualizationTitle: "3D Visualization",
    featureVisualizationDesc:
      "Monitor global climate actions with an interactive 3D earth",
    featureCommunityTitle: "Collaborative Communities",
    featureCommunityDesc:
      "Join local communities to take climate action together",
    featureAITitle: "AI Analysis",
    featureAIDesc: "Get smart recommendations from an adaptive AI system",
    featureTransparencyTitle: "Data Transparency",
    featureTransparencyDesc:
      "Blockchain verification for measurable climate transparency",
    howItWorksTitle: "How It Works",
    step1Title: "Sign Up & Join",
    step1Desc:
      "Create an account and join climate action communities in your area",
    step2Title: "Report Activities",
    step2Desc:
      "Log every climate action via interactive forms with real-time visuals",
    step3Title: "Get Insights",
    step3Desc:
      "Receive AI analysis and recommendations to maximize your impact",
    ctaTitle: "Ready to Make a Difference?",
    ctaSubtitle: "Join thousands already contributing to global climate action",
    ctaButton: "Start Free Now",
    footerProduct: "Product",
    aboutUs: "About Us",
    featuresLink: "Features",
    communityTitle: "Community",
    join: "Join",
    joinCommunity: "Join",
    requestToJoin: "Request to Join",
    closed: "Closed",
    leave: "Leave Community",
    blog: "Blog",
    legal: "Legal",
    privacy: "Privacy",
    terms: "Terms",
    footerCopyright: "All rights reserved.",

    // Auth
    loginTitle: "Sign In",
    loginSubtitle: "Welcome back to CivicSphere",
    email: "Email",
    password: "Password",
    processing: "Processing...",
    loginSubmit: "Sign In",
    signupPrompt: "Don't have an account?",
    signupLink: "Create one",

    signupTitle: "Join Us",
    signupSubtitle: "Start your climate action today",
    signupSubmit: "Sign Up",
    signupSuccess:
      "Account created! Check your email to verify. Redirecting to login...",
    hasAccount: "Already have an account?",
    loginHere: "Log in here",
    usernameLabel: "Username",

    // Dashboard
    welcome: "Welcome",
    dashboardSubtitle:
      "Explore and manage global climate actions from a single dashboard",
    actionsLabel: "Climate Actions",
    communitiesLabel: "Communities",
    projectsLabel: "Projects",
    analyticsLabel: "Analytics",
    viewTrends: "View Trends",

    // Dashboard (extended)
    "dashboard.featuresTitle": "Key Features",
    "dashboard.featuresDesc":
      "Manage climate actions and collaborate with global communities",
    "dashboard.feature.map.title": "Global Interactive Map",
    "dashboard.feature.map.desc":
      "Visualize climate actions worldwide with interactive maps, clustering, and real-time filters",
    "dashboard.feature.map.cta": "Explore Map",
    "dashboard.feature.community.title": "Community Management",
    "dashboard.feature.community.desc":
      "Manage members, roles, and contributions centrally for effective collaboration",
    "dashboard.feature.community.cta": "Manage Communities",
    "dashboard.feature.chat.title": "Collaborative Chat",
    "dashboard.feature.chat.desc":
      "Real-time communication for discussions and project coordination",
    "dashboard.feature.chat.cta": "Start Chatting",
    "dashboard.feature.projects.title": "Project Tracking",
    "dashboard.feature.projects.desc":
      "Track project status, CO2 targets, and progress with an easy dashboard",
    "dashboard.feature.projects.cta": "View Projects",
    "dashboard.feature.analytics.title": "Comprehensive 3D Analytics",
    "dashboard.feature.analytics.desc":
      "Dashboards with 3D visualizations, time trends, regional comparisons, and impact metrics",
    "dashboard.feature.analytics.cta": "View Reports",
    "dashboard.feature.collab.title": "Global Collaboration",
    "dashboard.feature.collab.desc":
      "Connect with communities worldwide to collaborate on climate action",
    "dashboard.feature.collab.cta": "Explore Communities",
    "dashboard.demo.title": "Get Started with Demo Data",
    "dashboard.demo.desc":
      "Seed the database with sample communities and climate actions to explore all features.",
    "dashboard.demo.cta": "Seed Demo Data",

    // Pages
    communitiesTitle: "Climate Action Communities",
    communitiesSubtitle: "Explore climate action communities around the world",

    projectsTitle: "Project Management",
    projectsSubtitle: "Manage and monitor your community's climate projects",

    reportsTitle: "Analytics Reports",
    reportsSubtitle: "Monitor impact and trends of climate actions",

    // Common/UI
    listView: "List View",
    mapView: "Map View",
    newCommunity: "New Community",
    searchCommunitiesPlaceholder: "Search communities...",
    sortRecent: "Most Recent",
    sortMembers: "Most Members",
    sortName: "Name A-Z",
    members: "members",
    creating: "Creating...",

    // Communities
    loadingCommunities: "Loading communities...",
    noCommunitiesTitle: "No communities found",
    noCommunitiesDesc: "Try changing your search or create a new community",
    createCommunityTitle: "Create New Community",
    createCommunityDesc: "Enter community name and description to get started.",
    name: "Name",
    description: "Description",
    nameRequired: "Name is required",
    authRequired: "Authentication required",
    communityCreated: "Community created",
    communityCreateFailed: "Failed to create community",
    createCommunity: "Create Community",

    // Projects
    newProject: "New Project",
    loadingProjects: "Loading projects...",
    filterAll: "All",
    filterPlanning: "Planning",
    filterActive: "Active",
    filterCompleted: "Completed",
    sortImpact: "Highest Impact",
    sortProgress: "Highest Progress",
    noProjectsTitle: "No projects",
    noProjectsDesc: "Start by creating a new project for your community",
    targetCO2: "Target CO2",
    achieved: "Achieved",
    progressLabel: "Progress",
    createProjectTitle: "Create New Project",
    createProjectDesc: "Create a project and link it to your community.",
    title: "Title",
    community: "Community",
    selectCommunity: "Select community",
    selectCommunityPlaceholder: "Select a community...",
    projectCreated: "Project created",
    projectCreateFailed: "Failed to create project",
    unknown: "Unknown",
    titleRequired: "Title is required",

    // Reports
    timeMonth: "This Month",
    timeQuarter: "This Quarter",
    timeYear: "This Year",
    exportReport: "Download Report",
    exportAsCSV: "Download as CSV",
    exportAsXLSX: "Download as XLSX",
    exportAsPDF: "Download as PDF",
    exportAsImage: "Download as Image",
    exportNoDataTitle: "No data to export",
    exportNoDataDesc: "Please wait for data to load",
    exportSuccessTitle: "Success",
    exportCSVDesc: "Report exported as CSV",
    exportXLSXDesc: "Report exported as XLSX",
    exportPDFDesc: "Report exported as PDF",
    exportImageDesc: "Report exported as image",
    exportFailedTitle: "Export failed",

    // Profile
    invalidFormat: "Invalid format",
    invalidFormatDesc:
      "Choose an image or video file (PNG, JPG, GIF, WebP, MP4, WebM).",
    uploadErrorTitle: "Upload error",
    uploadSuccessTitle: "Avatar uploaded",
    urlFormatCheck: "Check URL format (must be http/https).",
    failedToSaveTitle: "Failed to save",
    generating: "Generating...",
    saving: "Saving...",
    aiUnavailableTitle: "AI unavailable",
    aiUnavailableDesc: "AI feature is not available. Please fill bio manually.",
    suggestBioMadeTitle: "Bio suggestion created",
    suggestBioMadeDesc: "Bio has been auto-filled. Edit if needed.",
    errorTitle: "Error",
    exampleLabel: "example: Portfolio",

    // Chat
    send: "Send",
    chatPlaceholder: "Type a message...",

    // Logout
    confirmLogout: "Confirm Sign Out",
    logoutWarning:
      "You will be signed out from CivicSphere. You will need to log in again to access your dashboard.",
    logout: "Sign Out",

    // Notifications
    notificationsLabel: "Notifications",
    noNotifications: "No new notifications",

    // Global Map
    globalMapTitle: "Global Interactive Map",
    globalMapSubtitle:
      "See all global climate actions in real-time on an interactive map",
    actionType: "Action Type",
    co2Saved: "CO2 Saved",
    createdDate: "Created Date",

    // Chat
    chatFriends: "Friends",
    addFriend: "Add Friend",
    searchFriends: "Search friends...",
    communityChat: "Community Chat",
    publicChat: "Public chat",
    tapToChat: "Click to chat",
    remove: "Remove",
    noFriendsFound: "No friends found",
    noFriends: "No friends yet",
    noMessages: "No messages",
    userNotFound: "User not found",
    friendRequestSent: "Friend request sent",
    friendRemoved: "Friend removed",
    enterFriendUsername: "Enter your friend's username",

    // Global Collaboration
    globalCollaborationTitle: "Global Collaboration",
    globalCollaborationSubtitle:
      "Connect with communities around the world and see the impact of global collaboration",
    totalCommunities: "Total Communities",
    activeActions: "Active Actions",
    totalParticipants: "Total Participants",
    collaborationTrends: "Collaboration Trends",
    topCommunities: "Top Communities",
    viewCommunity: "View Community",
    participants: "Participants",
    actions: "Actions",
    noData: "No data",
  },
  id: {
    getStarted: "Mulai Sekarang",
    learnMore: "Pelajari Lebih Lanjut",
    heroSubtitle: "Web4 platform untuk aksi iklim kolaboratif berbasis AI",
    signIn: "Masuk",
    myProfile: "Profil Saya",
    username: "Nama Pengguna",
    avatar: "Avatar",
    bio: "Bio",
    fillWithAI: "Isi dengan AI",
    clear: "Kosongkan",
    portfolioURL: "URL Portofolio",
    linkedinURL: "URL LinkedIn",
    instagramURL: "URL Instagram",
    whatsapp: "WhatsApp",
    customLinks: "Tautan Kustom",
    addLink: "+ Tambah Tautan",
    label: "Label",
    url: "URL",
    saveProfile: "Simpan Profil",
    cancel: "Batal",
    dragImageHere: "Seret gambar di sini atau klik untuk memilih",
    supportedFormats: "PNG, JPG, GIF, WebP (maksimal 5MB)",
    dragVideoHere: "Seret gambar atau video di sini atau klik untuk memilih",
    supportedVideoFormats: "PNG, JPG, GIF, WebP, MP4, WebM (maksimal 20MB)",
    uploadFailed: "Unggah gagal",
    uploadSuccess: "Avatar berhasil diunggah",
    profileSaved: "Profil disimpan",
    profileSavedDesc: "Perubahan profil berhasil disimpan",
    invalidPortfolioURL: "URL Portofolio tidak valid",
    invalidLinkedinURL: "URL LinkedIn tidak valid",
    invalidInstagramURL: "URL Instagram tidak valid",

    // Landing page
    featuresTitle: "Fitur Utama",
    featureVisualizationTitle: "Visualisasi 3D",
    featureVisualizationDesc:
      "Pantau aksi iklim global dengan visualisasi bumi 3D yang interaktif",
    featureCommunityTitle: "Komunitas Kolaboratif",
    featureCommunityDesc:
      "Bergabung dengan komunitas lokal untuk aksi iklim bersama",
    featureAITitle: "Analisis AI",
    featureAIDesc:
      "Dapatkan rekomendasi aksi pintar dari sistem AI yang adaptif",
    featureTransparencyTitle: "Transparansi Data",
    featureTransparencyDesc:
      "Verifikasi blockchain untuk transparansi aksi iklim yang terukur",
    howItWorksTitle: "Cara Kerja",
    step1Title: "Daftar & Bergabung",
    step1Desc:
      "Buat akun dan bergabung dengan komunitas aksi iklim di wilayah Anda",
    step2Title: "Lapor Aktivitas",
    step2Desc:
      "Catat setiap aksi iklim melalui formulir interaktif dengan visualisasi real-time",
    step3Title: "Dapatkan Insight",
    step3Desc:
      "Terima analisis AI dan rekomendasi untuk memaksimalkan dampak Anda",
    ctaTitle: "Siap Membuat Perubahan?",
    ctaSubtitle:
      "Bergabunglah dengan ribuan pengguna yang sudah berkontribusi pada aksi iklim global",
    ctaButton: "Mulai Sekarang Gratis",
    footerProduct: "Produk",
    aboutUs: "Tentang Kami",
    featuresLink: "Fitur",
    communityTitle: "Komunitas",
    join: "Bergabung",
    leave: "Keluar Komunitas",
    blog: "Blog",
    legal: "Legal",
    privacy: "Privasi",
    terms: "Syarat",
    footerCopyright: "Semua hak dilindungi.",

    // Auth
    loginTitle: "Masuk",
    loginSubtitle: "Selamat kembali ke CivicSphere",
    email: "Email",
    password: "Kata Sandi",
    processing: "Memproses...",
    loginSubmit: "Masuk",
    signupPrompt: "Belum punya akun?",
    signupLink: "Daftar sekarang",

    signupTitle: "Bergabunglah",
    signupSubtitle: "Mulai aksi iklim Anda hari ini",
    signupSubmit: "Daftar",
    signupSuccess:
      "Akun berhasil dibuat! Cek email Anda untuk verifikasi. Mengarahkan ke login...",
    hasAccount: "Sudah punya akun?",
    loginHere: "Masuk di sini",
    usernameLabel: "Nama Pengguna",

    // Dashboard
    welcome: "Selamat datang",
    dashboardSubtitle:
      "Jelajahi dan kelola aksi iklim global dari satu dashboard terpadu",
    actionsLabel: "Aksi Iklim",
    communitiesLabel: "Komunitas",
    projectsLabel: "Proyek",
    analyticsLabel: "Analitik",
    viewTrends: "Lihat Tren",

    // Dashboard (extended)
    "dashboard.featuresTitle": "Fitur Utama",
    "dashboard.featuresDesc":
      "Kelola aksi iklim dan kolaborasi dengan komunitas global",
    "dashboard.feature.map.title": "Peta Interaktif Global",
    "dashboard.feature.map.desc":
      "Visualisasi aksi iklim di seluruh dunia dengan peta interaktif, clustering, dan filter real-time",
    "dashboard.feature.map.cta": "Jelajahi Peta",
    "dashboard.feature.community.title": "Manajemen Komunitas",
    "dashboard.feature.community.desc":
      "Kelola anggota, peran, dan kontribusi secara terpusat untuk kolaborasi efektif",
    "dashboard.feature.community.cta": "Kelola Komunitas",
    "dashboard.feature.chat.title": "Chat Kolaboratif",
    "dashboard.feature.chat.desc":
      "Berkomunikasi real-time untuk diskusi dan koordinasi proyek",
    "dashboard.feature.chat.cta": "Mulai Obrolan",
    "dashboard.feature.projects.title": "Pelacakan Proyek",
    "dashboard.feature.projects.desc":
      "Pantau status proyek, target CO2, dan progres dengan dashboard yang mudah digunakan",
    "dashboard.feature.projects.cta": "Lihat Proyek",
    "dashboard.feature.analytics.title": "Analitik 3D Komprehensif",
    "dashboard.feature.analytics.desc":
      "Dashboard dengan visualisasi 3D, tren waktu, perbandingan regional, dan metrik dampak",
    "dashboard.feature.analytics.cta": "Lihat Laporan",
    "dashboard.feature.collab.title": "Kolaborasi Global",
    "dashboard.feature.collab.desc":
      "Terhubung dengan komunitas di seluruh dunia dan berkolaborasi untuk aksi iklim bersama",
    "dashboard.feature.collab.cta": "Jelajahi Komunitas",
    "dashboard.demo.title": "Mulai dengan Data Demo",
    "dashboard.demo.desc":
      "Seed database dengan komunitas contoh dan aksi iklim untuk menjelajahi semua fitur.",
    "dashboard.demo.cta": "Seed Data Demo",

    // Pages
    communitiesTitle: "Komunitas Aksi Iklim",
    communitiesSubtitle: "Jelajahi komunitas aksi iklim di seluruh dunia",

    projectsTitle: "Manajemen Proyek",
    projectsSubtitle: "Kelola dan pantau proyek aksi iklim komunitas Anda",

    reportsTitle: "Laporan Analitik",
    reportsSubtitle: "Pantau dampak dan tren aksi iklim global Anda",

    // Common/UI
    listView: "Tampilan Daftar",
    mapView: "Tampilan Peta",
    newCommunity: "Komunitas Baru",
    searchCommunitiesPlaceholder: "Cari komunitas...",
    sortRecent: "Terbaru",
    sortMembers: "Paling Anggota",
    sortName: "Nama A-Z",
    members: "anggota",
    creating: "Membuat...",

    // Communities
    loadingCommunities: "Memuat komunitas...",
    noCommunitiesTitle: "Tidak ada komunitas yang ditemukan",
    noCommunitiesDesc: "Coba ubah pencarian Anda atau buat komunitas baru",
    createCommunityTitle: "Buat Komunitas Baru",
    createCommunityDesc: "Masukkan nama dan deskripsi komunitas untuk memulai.",
    name: "Nama",
    description: "Deskripsi",
    nameRequired: "Nama diperlukan",
    authRequired: "Autentikasi diperlukan",
    communityCreated: "Komunitas dibuat",
    communityCreateFailed: "Gagal membuat komunitas",
    createCommunity: "Buat Komunitas",

    // Projects
    newProject: "Proyek Baru",
    loadingProjects: "Memuat proyek...",
    filterAll: "Semua",
    filterPlanning: "Perencanaan",
    filterActive: "Aktif",
    filterCompleted: "Selesai",
    sortImpact: "Dampak Terbesar",
    sortProgress: "Progres Tertinggi",
    noProjectsTitle: "Tidak ada proyek",
    noProjectsDesc: "Mulai dengan membuat proyek baru untuk komunitas Anda",
    targetCO2: "Target CO2",
    achieved: "Tercapai",
    progressLabel: "Progres",
    createProjectTitle: "Buat Proyek Baru",
    createProjectDesc: "Buat proyek dan tautkan ke komunitas Anda.",
    title: "Judul",
    community: "Komunitas",
    selectCommunity: "Pilih komunitas",
    selectCommunityPlaceholder: "Pilih komunitas...",
    projectCreated: "Proyek dibuat",
    projectCreateFailed: "Gagal membuat proyek",
    unknown: "Tidak diketahui",
    titleRequired: "Judul diperlukan",

    // Reports
    timeMonth: "Bulan Ini",
    timeQuarter: "Kuartal Ini",
    timeYear: "Tahun Ini",
    exportReport: "Unduh Laporan",
    exportAsCSV: "Unduh sebagai CSV",
    exportAsXLSX: "Unduh sebagai XLSX",
    exportAsPDF: "Unduh sebagai PDF",
    exportAsImage: "Unduh sebagai Gambar",
    exportNoDataTitle: "Tidak ada data untuk diunduh",
    exportNoDataDesc: "Tunggu hingga data dimuat",
    exportSuccessTitle: "Berhasil",
    exportCSVDesc: "Laporan diunduh sebagai CSV",
    exportXLSXDesc: "Laporan diunduh sebagai XLSX",
    exportPDFDesc: "Laporan diunduh sebagai PDF",
    exportImageDesc: "Laporan diunduh sebagai gambar",
    exportFailedTitle: "Gagal mengunduh",

    // Profile
    invalidFormat: "Format tidak valid",
    invalidFormatDesc:
      "Pilih file gambar atau video (PNG, JPG, GIF, WebP, MP4, WebM).",
    uploadErrorTitle: "Kesalahan unggah",
    uploadSuccessTitle: "Avatar diunggah",
    urlFormatCheck: "Periksa format URL (harus http/https).",
    failedToSaveTitle: "Gagal menyimpan",
    generating: "Membuat...",
    saving: "Menyimpan...",
    aiUnavailableTitle: "AI tidak tersedia",
    aiUnavailableDesc:
      "Fitur AI sedang tidak tersedia. Silakan isi bio secara manual.",
    suggestBioMadeTitle: "Saran bio dibuat",
    suggestBioMadeDesc: "Bio telah diisi otomatis. Ubah jika perlu.",
    errorTitle: "Kesalahan",
    exampleLabel: "contoh: Portfolio",

    // Chat
    send: "Kirim",
    chatPlaceholder: "Tulis pesan...",

    // Logout
    confirmLogout: "Konfirmasi Keluar",
    logoutWarning:
      "Anda akan keluar dari CivicSphere. Anda perlu login kembali untuk mengakses dashboard Anda.",
    logout: "Keluar",

    // Notifications
    notificationsLabel: "Notifikasi",
    noNotifications: "Tidak ada notifikasi baru",

    // Global Map
    globalMapTitle: "Peta Interaktif Global",
    globalMapSubtitle:
      "Lihat semua aksi iklim global secara real-time di peta interaktif",
    actionType: "Jenis Aksi",
    co2Saved: "CO2 Tersimpan",
    createdDate: "Tanggal Dibuat",

    // Chat
    chatFriends: "Teman",
    addFriend: "Tambah Teman",
    searchFriends: "Cari teman...",
    communityChat: "Chat Komunitas",
    publicChat: "Chat publik",
    tapToChat: "Ketuk untuk chat",
    remove: "Hapus",
    noFriendsFound: "Teman tidak ditemukan",
    noFriends: "Belum ada teman",
    noMessages: "Belum ada pesan",
    userNotFound: "Pengguna tidak ditemukan",
    friendRequestSent: "Permintaan pertemanan dikirim",
    friendRemoved: "Teman dihapus",
    enterFriendUsername: "Masukkan username teman Anda",

    // Global Collaboration
    globalCollaborationTitle: "Kolaborasi Global",
    globalCollaborationSubtitle:
      "Terhubung dengan komunitas di seluruh dunia dan lihat dampak kolaborasi global",
    totalCommunities: "Total Komunitas",
    activeActions: "Aksi Aktif",
    totalParticipants: "Total Peserta",
    collaborationTrends: "Tren Kolaborasi",
    topCommunities: "Komunitas Terkemuka",
    viewCommunity: "Lihat Komunitas",
    participants: "Peserta",
    actions: "Aksi",
    noData: "Tidak ada data",
  },
};

type I18nContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const v = localStorage.getItem("lang");
      return v === "en" ? "en" : "id";
    } catch (e) {
      return "id";
    }
  });

  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail as Lang;
        if (detail) setLang(detail);
      } catch (e) {}
    };
    window.addEventListener("langchange", handler as EventListener);
    return () =>
      window.removeEventListener("langchange", handler as EventListener);
  }, []);

  const setLang = (l: Lang) => {
    try {
      localStorage.setItem("lang", l);
    } catch (e) {}
    setLangState(l);

    // Persist preference to server/profile if authenticated
    (async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (!authUser) return;
        // Try to upsert language field on profiles; ignore errors if column missing
        try {
          await (supabase.from("profiles") as any).upsert(
            { id: authUser.id, language: l },
            { returning: "minimal" },
          );
        } catch (columnError: any) {
          // Silently ignore if language column doesn't exist
          if (!String(columnError).includes("language")) {
            throw columnError;
          }
        }
      } catch (e) {
        // ignore server errors
        // eslint-disable-next-line no-console
        console.warn("Failed to persist language preference", e);
      }
    })();
  };

  const t = (key: string) => {
    return translations[lang]?.[key] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
