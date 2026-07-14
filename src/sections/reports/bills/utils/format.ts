// Cached formatter — creating an Intl.NumberFormat per call is expensive inside
// cell renderers. en-US groups thousands with commas and uses a period for
// decimals; commas are swapped for U+00A0 to keep the existing spaced-thousands
// look. Decimals only appear when the value actually has a fractional part.
const numberFormatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export const fmtNum = (n: number) =>
    numberFormatter.format(n).replace(/,/g, "\u00a0");

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
