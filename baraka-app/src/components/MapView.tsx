import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export interface MapMarker {
  id: string
  lat: number
  lng: number
  label: string
  sublabel?: string
}

function basketIcon(highlighted: boolean) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 34px; height: 34px; border-radius: 999px;
      background: ${highlighted ? '#1f6b3e' : '#ffffff'};
      border: 2px solid #1f6b3e;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; box-shadow: 0 2px 6px rgba(16,58,33,0.35);
    ">🧺</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  })
}

export default function MapView({
  markers,
  center,
  zoom = 12,
  onMarkerClick,
  height = 420,
}: {
  markers: MapMarker[]
  center: [number, number]
  zoom?: number
  onMarkerClick?: (id: string) => void
  height?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(center, zoom)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    mapRef.current?.setView(center, zoom)
  }, [center, zoom])

  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return
    layer.clearLayers()
    for (const marker of markers) {
      const m = L.marker([marker.lat, marker.lng], { icon: basketIcon(false) })
      m.bindTooltip(`<strong>${marker.label}</strong>${marker.sublabel ? `<br/>${marker.sublabel}` : ''}`)
      if (onMarkerClick) m.on('click', () => onMarkerClick(marker.id))
      m.addTo(layer)
    }
  }, [markers, onMarkerClick])

  return <div ref={containerRef} style={{ height }} className="w-full rounded-2xl border border-brand-100" />
}
