function formatConnection(connection) {
  if (!connection) return 'Unknown';

  const parts = [];
  if (connection.effectiveType) parts.push(connection.effectiveType);
  if (typeof connection.downlink === 'number') parts.push(`${connection.downlink} Mbps`);
  if (typeof connection.rtt === 'number') parts.push(`${connection.rtt} ms RTT`);
  return parts.length > 0 ? parts.join(', ') : 'Unknown';
}

function getBrowserLabel(userAgentData) {
  if (!userAgentData?.brands?.length) return 'Unknown';
  return userAgentData.brands
    .map((brand) => `${brand.brand} ${brand.version}`)
    .join(', ');
}

export async function collectSOSContext() {
  const nav = typeof navigator !== 'undefined' ? navigator : {};
  const win = typeof window !== 'undefined' ? window : {};
  const uaData = nav.userAgentData;
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

  const device = {
    browser: getBrowserLabel(uaData),
    platform: uaData?.platform || nav.platform || 'Unknown',
    model: uaData?.model || 'Unknown',
    mobile: typeof uaData?.mobile === 'boolean' ? (uaData.mobile ? 'Yes' : 'No') : 'Unknown',
    language: nav.language || 'Unknown',
    languages: Array.isArray(nav.languages) ? nav.languages.join(', ') : 'Unknown',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
    screen: win.screen ? `${win.screen.width} x ${win.screen.height}` : 'Unknown',
    viewport: win.innerWidth && win.innerHeight ? `${win.innerWidth} x ${win.innerHeight}` : 'Unknown',
    pixelRatio: win.devicePixelRatio || 1,
    colorScheme: win.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'Dark' : 'Light',
    online: nav.onLine ? 'Online' : 'Offline',
    connection: formatConnection(connection),
    userAgent: nav.userAgent || 'Unknown',
    timestamp: new Date().toISOString(),
  };

  if (typeof nav.getBattery === 'function') {
    try {
      const battery = await nav.getBattery();
      device.battery = `${Math.round((battery.level || 0) * 100)}%${battery.charging ? ' (Charging)' : ''}`;
    } catch {
      device.battery = 'Unavailable';
    }
  }

  let location = null;
  if (nav.geolocation) {
    try {
      const pos = await new Promise((resolve, reject) => {
        nav.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000,
        });
      });

      const lat = Number(pos.coords.latitude);
      const lng = Number(pos.coords.longitude);
      location = {
        lat,
        lng,
        accuracy: typeof pos.coords.accuracy === 'number' ? Math.round(pos.coords.accuracy) : null,
        altitude: typeof pos.coords.altitude === 'number' ? Number(pos.coords.altitude.toFixed(1)) : null,
        altitudeAccuracy:
          typeof pos.coords.altitudeAccuracy === 'number' ? Math.round(pos.coords.altitudeAccuracy) : null,
        heading: typeof pos.coords.heading === 'number' ? Math.round(pos.coords.heading) : null,
        speed: typeof pos.coords.speed === 'number' ? Number(pos.coords.speed.toFixed(1)) : null,
        mapUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      };
    } catch {
      location = null;
    }
  }

  return { device, location };
}
