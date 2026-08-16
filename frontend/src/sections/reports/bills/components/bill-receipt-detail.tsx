import dayjs from 'dayjs';
import { useState } from 'react';

import { Box, Chip, Collapse, Typography } from '@mui/material';

import { Iconify } from 'src/components/iconify';

import { fmtNum, fmtDuration } from '../utils/format';

const SESSION_STATE_COLORS: Record<string, 'info' | 'warning' | 'success' | 'default'> = {
    running: 'info',
    paused: 'warning',
    finished: 'default',
};

const MOVE_REASON_KEYS: Record<string, string> = {
    start: 'bills.reasonStart',
    transfer: 'bills.reasonTransfer',
    merge: 'bills.reasonMerge',
    return: 'bills.reasonReturn',
    split: 'bills.reasonSplit',
};

// A label ... value row with a dotted leader, like a printed receipt line
function ReceiptRow({
    label,
    value,
    bold,
    color,
    labelColor,
}: {
    label: React.ReactNode;
    value: React.ReactNode;
    bold?: boolean;
    color?: string;
    labelColor?: string;
}) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
            <Typography
                component="span"
                variant="body2"
                sx={{ fontFamily: 'inherit', fontWeight: bold ? 700 : 400, color: labelColor || color || 'text.primary' }}
            >
                {label}
            </Typography>
            <Box sx={{ flex: 1, borderBottom: '1px dotted', borderColor: 'divider', mb: '4px' }} />
            <Typography
                component="span"
                variant="body2"
                sx={{ fontFamily: 'inherit', fontWeight: bold ? 700 : 400, color: color || 'text.primary', whiteSpace: 'nowrap' }}
            >
                {value}
            </Typography>
        </Box>
    );
}

// Dashed separator between receipt sections
function ReceiptDivider() {
    return <Box sx={{ borderTop: '1px dashed', borderColor: 'divider', my: 1.25 }} />;
}

// Small uppercase label marking a section of the receipt (e.g. "Items", "Table Charge")
function ReceiptSectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <Typography
            variant="caption"
            sx={{
                fontFamily: 'inherit',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'text.secondary',
                textTransform: 'uppercase',
                letterSpacing: 1,
                display: 'block',
                mb: 0.5,
            }}
        >
            {children}
        </Typography>
    );
}

// A single table-usage line on the receipt, with collapsible start/stop periods
function SessionReceiptLine({
    session,
    tableLabel,
    pricePerHour,
    t,
}: {
    session: any;
    tableLabel: string | number;
    pricePerHour?: number;
    t: (key: string) => string;
}) {
    const segments = session.segments || [];
    const hasPauses = segments.some((seg: any) => seg.pause_intervals && seg.pause_intervals.length > 0);
    const hasDetails = segments.length > 1 || hasPauses;
    const [expanded, setExpanded] = useState(false);

    const stateLabel =
        session.state === 'running'
            ? t('bills.running')
            : session.state === 'paused'
                ? t('bills.paused')
                : session.state === 'finished'
                    ? t('bills.finished')
                    : session.state;

    const amount = Number(session.amount);
    const valueText = pricePerHour
        ? `${fmtDuration(session.total_active_sec)} × ${fmtNum(pricePerHour)} = ${fmtNum(amount)}`
        : fmtNum(amount);

    return (
        <Box sx={{ mb: 0.75 }}>
            <ReceiptRow
                label={`${t('bills.table')} ${tableLabel ?? '-'}`}
                labelColor="primary.main"
                value={valueText}
            />
            <Box
                onClick={hasDetails ? () => setExpanded((prev) => !prev) : undefined}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    cursor: hasDetails ? 'pointer' : 'default',
                    mt: 0.25,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Chip
                        label={stateLabel}
                        size="small"
                        color={SESSION_STATE_COLORS[session.state] ?? 'default'}
                        variant="soft"
                    />
                    {hasDetails && (
                        <Iconify
                            icon={expanded ? 'eva:arrow-ios-downward-fill' : 'eva:arrow-ios-forward-fill'}
                            width={14}
                            height={14}
                        />
                    )}
                </Box>
            </Box>

            {hasDetails && (
                <Collapse in={expanded}>
                    <Box sx={{ mt: 0.5, pl: 1, borderLeft: '2px solid', borderColor: 'divider' }}>
                        {segments.map((segment: any, segmentIndex: number) => (
                            <Box key={segment.segment_id || segmentIndex} sx={{ mb: 0.5 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="caption" sx={{ fontFamily: 'inherit', fontSize: '0.85rem' }}>
                                        {dayjs(segment.entered_at).format('DD.MM HH:mm')}
                                        {' → '}
                                        {segment.exited_at
                                            ? dayjs(segment.exited_at).format('DD.MM HH:mm')
                                            : t('bills.running')}
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontFamily: 'inherit', fontSize: '0.85rem', color: 'text.secondary' }}>
                                        {fmtDuration(segment.active_seconds)}
                                    </Typography>
                                </Box>
                                <Typography variant="caption" sx={{ fontFamily: 'inherit', fontSize: '0.85rem', color: 'text.secondary', display: 'block' }}>
                                    {t(MOVE_REASON_KEYS[segment.move_in_reason] || '') || segment.move_in_reason}
                                    {segment.paused_seconds > 0
                                        ? ` · ${t('bills.pausedTime')}: ${fmtDuration(segment.paused_seconds)}`
                                        : ''}
                                </Typography>
                                {segment.pause_intervals &&
                                    segment.pause_intervals.map((interval: any, intervalIndex: number) => {
                                        const start = interval.paused_at || interval.start;
                                        const end = interval.resumed_at || interval.end;
                                        return (
                                            <Typography
                                                key={intervalIndex}
                                                variant="caption"
                                                sx={{ fontFamily: 'inherit', fontSize: '0.85rem', color: 'text.secondary', display: 'block' }}
                                            >
                                                {t('bills.pauseIntervals')}:{' '}
                                                {start ? dayjs(start).format('DD.MM HH:mm') : '-'}
                                                {' → '}
                                                {end ? dayjs(end).format('DD.MM HH:mm') : '...'}
                                                {interval.duration_seconds ? ` (${fmtDuration(interval.duration_seconds)})` : ''}
                                            </Typography>
                                        );
                                    })}
                            </Box>
                        ))}
                    </Box>
                </Collapse>
            )}
        </Box>
    );
}

export interface BillReceiptDetailProps {
    billData: any;
    cafeTableMap: Map<string, string | number>;
    t: (key: string) => string;
}

// Receipt-style rendering of a single bill, used as the GenericViewModal sidebar content
export function BillReceiptDetail({ billData, cafeTableMap, t }: BillReceiptDetailProps) {
    if (!billData) return null;

    const paymentTypeLabel =
        billData.payment_type === 'cash'
            ? t('bills.cash')
            : billData.payment_type === 'card'
                ? t('bills.card')
                : '-';

    const statusChipColor: 'info' | 'warning' | 'success' =
        billData.bill_status === 'opened'
            ? 'info'
            : billData.bill_status === 'closed'
                ? 'warning'
                : 'success';

    const statusLabel =
        billData.bill_status === 'opened'
            ? t('bills.opened') || 'Opened'
            : billData.bill_status === 'closed'
                ? t('bills.closed') || 'Closed'
                : t('bills.paid') || 'Paid';

    const pricePerHour = Number(billData.price_per_hour) > 0 ? Number(billData.price_per_hour) : undefined;

    return (
        <Box sx={{ mx: 'auto', fontFamily: 'var(--font-mono)', fontSize: '1rem' }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 1.5 }}>
                <Typography sx={{ fontFamily: 'inherit', fontWeight: 700, fontSize: '1.3rem' }}>
                    {t('bills.billNo') || 'Bill #'} {billData.bill_no}
                </Typography>
                <Chip label={statusLabel} size="small" color={statusChipColor} variant="soft" sx={{ mt: 0.5 }} />
                <Box sx={{ mt: 1, color: 'text.secondary', fontSize: '0.95rem' }}>
                    <Box>{billData.opened_at ? dayjs(billData.opened_at).format('DD.MM.YYYY HH:mm') : '-'}</Box>
                    <Box>
                        {billData.hall_name || '-'} · {t('bills.table')} {billData.table_number ?? '-'}
                        {Number(billData.guest_count) > 0 ? ` · ${billData.guest_count} ${t('bills.guests')}` : ''}
                    </Box>
                    {billData.waiter_name && (
                        <Box>
                            {t('bills.waiter')}: {billData.waiter_name}
                        </Box>
                    )}
                </Box>
            </Box>

            <ReceiptDivider />

            {/* Items */}
            {billData.items && billData.items.length > 0 && (
                <Box sx={{ mb: 1.5 }}>
                    <ReceiptSectionLabel>{t('bills.items') || 'Items'}</ReceiptSectionLabel>
                    {billData.items.map((item: any, index: number) => {
                        const total = Number(item.price) * item.quantity;
                        const valueText = `${item.quantity} × ${fmtNum(Number(item.price))} = ${fmtNum(total)}`;

                        return (
                            <Box key={item.id || index} sx={{ mb: 0.75 }}>
                                <ReceiptRow label={item.good_name} labelColor="primary.main" value={valueText} />
                            </Box>
                        );
                    })}
                </Box>
            )}

            {/* Table charges */}
            {billData.table_sessions && billData.table_sessions.length > 0 && (
                <Box>
                    <ReceiptSectionLabel>{t('bills.tableCharge') || 'Table Charge'}</ReceiptSectionLabel>
                    {billData.table_sessions.map((session: any, sessionIndex: number) => {
                        const tableLabel =
                            session.table_id === billData.table_id
                                ? billData.table_number
                                : cafeTableMap.get(session.table_id) ?? session.table_id?.slice(0, 8);

                        return (
                            <SessionReceiptLine
                                key={session.session_id || sessionIndex}
                                session={session}
                                tableLabel={tableLabel}
                                pricePerHour={pricePerHour}
                                t={t}
                            />
                        );
                    })}
                </Box>
            )}

            <ReceiptDivider />

            {/* Totals */}
            <Box>
                <ReceiptRow label={t('bills.foodTotal') || 'Food Total'} value={fmtNum(Number(billData.food_total))} />
                {Number(billData.food_cost) > 0 && (
                    <Typography variant="caption" sx={{ fontFamily: 'inherit', fontSize: '0.85rem', color: 'text.secondary', display: 'block', mb: 0.5 }}>
                        {t('bills.foodCost')}: {fmtNum(Number(billData.food_cost))}
                    </Typography>
                )}
                {billData.table_type === 'time_based' && Number(billData.table_amount) > 0 && (
                    <ReceiptRow label={t('bills.tableAmount')} value={fmtNum(Number(billData.table_amount))} />
                )}
                {Number(billData.service_amount) > 0 && (
                    <ReceiptRow
                        label={`${t('bills.service') || 'Service'} (${billData.service_percent}%)`}
                        value={`+${fmtNum(Number(billData.service_amount))}`}
                    />
                )}
                {Number(billData.discount_amount) > 0 && (
                    <ReceiptRow
                        label={t('bills.discount') || 'Discount'}
                        value={`-${fmtNum(Number(billData.discount_amount))}`}
                        color="var(--success)"
                    />
                )}
            </Box>

            <Box sx={{ borderTop: '3px double', borderColor: 'text.primary', mt: 1, pt: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontFamily: 'inherit', fontWeight: 700, fontSize: '1.25rem' }}>
                        {t('bills.grandTotal') || 'Grand Total'}
                    </Typography>
                    <Typography sx={{ fontFamily: 'inherit', fontWeight: 700, fontSize: '1.25rem' }}>
                        {fmtNum(Number(billData.grand_total))}
                    </Typography>
                </Box>
            </Box>

            <ReceiptDivider />

            {/* Footer */}
            <Box sx={{ color: 'text.secondary', fontSize: '0.95rem' }}>
                <ReceiptRow label={t('bills.paymentType') || 'Payment Type'} value={paymentTypeLabel} />
                {billData.closed_at && (
                    <ReceiptRow label={t('bills.closedAt')} value={dayjs(billData.closed_at).format('DD.MM.YYYY HH:mm')} />
                )}
                {billData.comment && (
                    <Typography variant="caption" sx={{ fontFamily: 'inherit', fontSize: '0.85rem', display: 'block', mt: 1, fontStyle: 'italic' }}>
                        {billData.comment}
                    </Typography>
                )}
            </Box>
        </Box>
    );
}
