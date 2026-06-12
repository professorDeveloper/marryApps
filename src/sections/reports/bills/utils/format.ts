// Cached formatter — creating an Intl.NumberFormat per call is expensive inside
// cell renderers. ru-RU groups thousands with U+00A0, matching the previous
// regex-based output byte-for-byte; U+202F is normalized for older ICU variants.
const numberFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

export const fmtNum = (n: number) =>
    numberFormatter.format(Math.round(n)).replace(/\u202f/g, "\u00a0");

export const fmtDuration = (totalSeconds: number): string => {
    const s = Math.max(0, Math.round(totalSeconds || 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const parts: string[] = [];
    if (h > 0) parts.push(`${h}h`);
    if (h > 0 || m > 0) parts.push(`${m}m`);
    parts.push(`${sec}s`);
    return parts.join(' ');
};
