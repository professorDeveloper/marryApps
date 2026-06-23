const formatter = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

export function numberCell(value: number, marginRight: number = 50) {
    return (
        <span style={{ marginRight }}>
            {formatter.format(value)}
        </span>
    );
}