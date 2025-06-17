"use client";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

// Helper para centrar el mapa al cambiar coords
function MapCenter({ coords }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(coords, 16); // Puedes ajustar el zoom
    }, [coords, map]);
    return null;
}

export default function MapLeaflet({ coords, label }) {
    return (
        <MapContainer center={coords} zoom={16} scrollWheelZoom={false} style={{ height: "210px", width: "100%" }}>
            <MapCenter coords={coords} />
            <TileLayer
                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={coords} icon={icon}>
                <Popup>
                    <span className="font-bold">{label}</span>
                </Popup>
            </Marker>
        </MapContainer>
    );
}
