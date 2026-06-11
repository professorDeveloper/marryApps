import { fmtNum } from "../../bills/utils/format";

export function numberCell(value: number, marginRight: number = 50) {
    return (
        <span style={{ marginRight }}>
            {fmtNum(value)}
        </span>
    );
}