import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Filter } from "lucide-react";

interface ClimateAction {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  action_type: string;
  impact_co2_saved?: number;
  location_name?: string;
}

interface MapViewProps {
  actions?: ClimateAction[];
  onActionSelect?: (action: ClimateAction) => void;
  center?: [number, number];
  zoom?: number;
}

const MAP_BOUNDS = {
  NORTH: 85,
  SOUTH: -85,
  EAST: 180,
  WEST: -180,
};

const ACTION_TYPES = {
  renewable: { label: "Energi Terbarukan", color: "#10b981" },
  reforestation: { label: "Reboisasi", color: "#3b82f6" },
  waste: { label: "Pengelolaan Limbah", color: "#f59e0b" },
  transportation: { label: "Transportasi", color: "#8b5cf6" },
  agriculture: { label: "Pertanian Berkelanjutan", color: "#06b6d4" },
};

export const MapView: React.FC<MapViewProps> = ({
  actions = [],
  onActionSelect,
  center = [0, 20],
  zoom = 3,
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const clusterGroupRef = useRef<L.FeatureGroup | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [filteredActions, setFilteredActions] =
    useState<ClimateAction[]>(actions);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: center as L.LatLngExpression,
      zoom: zoom,
      minZoom: 2,
      maxZoom: 18,
      maxBounds: [
        [MAP_BOUNDS.SOUTH, MAP_BOUNDS.WEST],
        [MAP_BOUNDS.NORTH, MAP_BOUNDS.EAST],
      ],
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [center, zoom]);

  // Filter actions
  useEffect(() => {
    if (selectedFilter) {
      setFilteredActions(
        actions.filter((action) => action.action_type === selectedFilter),
      );
    } else {
      setFilteredActions(actions);
    }
  }, [selectedFilter, actions]);

  // Update markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      mapRef.current?.removeLayer(marker);
    });
    markersRef.current = [];

    if (clusterGroupRef.current) {
      mapRef.current.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    }

    // Create cluster group
    const featureGroup = L.featureGroup();

    // Add new markers with custom icons
    filteredActions.forEach((action) => {
      const color =
        ACTION_TYPES[action.action_type as keyof typeof ACTION_TYPES]?.color ||
        "#6b7280";

      const iconHtml = `
        <div style="
          background-color: ${color};
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          cursor: pointer;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          </svg>
        </div>
      `;

      const marker = L.marker([action.latitude, action.longitude], {
        icon: L.divIcon({
          html: iconHtml,
          iconSize: [32, 32],
          className: "custom-marker",
        }),
      });

      const popupContent = `
        <div style="max-width: 200px;">
          <h3 style="font-weight: bold; margin: 0 0 8px 0;">${action.title}</h3>
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">
            <strong>Tipe:</strong> ${ACTION_TYPES[action.action_type as keyof typeof ACTION_TYPES]?.label || action.action_type}
          </p>
          ${action.location_name ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #666;"><strong>Lokasi:</strong> ${action.location_name}</p>` : ""}
          ${action.impact_co2_saved ? `<p style="margin: 0; font-size: 12px; color: #666;"><strong>CO2 Hemat:</strong> ${action.impact_co2_saved} kg</p>` : ""}
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on("click", () => {
        onActionSelect?.(action);
      });

      featureGroup.addLayer(marker);
      markersRef.current.push(marker);
    });

    featureGroup.addTo(mapRef.current);
    clusterGroupRef.current = featureGroup;

    // Auto-fit map to markers if any exist
    if (filteredActions.length > 0 && filteredActions.length < actions.length) {
      mapRef.current.fitBounds(featureGroup.getBounds().pad(0.1));
    } else if (filteredActions.length === 1) {
      mapRef.current.setView(
        [filteredActions[0].latitude, filteredActions[0].longitude],
        12,
      );
    }
  }, [filteredActions, onActionSelect, actions.length]);

  return (
    <div className="w-full h-full flex flex-col bg-background rounded-lg overflow-hidden border border-border">
      {/* Filter Controls */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filter Aksi Iklim</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedFilter(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              selectedFilter === null
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Semua ({actions.length})
          </button>
          {Object.entries(ACTION_TYPES).map(([key, { label, color }]) => {
            const count = actions.filter((a) => a.action_type === key).length;
            return (
              <button
                key={key}
                onClick={() => setSelectedFilter(key)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                  selectedFilter === key
                    ? "text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                style={
                  selectedFilter === key
                    ? { backgroundColor: color }
                    : undefined
                }
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: color }}
                ></span>
                {label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          minHeight: "400px",
          position: "relative",
        }}
        className="map-container"
      >
        {filteredActions.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 backdrop-blur-sm z-10 rounded-lg">
            <div className="text-center">
              <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-muted-foreground">
                Tidak ada aksi iklim dengan filter yang dipilih
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="p-3 bg-card border-t border-border text-xs text-muted-foreground">
        <p>
          Total: <strong>{filteredActions.length}</strong> aksi iklim
          ditampilkan
          {selectedFilter && (
            <>
              {" "}
              •{" "}
              <strong>
                {
                  ACTION_TYPES[selectedFilter as keyof typeof ACTION_TYPES]
                    ?.label
                }
              </strong>
            </>
          )}
        </p>
      </div>
    </div>
  );
};
