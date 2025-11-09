import { supabase } from "./supabase";

const DEMO_COMMUNITIES = [
  {
    name: "Asian Climate Action Alliance",
    description:
      "Komunitas untuk aksi iklim di Asia Tenggara dengan fokus pada energi terbarukan",
    location_name: "Jakarta, Indonesia",
    latitude: -6.2088,
    longitude: 106.8456,
    visibility: "public",
  },
  {
    name: "Indian Renewable Energy Network",
    description:
      "Jaringan pengembangan energi terbarukan dan reboisasi di India",
    location_name: "New Delhi, India",
    latitude: 28.6139,
    longitude: 77.209,
    visibility: "public",
  },
  {
    name: "African Green Initiative",
    description:
      "Inisiatif penghijauan dan pengelolaan limbah berkelanjutan di Afrika",
    location_name: "Lagos, Nigeria",
    latitude: 6.5244,
    longitude: 3.3792,
    visibility: "public",
  },
  {
    name: "Americas Climate Coalition",
    description:
      "Koalisi untuk aksi iklim dan transportasi berkelanjutan di Amerika",
    location_name: "São Paulo, Brazil",
    latitude: -23.5505,
    longitude: -46.6333,
    visibility: "public",
  },
  {
    name: "European Sustainability Forum",
    description: "Forum keberlanjutan dan efisiensi energi di Eropa",
    location_name: "Berlin, Germany",
    latitude: 52.52,
    longitude: 13.405,
    visibility: "public",
  },
];

const DEMO_CLIMATE_ACTIONS = [
  // Asia Tenggara
  {
    title: "Solar Panel Installation in Jakarta",
    description: "Pemasangan 500 panel surya di gedung komersial",
    action_type: "renewable",
    latitude: -6.2088,
    longitude: 106.8456,
    location_name: "Jakarta, Indonesia",
    impact_co2_saved: 500,
  },
  {
    title: "Mangrove Restoration Project",
    description: "Pemulihan hutan bakau seluas 50 hektar",
    action_type: "reforestation",
    latitude: -6.3,
    longitude: 106.9,
    location_name: "Tangerang, Indonesia",
    impact_co2_saved: 1200,
  },
  {
    title: "Electric Bus Fleet Implementation",
    description: "Penggantian 100 bus kota dengan bus listrik",
    action_type: "transportation",
    latitude: -6.1,
    longitude: 106.7,
    location_name: "Jakarta, Indonesia",
    impact_co2_saved: 800,
  },

  // India
  {
    title: "Wind Farm Development in Gujarat",
    description: "Pembangunan taman angin dengan kapasitas 50 MW",
    action_type: "renewable",
    latitude: 22,
    longitude: 72,
    location_name: "Gujarat, India",
    impact_co2_saved: 1500,
  },
  {
    title: "Forest Conservation Initiative",
    description: "Perlindungan hutan tropis seluas 100 hektar",
    action_type: "reforestation",
    latitude: 28.6139,
    longitude: 77.209,
    location_name: "New Delhi, India",
    impact_co2_saved: 2000,
  },
  {
    title: "Organic Farming Transition",
    description: "Transisi 500 petani ke pertanian organik berkelanjutan",
    action_type: "agriculture",
    latitude: 26,
    longitude: 74,
    location_name: "Rajasthan, India",
    impact_co2_saved: 600,
  },

  // Africa
  {
    title: "Solar Energy for Rural Villages",
    description: "Penyediaan energi surya untuk 20 desa terpencil",
    action_type: "renewable",
    latitude: 6.5244,
    longitude: 3.3792,
    location_name: "Lagos, Nigeria",
    impact_co2_saved: 400,
  },
  {
    title: "Sahel Reforestation Program",
    description: "Program penanaman pohon di sabuk Sahel",
    action_type: "reforestation",
    latitude: 14,
    longitude: 4,
    location_name: "Mali",
    impact_co2_saved: 3000,
  },
  {
    title: "Plastic Waste Recycling Center",
    description: "Pusat daur ulang sampah plastik untuk Afrika Barat",
    action_type: "waste",
    latitude: 5,
    longitude: 1,
    location_name: "Ghana",
    impact_co2_saved: 300,
  },

  // Americas
  {
    title: "Amazon Rainforest Protection",
    description: "Program perlindungan hutan hujan Amazon seluas 1000 hektar",
    action_type: "reforestation",
    latitude: -3,
    longitude: -60,
    location_name: "Amazon, Brazil",
    impact_co2_saved: 5000,
  },
  {
    title: "Subway Expansion Project",
    description: "Perluasan sistem metro untuk transportasi berkelanjutan",
    action_type: "transportation",
    latitude: -23.5505,
    longitude: -46.6333,
    location_name: "São Paulo, Brazil",
    impact_co2_saved: 1200,
  },
  {
    title: "Rooftop Gardens Initiative",
    description: "Program atap hijau untuk 100 bangunan di kota",
    action_type: "agriculture",
    latitude: -23.6,
    longitude: -46.5,
    location_name: "São Paulo Region",
    impact_co2_saved: 450,
  },

  // Europe
  {
    title: "Wind Energy Expansion",
    description: "Ekspansi energi angin offshore di Laut Utara",
    action_type: "renewable",
    latitude: 54,
    longitude: 6,
    location_name: "North Sea",
    impact_co2_saved: 2500,
  },
  {
    title: "Urban Forest Project",
    description: "Penanaman 100,000 pohon di seluruh Berlin",
    action_type: "reforestation",
    latitude: 52.52,
    longitude: 13.405,
    location_name: "Berlin, Germany",
    impact_co2_saved: 800,
  },
  {
    title: "Circular Economy Hub",
    description: "Pusat ekonomi sirkular untuk industri manufaktur",
    action_type: "waste",
    latitude: 51.5,
    longitude: 0,
    location_name: "London, UK",
    impact_co2_saved: 700,
  },
];

export async function seedDemoData() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Helper to format Postgrest error objects
    const formatPgError = (err: any) => {
      if (!err) return null;
      try {
        const parts = [];
        if (err.message) parts.push(err.message);
        if (err.details) parts.push(String(err.details));
        if (err.hint) parts.push(`Hint: ${err.hint}`);
        if (err.code) parts.push(`Code: ${err.code}`);
        return parts.join(" | ") || JSON.stringify(err);
      } catch (e) {
        return String(err);
      }
    };

    // Seed communities
    let communitiesData: any = null;
    try {
      const communitiesInsert = DEMO_COMMUNITIES.map((c) => ({
        ...c,
        creator_id: user.id,
        is_demo: true,
      }));
      const res = await supabase
        .from("communities")
        .insert(communitiesInsert)
        .select();
      communitiesData = (res as any).data;
      const communitiesError = (res as any).error;
      if (communitiesError) {
        const msg = formatPgError(communitiesError);
        console.error("Error seeding communities:", msg, communitiesError);
        return { success: false, error: msg };
      }
    } catch (err) {
      const msg = formatPgError(err);
      console.error("Unexpected error seeding communities:", err);
      return { success: false, error: msg || String(err) };
    }

    // Seed climate actions
    let actionsData: any = null;
    try {
      const actionsInsert = DEMO_CLIMATE_ACTIONS.map((a) => ({
        ...a,
        creator_id: user.id,
        status: "active",
        is_demo: true,
      }));
      const res = await supabase
        .from("climate_actions")
        .insert(actionsInsert)
        .select();
      actionsData = (res as any).data;
      const actionsError = (res as any).error;
      if (actionsError) {
        const msg = formatPgError(actionsError);
        console.error("Error seeding climate actions:", msg, actionsError);
        return { success: false, error: msg };
      }
    } catch (err) {
      const msg = formatPgError(err);
      console.error("Unexpected error seeding climate actions:", err);
      return { success: false, error: msg || String(err) };
    }

    return {
      success: true,
      communities: communitiesData?.length || 0,
      actions: actionsData?.length || 0,
    };
  } catch (error) {
    console.error("Error seeding data:", error);
    let msg = "Unknown error";
    try {
      msg = error?.message || JSON.stringify(error);
    } catch (_) {
      msg = String(error);
    }
    return { success: false, error: msg };
  }
}
