export const fmtNum = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

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
