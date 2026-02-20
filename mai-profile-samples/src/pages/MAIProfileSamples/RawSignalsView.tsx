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
}

// ─── CSV Discovery & Parsing ─────────────────────────────────────────

// Discover all CSV files in the Data directory at build time
const csvFiles = import.meta.glob('./Data/*.csv', { eager: true, query: '?raw', import: 'default' });

// Parse CSV filename: RawSignal_{UserId}_v{Date}_{Days}days.csv
function parseCsvFiles(files: Record<string, unknown>): CsvFileEntry[] {
    const entries: CsvFileEntry[] = [];
    for (const path of Object.keys(files)) {
        const filename = path.split('/').pop()?.replace('.csv', '') || '';
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

    // Skip header: userId,dateStr,source,action,should_filter,intent
    const signals: RawSignal[] = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Parse CSV respecting quoted fields
        const fields = parseCsvLine(line);
        if (fields.length < 6) continue;

        const [, dateStr, source, action, shouldFilter, intent] = fields;
        signals.push({
            date: dateStr,
            source,
            userAction: source,
            details: action,
            shouldFilter: shouldFilter === 'true',
            intent: intent || '',
        });
    }
    return signals;
}

/** Simple CSV line parser that handles quoted fields with commas */
function parseCsvLine(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === ',' && !inQuotes) {
            fields.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    fields.push(current);
    return fields;
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

export default function RawSignalsView({ userId }: RawSignalsViewProps) {
    // Discover available CSV files for the current user
    const allCsvEntries = useMemo(() => parseCsvFiles(csvFiles), []);
    const userCsvEntries = useMemo(() => allCsvEntries.filter(e => e.userId === userId), [allCsvEntries, userId]);

    const [selectedCsv, setSelectedCsv] = useState<string>(userCsvEntries[userCsvEntries.length - 1]?.path || '');
    const [sourceFilter, setSourceFilter] = useState<string>('all');
    const [intentFilter, setIntentFilter] = useState<string>('all');
    const [showFiltered, setShowFiltered] = useState<boolean>(true);

    // Parse signals from selected CSV
    const signals = useMemo(() => {
        if (!selectedCsv || !csvFiles[selectedCsv]) return [];
        const csvText = csvFiles[selectedCsv] as string;
        return parseCsvContent(csvText);
    }, [selectedCsv]);

    const uniqueSources = useMemo(() => [...new Set(signals.map(s => s.source))].sort(), [signals]);
    const uniqueIntents = useMemo(() => [...new Set(signals.map(s => s.intent))].sort(), [signals]);

    const filteredSignals = useMemo(() => {
        return signals.filter(s => {
            if (sourceFilter !== 'all' && s.source !== sourceFilter) return false;
            if (intentFilter !== 'all' && s.intent !== intentFilter) return false;
            if (!showFiltered && s.shouldFilter) return false;
            return true;
        });
    }, [signals, sourceFilter, intentFilter, showFiltered]);

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
                                <Form.Label style={{ fontSize: '0.75rem', color: '#8E8E93', marginBottom: '4px' }}>Time</Form.Label>
                                <Form.Select size="sm" value={selectedCsv} onChange={e => { setSelectedCsv(e.target.value); setSourceFilter('all'); setIntentFilter('all'); }}>
                                    {userCsvEntries.length === 0 && <option value="">No data available</option>}
                                    {userCsvEntries.map(e => (
                                        <option key={e.path} value={e.path}>{e.label}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label style={{ fontSize: '0.75rem', color: '#8E8E93', marginBottom: '4px' }}>Source</Form.Label>
                                <Form.Select size="sm" value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
                                    <option value="all">All Sources</option>
                                    {uniqueSources.map(s => <option key={s} value={s}>{s}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label style={{ fontSize: '0.75rem', color: '#8E8E93', marginBottom: '4px' }}>Intent</Form.Label>
                                <Form.Select size="sm" value={intentFilter} onChange={e => setIntentFilter(e.target.value)}>
                                    <option value="all">All Intents</option>
                                    {uniqueIntents.map(i => <option key={i} value={i}>{i}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3} className="d-flex align-items-end" style={{ paddingTop: '20px' }}>
                            <Form.Check
                                type="switch"
                                id="show-filtered"
                                label={<span style={{ fontSize: '0.82rem' }}>Show filtered events</span>}
                                checked={showFiltered}
                                onChange={e => setShowFiltered(e.target.checked)}
                            />
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
                                <th style={styles.th}>Date</th>
                                <th style={styles.th}>Source</th>
                                <th style={styles.th}>User Action</th>
                                <th style={{ ...styles.th, minWidth: '300px' }}>Details</th>
                                <th style={styles.th}>Intent</th>
                                <th style={styles.th}>Should Filter</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSignals.map((sig, idx) => (
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
                            {filteredSignals.length === 0 && (
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
        </div>
    );
}
