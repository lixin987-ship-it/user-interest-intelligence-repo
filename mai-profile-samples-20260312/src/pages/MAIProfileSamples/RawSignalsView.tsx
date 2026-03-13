import { useState, useMemo } from 'react';
import { Card, Form, Badge, Row, Col } from 'react-bootstrap';
import React from 'react';

// ─── Types ───────────────────────────────────────────────────────────

interface Signal {
    user_id: string;
    date_str: string;
    Date: string;
    Source: string;
    DetailedSource: string;
    Action: string;
    should_filter: boolean;
    intent: string;
    filter_reason: string;
}

interface RawSignalsViewProps {
    signals: Signal[];
}

// ─── Style Constants ─────────────────────────────────────────────────

const styles = {
    tableWrapper: { overflowX: 'auto' as const },
    table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.85rem' },
    th: {
        padding: '10px 14px', backgroundColor: '#F8F9FA', borderBottom: '2px solid #DEE2E6',
        fontWeight: '600', color: '#495057', fontSize: '0.78rem',
        textTransform: 'uppercase' as const, letterSpacing: '0.03em',
        whiteSpace: 'nowrap' as const, position: 'sticky' as const, top: 0,
    } as React.CSSProperties,
    td: {
        padding: '10px 14px', borderBottom: '1px solid #F2F2F7', color: '#1C1C1E', verticalAlign: 'top' as const,
    } as React.CSSProperties,
    filterRow: { backgroundColor: '#FFF8F0', opacity: 0.7 },
    statsCard: {
        backgroundColor: '#F8F9FA', borderRadius: '12px', padding: '16px 20px',
        border: '1px solid #E9ECEF', textAlign: 'center' as const,
    },
    statsLabel: {
        fontSize: '0.72rem', color: '#8E8E93', textTransform: 'uppercase' as const,
        letterSpacing: '0.04em', marginBottom: '4px',
    } as React.CSSProperties,
    statsValue: { fontSize: '1.3rem', fontWeight: '700', color: '#1C1C1E' } as React.CSSProperties,
};

const sourceColorMap: Record<string, string> = {
    'MSN': '#0d6efd', 'Bing': '#198754', 'Uet': '#fd7e14', 'Ads': '#dc3545', 'Edge': '#6f42c1',
};

// ─── Component ───────────────────────────────────────────────────────

export default function RawSignalsView({ signals }: RawSignalsViewProps) {
    const [sourceFilter, setSourceFilter] = useState<string>('all');
    const [filterFilter, setFilterFilter] = useState<string>('all');
    const [dateSortOrder, setDateSortOrder] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const PAGE_SIZE = 50;

    const uniqueSources = useMemo(() => [...new Set(signals.map(s => s.Source))].sort(), [signals]);

    const filteredSignals = useMemo(() => {
        const result = signals.filter(s => {
            if (sourceFilter !== 'all' && s.Source !== sourceFilter) return false;
            if (filterFilter === 'yes' && !s.should_filter) return false;
            if (filterFilter === 'no' && s.should_filter) return false;
            return true;
        });
        result.sort((a, b) => {
            const cmp = a.Date.localeCompare(b.Date);
            return dateSortOrder === 'asc' ? cmp : -cmp;
        });
        return result;
    }, [signals, sourceFilter, filterFilter, dateSortOrder]);

    const totalPages = Math.max(1, Math.ceil(filteredSignals.length / PAGE_SIZE));
    const pagedSignals = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredSignals.slice(start, start + PAGE_SIZE);
    }, [filteredSignals, currentPage]);

    // Reset page when filters change
    useMemo(() => { setCurrentPage(1); }, [sourceFilter, filterFilter, dateSortOrder]);

    const totalCount = signals.length;
    const filteredCount = signals.filter(s => s.should_filter).length;
    const activeDays = new Set(signals.map(s => s.Date)).size;

    return (
        <div>
            {/* Stats */}
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

            {/* Table */}
            <Card style={{ borderRadius: '12px', border: '1px solid #E9ECEF', overflow: 'hidden' }}>
                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={{ ...styles.th, cursor: 'pointer', userSelect: 'none' }}
                                    onClick={() => setDateSortOrder(o => o === 'asc' ? 'desc' : 'asc')}>
                                    Date {dateSortOrder === 'asc' ? '▲' : '▼'}
                                </th>
                                <th style={styles.th}>Source</th>
                                <th style={styles.th}>Detailed Source</th>
                                <th style={{ ...styles.th, minWidth: '300px' }}>Action</th>
                                <th style={styles.th}>Intent</th>
                                <th style={styles.th}>Should Filter</th>
                                <th style={styles.th}>Filter Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pagedSignals.map((sig, idx) => (
                                <tr key={idx} style={sig.should_filter ? styles.filterRow : undefined}>
                                    <td style={{ ...styles.td, whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                                        {sig.Date}
                                    </td>
                                    <td style={styles.td}>
                                        <Badge style={{
                                            backgroundColor: sourceColorMap[sig.Source] || '#6C757D',
                                            fontSize: '0.75rem', padding: '4px 10px', fontWeight: '500',
                                        }}>
                                            {sig.Source}
                                        </Badge>
                                    </td>
                                    <td style={{ ...styles.td, fontSize: '0.82rem', color: '#495057' }}>
                                        {sig.DetailedSource}
                                    </td>
                                    <td style={{ ...styles.td, fontSize: '0.84rem', maxWidth: '400px' }}>
                                        {sig.Action}
                                    </td>
                                    <td style={styles.td}>
                                        {sig.intent && (
                                            <span style={{
                                                display: 'inline-block', padding: '3px 10px', borderRadius: '12px',
                                                fontSize: '0.75rem', fontWeight: '600',
                                                backgroundColor: '#F2F2F7', color: '#1C1C1E',
                                            }}>
                                                {sig.intent}
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ ...styles.td, textAlign: 'center' }}>
                                        {sig.should_filter ? (
                                            <Badge bg="warning" text="dark" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>Yes</Badge>
                                        ) : (
                                            <Badge bg="light" text="dark" style={{ fontSize: '0.72rem', padding: '3px 8px', border: '1px solid #DEE2E6' }}>No</Badge>
                                        )}
                                    </td>
                                    <td style={{ ...styles.td, fontSize: '0.78rem', color: '#6C757D' }}>
                                        {sig.filter_reason || ''}
                                    </td>
                                </tr>
                            ))}
                            {pagedSignals.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ ...styles.td, textAlign: 'center', color: '#ADB5BD', padding: '40px' }}>
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
                    {(() => {
                        // Show at most 7 page buttons
                        const maxButtons = 7;
                        let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
                        const end = Math.min(totalPages, start + maxButtons - 1);
                        if (end - start + 1 < maxButtons) start = Math.max(1, end - maxButtons + 1);
                        return Array.from({ length: end - start + 1 }, (_, i) => start + i).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #DEE2E6', backgroundColor: page === currentPage ? '#0d6efd' : '#fff', color: page === currentPage ? '#fff' : '#495057', cursor: 'pointer', fontSize: '0.82rem', fontWeight: page === currentPage ? '600' : '400' }}
                            >
                                {page}
                            </button>
                        ));
                    })()}
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
