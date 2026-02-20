import { useState, useMemo } from 'react';
import { Card, Form, Badge, Row, Col } from 'react-bootstrap';

// ─── Types ───────────────────────────────────────────────────────────

interface RawSignal {
    date: string;
    source: string;
    userAction: string;
    details: string;
    shouldFilter: boolean;
    intent: string;
}

interface CsvFileEntry {
    userId: string;
    days: string;
    version: string;
    path: string;
    label: string;
}

interface RawSignalsViewProps {
    userId: string;
    version: string;
    days: string;
}

// ─── TSV Discovery & Parsing ─────────────────────────────────────────

// Discover all TSV files in the Data directory at build time
const csvFiles = import.meta.glob('./Data/*.tsv', { eager: true, query: '?raw', import: 'default' });

// Parse TSV filename: RawSignal_{UserId}_v{Date}_{Days}days.tsv
function parseCsvFiles(files: Record<string, unknown>): CsvFileEntry[] {
    const entries: CsvFileEntry[] = [];
    for (const path of Object.keys(files)) {
        const filename = path.split('/').pop()?.replace('.tsv', '') || '';
        const match = filename.match(/^RawSignal_(.+?)_v(\d+)_(\d+)days$/);
        if (match) {
            const version = match[2];
            const days = match[3];
            const label = version.length === 8
                ? `${version.slice(0, 4)}-${version.slice(4, 6)}-${version.slice(6, 8)} (${days} days)`
                : `v${version} (${days} days)`;
            entries.push({ userId: match[1], days, version, path, label });
        }
    }
    return entries.sort((a, b) => a.version.localeCompare(b.version));
}

function parseCsvContent(csvText: string): RawSignal[] {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    // Skip header: index, row_id, Date, Source, DetailedSource, Action, should_filter, intent
    const signals: RawSignal[] = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].replace(/\r$/, '');
        if (!line) continue;

        // Parse TSV (tab-separated)
        const fields = line.split('\t');
        if (fields.length < 7) continue;

        const [, , dateStr, source, detailedSource, action, shouldFilter, intent] = fields;
        signals.push({
            date: dateStr,
            source,
            userAction: detailedSource || source,
            details: action,
            shouldFilter: shouldFilter?.toLowerCase() === 'true',
            intent: intent || '',
        });
    }
    return signals;
}

// ─── Style Constants ─────────────────────────────────────────────────

const styles = {
    tableWrapper: {
        overflowX: 'auto' as const,
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse' as const,
        fontSize: '0.85rem',
    },
    th: {
        padding: '10px 14px',
        backgroundColor: '#F8F9FA',
        borderBottom: '2px solid #DEE2E6',
        fontWeight: '600',
        color: '#495057',
        fontSize: '0.78rem',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap' as const,
        position: 'sticky' as const,
        top: 0,
    } as React.CSSProperties,
    td: {
        padding: '10px 14px',
        borderBottom: '1px solid #F2F2F7',
        color: '#1C1C1E',
        verticalAlign: 'top' as const,
    } as React.CSSProperties,
    trHover: {
        backgroundColor: '#F8F9FA',
    },
    filterRow: {
        backgroundColor: '#FFF8F0',
        opacity: 0.7,
    },
    statsCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: '12px',
        padding: '16px 20px',
        border: '1px solid #E9ECEF',
        textAlign: 'center' as const,
    },
    statsLabel: {
        fontSize: '0.72rem',
        color: '#8E8E93',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.04em',
        marginBottom: '4px',
    } as React.CSSProperties,
    statsValue: {
        fontSize: '1.3rem',
        fontWeight: '700',
        color: '#1C1C1E',
    } as React.CSSProperties,
};

const sourceColorMap: Record<string, string> = {
    'MSN': '#0d6efd',
    'Bing': '#198754',
    'Uet': '#fd7e14',
};

const intentColorMap: Record<string, { bg: string; text: string }> = {
    'stay_updated': { bg: '#E8F5E9', text: '#2E7D32' },
    'learn': { bg: '#E3F2FD', text: '#1565C0' },
    'shopping': { bg: '#FFF3E0', text: '#E65100' },
    'lookup': { bg: '#F3E5F5', text: '#7B1FA2' },
    'explore': { bg: '#E0F7FA', text: '#00838F' },
};

// ─── Component ───────────────────────────────────────────────────────

export default function RawSignalsView({ userId, version, days }: RawSignalsViewProps) {
    // Discover available TSV files
    const allCsvEntries = useMemo(() => parseCsvFiles(csvFiles), []);

    // Find the TSV file matching the global version/days selection
    const selectedCsv = useMemo(() => {
        const match = allCsvEntries.find(e => e.userId === userId && e.version === version && e.days === days);
        return match?.path || '';
    }, [allCsvEntries, userId, version, days]);

    const [sourceFilter, setSourceFilter] = useState<string>('all');
    const [filterFilter, setFilterFilter] = useState<string>('all');
    const [dateSortOrder, setDateSortOrder] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const PAGE_SIZE = 40;

    // Parse signals from matched TSV
    const signals = useMemo(() => {
        if (!selectedCsv || !csvFiles[selectedCsv]) return [];
        const csvText = csvFiles[selectedCsv] as string;
        return parseCsvContent(csvText);
    }, [selectedCsv]);

    const uniqueSources = useMemo(() => [...new Set(signals.map(s => s.source))].sort(), [signals]);

    const filteredSignals = useMemo(() => {
        const result = signals.filter(s => {
            if (sourceFilter !== 'all' && s.source !== sourceFilter) return false;
            if (filterFilter === 'yes' && !s.shouldFilter) return false;
            if (filterFilter === 'no' && s.shouldFilter) return false;
            return true;
        });
        result.sort((a, b) => {
            const cmp = a.date.localeCompare(b.date);
            return dateSortOrder === 'asc' ? cmp : -cmp;
        });
        return result;
    }, [signals, sourceFilter, filterFilter, dateSortOrder]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredSignals.length / PAGE_SIZE));
    const pagedSignals = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredSignals.slice(start, start + PAGE_SIZE);
    }, [filteredSignals, currentPage]);

    // Reset page when filters change
    useMemo(() => { setCurrentPage(1); }, [sourceFilter, filterFilter, dateSortOrder, selectedCsv]);

    // Stats
    const totalCount = signals.length;
    const filteredCount = signals.filter(s => s.shouldFilter).length;
    const activeDays = new Set(signals.map(s => s.date)).size;

    return (
        <div>
            {/* Summary Stats */}
            <Row className="mb-3" style={{ gap: '0' }}>
                <Col md={3}>
                    <div style={styles.statsCard}>
                        <div style={styles.statsLabel}>Total Events</div>
                        <div style={styles.statsValue}>{totalCount}</div>
                    </div>
                </Col>
                <Col md={3}>
                    <div style={styles.statsCard}>
                        <div style={styles.statsLabel}>Active Days</div>
                        <div style={styles.statsValue}>{activeDays}</div>
                    </div>
                </Col>
                <Col md={3}>
                    <div style={styles.statsCard}>
                        <div style={styles.statsLabel}>Filtered Events</div>
                        <div style={{ ...styles.statsValue, color: '#E65100' }}>{filteredCount}</div>
                    </div>
                </Col>
                <Col md={3}>
                    <div style={styles.statsCard}>
                        <div style={styles.statsLabel}>Unique Sources</div>
                        <div style={styles.statsValue}>{uniqueSources.length}</div>
                    </div>
                </Col>
            </Row>

            {/* Filters */}
            <Card style={{ borderRadius: '12px', border: '1px solid #E9ECEF', marginBottom: '16px' }}>
                <Card.Body style={{ padding: '12px 20px' }}>
                    <Row className="align-items-center">
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label style={{ fontSize: '0.75rem', color: '#8E8E93', marginBottom: '4px' }}>Source</Form.Label>
                                <Form.Select size="sm" value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
                                    <option value="all">All Sources</option>
                                    {uniqueSources.map(s => <option key={s} value={s}>{s}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label style={{ fontSize: '0.75rem', color: '#8E8E93', marginBottom: '4px' }}>Should Filter</Form.Label>
                                <Form.Select size="sm" value={filterFilter} onChange={e => setFilterFilter(e.target.value)}>
                                    <option value="all">All</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3} className="d-flex align-items-end justify-content-end" style={{ paddingTop: '20px' }}>
                            <span style={{ fontSize: '0.82rem', color: '#8E8E93' }}>
                                Showing {filteredSignals.length} of {totalCount} events
                            </span>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Signal Table */}
            <Card style={{ borderRadius: '12px', border: '1px solid #E9ECEF', overflow: 'hidden' }}>
                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={{ ...styles.th, cursor: 'pointer', userSelect: 'none' }} onClick={() => setDateSortOrder(o => o === 'asc' ? 'desc' : 'asc')}>
                                    Date {dateSortOrder === 'asc' ? '▲' : '▼'}
                                </th>
                                <th style={styles.th}>Source</th>
                                <th style={styles.th}>User Action</th>
                                <th style={{ ...styles.th, minWidth: '300px' }}>Details</th>
                                <th style={styles.th}>Intent</th>
                                <th style={styles.th}>Should Filter</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pagedSignals.map((sig, idx) => (
                                <tr
                                    key={idx}
                                    style={sig.shouldFilter ? styles.filterRow : undefined}
                                >
                                    <td style={{ ...styles.td, whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                                        {sig.date}
                                    </td>
                                    <td style={styles.td}>
                                        <Badge
                                            style={{
                                                backgroundColor: sourceColorMap[sig.source] || '#6C757D',
                                                fontSize: '0.75rem',
                                                padding: '4px 10px',
                                                fontWeight: '500',
                                            }}
                                        >
                                            {sig.source}
                                        </Badge>
                                    </td>
                                    <td style={{ ...styles.td, fontSize: '0.82rem', color: '#495057' }}>
                                        {sig.userAction}
                                    </td>
                                    <td style={{ ...styles.td, fontSize: '0.84rem', maxWidth: '400px' }}>
                                        {sig.details}
                                    </td>
                                    <td style={styles.td}>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '3px 10px',
                                            borderRadius: '12px',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            backgroundColor: intentColorMap[sig.intent]?.bg || '#F2F2F7',
                                            color: intentColorMap[sig.intent]?.text || '#1C1C1E',
                                        }}>
                                            {sig.intent}
                                        </span>
                                    </td>
                                    <td style={{ ...styles.td, textAlign: 'center' }}>
                                        {sig.shouldFilter ? (
                                            <Badge bg="warning" text="dark" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>Yes</Badge>
                                        ) : (
                                            <Badge bg="light" text="dark" style={{ fontSize: '0.72rem', padding: '3px 8px', border: '1px solid #DEE2E6' }}>No</Badge>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {pagedSignals.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ ...styles.td, textAlign: 'center', color: '#ADB5BD', padding: '40px' }}>
                                        No signals match the current filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #DEE2E6', backgroundColor: currentPage === 1 ? '#F8F9FA' : '#fff', cursor: currentPage === 1 ? 'default' : 'pointer', fontSize: '0.82rem', color: '#495057' }}
                    >
                        ← Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #DEE2E6', backgroundColor: page === currentPage ? '#0d6efd' : '#fff', color: page === currentPage ? '#fff' : '#495057', cursor: 'pointer', fontSize: '0.82rem', fontWeight: page === currentPage ? '600' : '400' }}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #DEE2E6', backgroundColor: currentPage === totalPages ? '#F8F9FA' : '#fff', cursor: currentPage === totalPages ? 'default' : 'pointer', fontSize: '0.82rem', color: '#495057' }}
                    >
                        Next →
                    </button>
                    <span style={{ fontSize: '0.78rem', color: '#8E8E93', marginLeft: '8px' }}>
                        Page {currentPage} of {totalPages}
                    </span>
                </div>
            )}
        </div>
    );
}
