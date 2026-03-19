
export const formatUzTime = (date: Date | string | number) => {
  const d = date ? new Date(date) : new Date();
  return d.toLocaleTimeString("en-GB", {
    timeZone: "Asia/Tashkent",
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

export const getUzTime = (date?: Date | string | number) => {
  const d = date ? new Date(date) : new Date();
  // Uzbekistan is UTC+5
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const uzTime = new Date(utc + (3600000 * 5));
  return uzTime;
};

export const formatUzDateTime = (date: Date | string | number) => {
  const d = date ? new Date(date) : new Date();
  return d.toLocaleString("en-GB", {
    timeZone: "Asia/Tashkent",
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).replace(',', '');
};

export const getTodayStr = () => {
  const uzDate = getUzTime();
  const y = uzDate.getFullYear();
  const m = String(uzDate.getMonth() + 1).padStart(2, '0');
  const d = String(uzDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const isDateMatch = (timestamp: string, dateStr: string) => {
  if (!timestamp) return false;
  const uzDate = getUzTime(timestamp);
  const y = uzDate.getFullYear();
  const m = String(uzDate.getMonth() + 1).padStart(2, '0');
  const d = String(uzDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}` === dateStr;
};

export const getLatenessStatus = (checkInTimestamp: string, workingHours?: any) => {
  if (typeof workingHours !== 'string' || !workingHours.includes('-')) return null;

  try {
    const startTimePart = workingHours.split('-')[0].trim();
    const timeMatch = startTimePart.match(/(\d{1,2})[:.](\d{2})/);

    if (!timeMatch) return null;

    const startH = parseInt(timeMatch[1], 10);
    const startM = parseInt(timeMatch[2], 10);

    const uzDate = getUzTime(checkInTimestamp);
    if (isNaN(uzDate.getTime())) return null;

    const startTotalMinutes = startH * 60 + startM;
    const checkInTotalMinutes = uzDate.getHours() * 60 + uzDate.getMinutes();

    // Only mark as late if checked in more than 10 minutes AFTER start time
    if (checkInTotalMinutes > startTotalMinutes + 10) {
      const diff = checkInTotalMinutes - startTotalMinutes;
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;

      let durationStr = "";
      if (hours > 0) durationStr += `${hours} soat `;
      durationStr += `${mins} daqiqa`;

      return {
        isLate: true,
        isEarly: false,
        durationStr: durationStr.trim(),
        diffMinutes: diff
      };
    }
  } catch (e) {
    return null;
  }
  return null;
};

export const getEarlyDepartureStatus = (coTimestamp: string, workingHours?: any) => {
  if (typeof workingHours !== 'string' || !workingHours.includes('-')) return null;

  try {
    const endTimePart = workingHours.split('-')[1].trim();
    const timeMatch = endTimePart.match(/(\d{1,2})[:.](\d{2})/);

    if (!timeMatch) return null;

    const endH = parseInt(timeMatch[1], 10);
    const endM = parseInt(timeMatch[2], 10);

    const uzDate = getUzTime(coTimestamp);
    if (isNaN(uzDate.getTime())) return null;

    const endTotalMinutes = endH * 60 + endM;
    const coTotalMinutes = uzDate.getHours() * 60 + uzDate.getMinutes();

    // Only mark as early departure if checked out more than 10 minutes BEFORE end time
    if (coTotalMinutes < endTotalMinutes - 10) {
      const diff = endTotalMinutes - coTotalMinutes;
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;

      let durationStr = "";
      if (hours > 0) durationStr += `${hours} soat `;
      durationStr += `${mins} daqiqa`;

      return {
        isEarly: true,
        durationStr: durationStr.trim(),
        diffMinutes: diff
      };
    }
  } catch (e) {
    return null;
  }
  return null;
};

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
};
