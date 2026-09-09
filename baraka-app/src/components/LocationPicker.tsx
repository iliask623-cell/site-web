import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useTranslation } from 'react-i18next'

const pinIcon = L.divIcon({
  className: '',
  html: `<div style="
    width: 30px; height: 30px; border-radius: 999px 999px 999px 0;
    background: #1f6b3e; transform: rotate(45deg);
    box-shadow: 0 2px 6px rgba(16,58,33,0.4);
  "></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
})

export default function LocationPicker({
  value,
  defaultCenter,
  onChange,
  height = 260,
}: {
  value: [number, number]
  defaultCenter: [number, number]
  onChange: (lat: number, lng: number) => void
  height?: number
}) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(value ?? defaultCenter, 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)
    const marker = L.marker(value ?? defaultCenter, { icon: pinIcon, draggable: true }).addTo(map)
    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      onChangeRef.current(pos.lat, pos.lng)
    })
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng)
      onChangeRef.current(e.latlng.lat, e.latlng.lng)
    })
    markerRef.current = marker
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col gap-1.5">
      <div ref={containerRef} style={{ height }} className="w-full rounded-xl border border-brand-200" />
      <p className="text-xs text-brand-800/60">{t('merchant.location_hint')}</p>
    </div>
  )
}
