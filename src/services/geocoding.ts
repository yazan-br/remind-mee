export interface GeocodeResult {
  address: string;
  lat: number;
  lng: number;
}

export async function searchAddresses(query: string): Promise<GeocodeResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5`;
  try {
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    const data = await res.json();
    if (!data?.features?.length) return [];
    return data.features.map((f: { geometry: { coordinates: number[] }; properties: Record<string, string> }) => {
      const [lng, lat] = f.geometry.coordinates;
      const p = f.properties;
      const address = [p.name, p.street, p.housenumber, p.city, p.state, p.country].filter(Boolean).join(', ') || p.name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      return { address, lat, lng };
    });
  } catch {
    return [];
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const photonUrl = `https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`;
  try {
    const res = await fetch(photonUrl, { headers: { Accept: 'application/json' } });
    const data = await res.json();
    const p = data?.properties;
    if (p) {
      const addr = [p.name, p.street, p.housenumber, p.city, p.state, p.country].filter(Boolean).join(', ') || p.name;
      if (addr) return addr;
    }
  } catch {}
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const res = await fetch(nominatimUrl, {
      headers: { 'User-Agent': 'NextReminder/1.0' },
    });
    const data = await res.json();
    const name = data?.display_name;
    if (name && typeof name === 'string') return name;
  } catch {}
  return null;
}

export async function geocodeAddress(
  address: string,
  bias?: { lat: number; lng: number }
): Promise<{ lat: number; lng: number } | null> {
  const q = address.trim();
  if (q.length < 2) return null;
  let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1`;
  if (bias) {
    url += `&lat=${bias.lat}&lon=${bias.lng}`;
  }
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    const data = await res.json();
    if (!data?.features?.length) return null;
    const f = data.features[0];
    const [lng, lat] = f.geometry.coordinates;
    if (typeof lat !== 'number' || typeof lng !== 'number') return null;
    return { lat, lng };
  } catch {
    return null;
  }
}
