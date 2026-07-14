const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
});

export function numberCell(value: number, marginRight: number = 50) {
    return (
        <span style={{ marginRight }}>
            {formatter.format(value).replace(/,/g, ' ')}
        </span>
    );
}