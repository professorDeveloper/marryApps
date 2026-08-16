/// Unit conversion for floor-plan coordinates.
///
/// Backend stores hall/table dimensions and positions as raw int32 pixels.
/// The admin web app treats those numbers as **meters × 100** (100 px = 1 m).
/// POS mirrors that convention: UI inputs are metres, storage is pixels.
const double pixelsPerMeter = 100;

double pxToMeters(num px) => px / pixelsPerMeter;

int metersToPx(num m) => (m * pixelsPerMeter).round();

/// Format metres for display: "8", "6.5", "0.8".
String formatMeters(num m) {
  if (m == m.truncate()) return m.toInt().toString();
  final s = m.toStringAsFixed(2);
  return s.endsWith('0') ? s.substring(0, s.length - 1) : s;
}

const double defaultHallWidthMeters = 8;
const double defaultHallHeightMeters = 6;
const double defaultTableSizeMeters = 0.8;
const double defaultTablePosMeters = 0.4;

/// Halls smaller than this are likely legacy values saved in raw metres
/// instead of pixels (e.g. width=2 instead of width=200).
const double minReasonableHallPx = 100;
