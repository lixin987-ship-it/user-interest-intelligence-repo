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

interface RawSignalsViewProps {
    userId: string;
}

// ─── Fake Data ───────────────────────────────────────────────────────

const FAKE_SIGNALS: RawSignal[] = [
    { date: '2026-01-14', source: 'MSN', userAction: 'MSN View', details: 'A new US AI effort draws in Microsoft, Google, and two dozen major firms', shouldFilter: false, intent: 'stay_updated' },
    { date: '2026-01-14', source: 'MSN', userAction: 'MSN View', details: 'Why the future of AI & computers will be analog', shouldFilter: false, intent: 'stay_updated' },
    { date: '2026-01-14', source: 'MSN', userAction: 'MSN View', details: 'Unveiling the mind of Jensen Huang | A genius behind Nvidia success', shouldFilter: false, intent: 'stay_updated' },
    { date: '2026-01-14', source: 'Bing', userAction: 'Bing Search web', details: 'msft', shouldFilter: false, intent: 'lookup' },
    { date: '2026-01-14', source: 'Bing', userAction: 'Bing Search Spotlight', details: 'Glencar Lough, Ireland', shouldFilter: true, intent: 'explore' },
    { date: '2026-01-14', source: 'Uet', userAction: 'UetEvents', details: 'Akris Reversible Cashmere Single-Breasted Jacket | Neiman Marcus', shouldFilter: false, intent: 'shopping' },
    { date: '2026-01-14', source: 'Uet', userAction: 'UetEvents', details: 'Microsoft Copilot: Your AI companion', shouldFilter: true, intent: 'explore' },
    { date: '2026-01-14', source: 'MSN', userAction: 'MSN View', details: 'What ingredients are in this vegan tofu dish?', shouldFilter: false, intent: 'learn' },
    { date: '2026-01-14', source: 'MSN', userAction: 'MSN View', details: 'Ultimate comfort food: Chicken Parmesan', shouldFilter: false, intent: 'learn' },
    { date: '2026-01-13', source: 'MSN', userAction: 'MSN View', details: 'Baking Barack Obama\'s Famous Crack Pie', shouldFilter: false, intent: 'learn' },
    { date: '2026-01-13', source: 'Bing', userAction: 'Bing Search Spotlight', details: 'Heceta Head Lighthouse State Scenic Viewpoint, Oregon', shouldFilter: true, intent: 'explore' },
    { date: '2026-01-13', source: 'Uet', userAction: 'UetEvents', details: 'Eggshell Recycled Nylon Stand Collar Jacket | EILEEN FISHER', shouldFilter: false, intent: 'shopping' },
    { date: '2026-01-10', source: 'MSN', userAction: 'MSN View', details: 'AI is intensifying a \'collapse\' of trust online, experts say', shouldFilter: false, intent: 'stay_updated' },
    { date: '2026-01-10', source: 'MSN', userAction: 'MSN View', details: 'Cursor\'s most important AI features started as side projects', shouldFilter: false, intent: 'stay_updated' },
    { date: '2026-01-09', source: 'Uet', userAction: 'UetEvents', details: 'Conversations that Convert: Copilot Checkout and Brand Agents | Microsoft Advertising', shouldFilter: true, intent: 'explore' },
    { date: '2026-01-08', source: 'Bing', userAction: 'Bing Search Spotlight', details: 'Green Mountain National Forest, Vermont', shouldFilter: true, intent: 'explore' },
    { date: '2026-01-08', source: 'Bing', userAction: 'Bing Search Spotlight', details: 'Lake Titicaca, Bolivia', shouldFilter: true, intent: 'explore' },
    { date: '2026-01-05', source: 'MSN', userAction: 'MSN Upvote', details: 'CES 2026 highlights AI, robotics, and Micro RGB', shouldFilter: false, intent: 'stay_updated' },
    { date: '2026-01-03', source: 'MSN', userAction: 'MSN Upvote', details: 'Nvidia and TSMC dominate AI investment landscape', shouldFilter: false, intent: 'stay_updated' },
    { date: '2026-01-02', source: 'Bing', userAction: 'Bing Search web', details: 'getting an openai api key', shouldFilter: false, intent: 'learn' },
    { date: '2026-01-01', source: 'Bing', userAction: 'Bing Search web Clicked', details: 'Visual Studio Code - The open source AI code editor', shouldFilter: false, intent: 'learn' },
    { date: '2026-01-01', source: 'Bing', userAction: 'Bing Search web', details: 'Visual Studio Code', shouldFilter: false, intent: 'learn' },
    { date: '2026-01-01', source: 'Bing', userAction: 'Bing Search web', details: 'microsoft stock', shouldFilter: false, intent: 'lookup' },
    { date: '2026-01-01', source: 'Uet', userAction: 'UetEvents', details: 'Designer Sale: Designer Brands on Sale - Bloomingdale\'s', shouldFilter: false, intent: 'shopping' },
    { date: '2026-01-01', source: 'Uet', userAction: 'UetEvents', details: 'Women\'s Luxury Clothing & Shoes On Sale | Vince', shouldFilter: false, intent: 'shopping' },
    { date: '2026-01-01', source: 'Uet', userAction: 'UetEvents', details: 'Microsoft Copilot: Your AI companion', shouldFilter: true, intent: 'explore' },
];

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

export default function RawSignalsView({ userId: _userId }: RawSignalsViewProps) {
    const [sourceFilter, setSourceFilter] = useState<string>('all');
    const [intentFilter, setIntentFilter] = useState<string>('all');
    const [showFiltered, setShowFiltered] = useState<boolean>(true);

    const signals = FAKE_SIGNALS;

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
                        <Col md={3}>
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
                                <th style={styles.th}>Should Filter</th>
                                <th style={styles.th}>Intent</th>
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
                                    <td style={{ ...styles.td, textAlign: 'center' }}>
                                        {sig.shouldFilter ? (
                                            <Badge bg="warning" text="dark" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>Yes</Badge>
                                        ) : (
                                            <Badge bg="light" text="dark" style={{ fontSize: '0.72rem', padding: '3px 8px', border: '1px solid #DEE2E6' }}>No</Badge>
                                        )}
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
