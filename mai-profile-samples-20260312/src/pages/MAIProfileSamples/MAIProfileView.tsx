import React, { useState } from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';

// ─── Style Constants ─────────────────────────────────────────────────

const styles = {
    headerBar: {
        backgroundColor: '#F8F9FA',
        borderRadius: '12px',
        padding: '16px 24px',
        marginBottom: '24px',
        border: '1px solid #E9ECEF',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap' as const,
        gap: '12px',
    } as React.CSSProperties,
    headerLabel: {
        fontSize: '0.8rem',
        color: '#8E8E93',
        marginBottom: '2px',
    } as React.CSSProperties,
    headerValue: {
        fontSize: '1rem',
        fontWeight: '600',
        color: '#1C1C1E',
        fontFamily: 'monospace',
    } as React.CSSProperties,
    biographyCard: {
        backgroundColor: '#1A1B2E',
        borderRadius: '16px',
        border: 'none',
        marginBottom: '24px',
        overflow: 'hidden',
    } as React.CSSProperties,
    biographyTitle: {
        color: '#FFFFFF',
        fontSize: '1.25rem',
        fontWeight: '700',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    } as React.CSSProperties,
    biographyText: {
        color: '#C7C8D1',
        fontSize: '0.92rem',
        lineHeight: '1.7',
        marginBottom: '12px',
    } as React.CSSProperties,
    sectionCard: {
        borderRadius: '16px',
        border: '1px solid #E9ECEF',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
        marginBottom: '24px',
        overflow: 'hidden',
    } as React.CSSProperties,
    sectionTitle: {
        fontSize: '1.1rem',
        fontWeight: '600',
        color: '#1C1C1E',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    } as React.CSSProperties,
    factLabel: {
        fontSize: '0.75rem',
        color: '#8E8E93',
        marginBottom: '4px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
    } as React.CSSProperties,
    factValue: {
        fontSize: '0.95rem',
        fontWeight: '600',
        color: '#1C1C1E',
    } as React.CSSProperties,
    tag: {
        display: 'inline-block',
        padding: '4px 12px',
        backgroundColor: '#F2F2F7',
        borderRadius: '16px',
        fontSize: '0.8rem',
        color: '#1C1C1E',
        marginRight: '6px',
        marginBottom: '6px',
        fontWeight: '500',
    } as React.CSSProperties,
    interestCard: {
        borderRadius: '12px',
        border: '1px solid #E9ECEF',
        padding: '16px',
        marginBottom: '16px',
        backgroundColor: '#FFFFFF',
    } as React.CSSProperties,
    interestName: {
        fontSize: '1.05rem',
        fontWeight: '700',
        marginBottom: '4px',
    } as React.CSSProperties,
    confidenceBadge: {
        fontSize: '0.78rem',
        fontWeight: '600',
        padding: '3px 10px',
        borderRadius: '12px',
    } as React.CSSProperties,
    metaLabel: {
        color: '#8E8E93',
        marginRight: '4px',
    } as React.CSSProperties,
    metaValue: {
        fontWeight: '600',
        color: '#1C1C1E',
    } as React.CSSProperties,
};

// ─── Helpers ─────────────────────────────────────────────────────────

const confidenceColorMap: Record<string, { text: string; border: string; badgeBg: string }> = {
    high: { text: '#E53E3E', border: '#FEB2B2', badgeBg: '#FED7D7' },
    medium: { text: '#1C1C1E', border: '#E2E8F0', badgeBg: '#F7FAFC' },
    low: { text: '#718096', border: '#E2E8F0', badgeBg: '#F7FAFC' },
};

function getConfidenceLevel(score: number | undefined): string {
    if (score == null) return 'low';
    if (score >= 0.75) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
}

function getConfidencePercent(score: number | undefined): number {
    return score != null ? Math.round(score * 100) : 0;
}

function getConfidenceBadgeStyle(level: string): React.CSSProperties {
    const c = confidenceColorMap[level] || confidenceColorMap.medium;
    return { ...styles.confidenceBadge, backgroundColor: c.badgeBg, color: c.text, border: `1px solid ${c.border}` };
}

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

function formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr + 'T00:00:00');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    } catch {
        return dateStr;
    }
}

// ─── Sub-Components ──────────────────────────────────────────────────

function HeaderBar({ userId, data }: { userId: string; data: any }) {
    const window = data.Window?.AllTime;
    return (
        <div style={styles.headerBar}>
            <div>
                <div style={styles.headerLabel}>User ID</div>
                <div style={styles.headerValue}>{userId}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
                <div style={styles.headerLabel}>Date Range</div>
                <div style={{ ...styles.headerValue, fontFamily: 'monospace' }}>
                    {formatDate(window?.FromDate)} — {formatDate(window?.ToDate)}
                </div>
            </div>
            <div>
                <div style={styles.headerLabel}>As Of Date</div>
                <div style={{ ...styles.headerValue, fontFamily: 'monospace' }}>{data.AsOfDate || '—'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
                <div style={styles.headerLabel}>Version</div>
                <div style={{ ...styles.headerValue, fontSize: '0.85rem' }}>{data.Version || '—'}</div>
            </div>
        </div>
    );
}

function BiographySection({ biography }: { biography: any }) {
    const summary = biography?.Summary;
    if (!summary) return null;
    const paragraphs = summary.split(/(?<=[.!?])\s+(?=[A-Z])/);

    return (
        <Card style={styles.biographyCard}>
            <Card.Body style={{ padding: '24px 28px' }}>
                <div style={styles.biographyTitle}>
                    <span>Biography</span>
                </div>
                {paragraphs.map((para: string, i: number) => (
                    <p key={i} style={styles.biographyText}>{para}</p>
                ))}
            </Card.Body>
        </Card>
    );
}

function FactsSection({ facts, demographics }: { facts: any; demographics: any }) {
    const lifeStage = facts?.LifeStage;
    const hasAny = facts || demographics;
    if (!hasAny) return null;

    return (
        <Card style={styles.sectionCard}>
            <Card.Body style={{ padding: '20px 28px' }}>
                <div style={styles.sectionTitle}>
                    <span style={{ fontSize: '1.2rem' }}>⚡</span>
                    <span>Facts</span>
                </div>

                <Row style={{ marginTop: '16px' }}>
                    <Col md={3} style={{ marginBottom: '16px' }}>
                        <div style={styles.factLabel}><span>📅</span> Age</div>
                        <div style={styles.factValue}>{demographics?.Age || '—'}</div>
                    </Col>
                    <Col md={3} style={{ marginBottom: '16px' }}>
                        <div style={styles.factLabel}><span>👤</span> Gender</div>
                        <div style={styles.factValue}>{demographics?.Gender || '—'}</div>
                    </Col>
                    <Col md={3} style={{ marginBottom: '16px' }}>
                        <div style={styles.factLabel}><span>📍</span> Current Location</div>
                        <div style={styles.factValue}>{demographics?.CurrentLocation || '—'}</div>
                    </Col>
                    <Col md={3} style={{ marginBottom: '16px' }}>
                        <div style={styles.factLabel}><span>👤</span> Life Stage</div>
                        <div style={styles.factValue}>
                            {lifeStage?.value ? capitalize(lifeStage.value) : '—'}
                            {lifeStage?.confidence && (
                                <span style={{ fontSize: '0.75rem', color: '#8E8E93', marginLeft: '6px' }}>
                                    ({lifeStage.confidence})
                                </span>
                            )}
                        </div>
                    </Col>
                </Row>

                {demographics?.RecentVisit && demographics.RecentVisit.length > 0 && (
                    <Row>
                        <Col md={12} style={{ marginBottom: '16px' }}>
                            <div style={styles.factLabel}><span>📍</span> Recent Visits</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                                {demographics.RecentVisit.map((v: string, i: number) => (
                                    <span key={i} style={styles.tag}>{v}</span>
                                ))}
                            </div>
                        </Col>
                    </Row>
                )}
            </Card.Body>
        </Card>
    );
}

function InterestCard({ interest }: { interest: any }) {
    const [showEvidence, setShowEvidence] = useState(false);
    const [showTopics, setShowTopics] = useState(false);
    const score = getConfidencePercent(interest.ConfidenceScore);
    const level = interest.ConfidenceLevel || getConfidenceLevel(interest.ConfidenceScore);

    const labelStyle: React.CSSProperties = {
        fontSize: '0.7rem', fontWeight: '600', color: '#8E8E93',
        textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '6px',
    };

    const evidence: any[] = interest.Evidence || [];
    const topics: any[] = interest.Topics || [];
    const temporalStats = interest.TemporalStats;

    return (
        <div style={styles.interestCard}>
            {/* Title + Confidence */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ ...styles.interestName, color: '#1C1C1E' }}>{interest.InterestName || '—'}</div>
                <span style={getConfidenceBadgeStyle(level)}>{score}%</span>
            </div>

            {/* Persona */}
            {interest.Persona && (
                <>
                    <div style={{ ...labelStyle, marginBottom: '4px' }}>PERSONA</div>
                    <p style={{ fontSize: '0.84rem', color: '#4A5568', lineHeight: '1.5', marginBottom: '10px' }}>
                        {interest.Persona}
                    </p>
                </>
            )}

            {/* Metadata grid */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'auto auto auto auto',
                gap: '6px 20px', fontSize: '0.78rem', marginBottom: '12px',
                padding: '10px 12px', backgroundColor: '#F8F9FA', borderRadius: '8px', border: '1px solid #E9ECEF',
            }}>
                <span style={styles.metaLabel}>State</span>
                <span style={styles.metaValue}>{interest.State ? capitalize(interest.State) : '—'}</span>
                <span style={styles.metaLabel}>Temporal</span>
                <span style={styles.metaValue}>{interest.TemporalType ? capitalize(interest.TemporalType) : '—'}</span>

                <span style={styles.metaLabel}>Strength</span>
                <span style={styles.metaValue}>{interest.Strength != null ? interest.Strength.toFixed(3) : '—'}</span>
                <span style={styles.metaLabel}>Decay</span>
                <span style={styles.metaValue}>{interest.DecayRate != null ? interest.DecayRate : '—'}</span>
            </div>

            {/* Intention */}
            <div style={labelStyle}>INTENTION</div>
            <p style={{ fontSize: '0.82rem', color: '#4A5568', lineHeight: '1.5', marginBottom: '6px' }}>
                <strong style={{ color: '#1C1C1E' }}>Actual:</strong> {interest.ActualActivity || '—'}
            </p>
            <p style={{ fontSize: '0.82rem', color: '#6B7280', lineHeight: '1.5', marginBottom: '10px' }}>
                <strong style={{ color: '#6B7280' }}>Inferred:</strong> {interest.IntentionInferred || '—'}
            </p>

            {/* Temporal Stats */}
            <div style={{ display: 'flex', gap: '24px', fontSize: '0.78rem', color: '#6C757D', borderTop: '1px solid #F2F2F7', paddingTop: '10px', flexWrap: 'wrap' }}>
                <div>
                    <div style={{ fontSize: '0.68rem', color: '#ADB5BD' }}>First Detect</div>
                    <div style={{ fontWeight: '600', color: '#1C1C1E' }}>{interest.FirstDetectDate || '—'}</div>
                </div>
                <div>
                    <div style={{ fontSize: '0.68rem', color: '#ADB5BD' }}>Last Detect</div>
                    <div style={{ fontWeight: '600', color: '#1C1C1E' }}>{interest.LastDetectDate || '—'}</div>
                </div>
                <div>
                    <div style={{ fontSize: '0.68rem', color: '#ADB5BD' }}>Lifetime</div>
                    <div style={{ fontWeight: '600', color: '#1C1C1E' }}>{interest.LifetimeDays != null ? `${interest.LifetimeDays}d` : '—'}</div>
                </div>
                {temporalStats && (
                    <>
                        <div>
                            <div style={{ fontSize: '0.68rem', color: '#ADB5BD' }}>Recency</div>
                            <div style={{ fontWeight: '600', color: '#1C1C1E' }}>{temporalStats.RecencyDays}d</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.68rem', color: '#ADB5BD' }}>Active Days</div>
                            <div style={{ fontWeight: '600', color: '#1C1C1E' }}>{temporalStats.ActiveDays}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.68rem', color: '#ADB5BD' }}>Events</div>
                            <div style={{ fontWeight: '600', color: '#1C1C1E' }}>{temporalStats.EventCount}</div>
                        </div>
                    </>
                )}
            </div>

            {/* Topics – collapsible */}
            {topics.length > 0 && (
                <div style={{ marginTop: '10px', borderTop: '1px solid #F2F2F7', paddingTop: '8px' }}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setShowTopics(!showTopics); }}
                        style={{ fontSize: '0.8rem', color: '#0d6efd', textDecoration: 'none', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {showTopics ? '▾' : '▸'} Topics ({topics.length})
                    </a>
                    {showTopics && (
                        <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {topics.map((t: any, i: number) => (
                                <span key={i} style={{ ...styles.tag, backgroundColor: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE' }}>
                                    {t.Topic}{t.Weight != null ? ` (${t.Weight})` : ''}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Evidence – collapsible */}
            {evidence.length > 0 && (
                <div style={{ marginTop: '8px', borderTop: '1px solid #F2F2F7', paddingTop: '8px' }}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setShowEvidence(!showEvidence); }}
                        style={{ fontSize: '0.8rem', color: '#0d6efd', textDecoration: 'none', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {showEvidence ? '▾' : '▸'} Evidence ({evidence.length})
                    </a>
                    {showEvidence && (
                        <div style={{ marginTop: '8px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #E9ECEF', borderRadius: '8px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#F8F9FA' }}>
                                        <th style={{ padding: '6px 10px', borderBottom: '1px solid #DEE2E6', textAlign: 'left', color: '#6C757D', fontWeight: '600' }}>Date</th>
                                        <th style={{ padding: '6px 10px', borderBottom: '1px solid #DEE2E6', textAlign: 'left', color: '#6C757D', fontWeight: '600' }}>Source</th>
                                        <th style={{ padding: '6px 10px', borderBottom: '1px solid #DEE2E6', textAlign: 'left', color: '#6C757D', fontWeight: '600' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {evidence.map((e: any, i: number) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #F2F2F7' }}>
                                            <td style={{ padding: '5px 10px', color: '#495057', whiteSpace: 'nowrap' }}>{e.date}</td>
                                            <td style={{ padding: '5px 10px', color: '#495057' }}>{e.source}</td>
                                            <td style={{ padding: '5px 10px', color: '#495057' }}>{e.action}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function InterestsSection({ interests }: { interests: any[] }) {
    if (interests.length === 0) return null;

    const high = interests.filter(t => (t.ConfidenceLevel || getConfidenceLevel(t.ConfidenceScore)) === 'high')
        .sort((a, b) => (b.ConfidenceScore ?? 0) - (a.ConfidenceScore ?? 0));
    const medium = interests.filter(t => (t.ConfidenceLevel || getConfidenceLevel(t.ConfidenceScore)) === 'medium')
        .sort((a, b) => (b.ConfidenceScore ?? 0) - (a.ConfidenceScore ?? 0));
    const low = interests.filter(t => (t.ConfidenceLevel || getConfidenceLevel(t.ConfidenceScore)) === 'low')
        .sort((a, b) => (b.ConfidenceScore ?? 0) - (a.ConfidenceScore ?? 0));

    const colStyle: React.CSSProperties = { flex: 1, minWidth: 0 };

    return (
        <Card style={styles.sectionCard}>
            <Card.Body style={{ padding: '20px 28px' }}>
                <div style={styles.sectionTitle}>
                    <span style={{ fontSize: '1.2rem' }}>❤️</span>
                    <span>Interests</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0d6efd' }}>{interests.length}</span>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', marginTop: '12px' }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Badge bg="danger" style={{ fontSize: '0.72rem', padding: '4px 10px' }}>High</Badge>
                        <span style={{ fontSize: '0.75rem', color: '#8E8E93' }}>({high.length})</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Badge bg="secondary" style={{ fontSize: '0.72rem', padding: '4px 10px', backgroundColor: '#E2E8F0', color: '#1C1C1E' }}>Medium</Badge>
                        <span style={{ fontSize: '0.75rem', color: '#8E8E93' }}>({medium.length})</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Badge bg="light" text="dark" style={{ fontSize: '0.72rem', padding: '4px 10px', border: '1px solid #E2E8F0' }}>Low</Badge>
                        <span style={{ fontSize: '0.75rem', color: '#8E8E93' }}>({low.length})</span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={colStyle}>
                        {high.length > 0 ? high.map((t, i) => <InterestCard key={i} interest={t} />) : (
                            <div style={{ padding: '16px', color: '#ADB5BD', fontSize: '0.85rem', textAlign: 'center' }}>None</div>
                        )}
                    </div>
                    <div style={colStyle}>
                        {medium.length > 0 ? medium.map((t, i) => <InterestCard key={i} interest={t} />) : (
                            <div style={{ padding: '16px', color: '#ADB5BD', fontSize: '0.85rem', textAlign: 'center' }}>None</div>
                        )}
                    </div>
                    <div style={colStyle}>
                        {low.length > 0 ? low.map((t, i) => <InterestCard key={i} interest={t} />) : (
                            <div style={{ padding: '16px', color: '#ADB5BD', fontSize: '0.85rem', textAlign: 'center' }}>None</div>
                        )}
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
}

// ─── Main Component ──────────────────────────────────────────────────

interface MAIProfileViewProps {
    data: any;
    userId: string;
}

export default function MAIProfileView({ data, userId }: MAIProfileViewProps) {
    const interests = data.Interests?.Interests || [];
    return (
        <div>
            <HeaderBar userId={userId} data={data} />
            <BiographySection biography={data.Biography} />
            <FactsSection facts={data.Facts} demographics={data._demographics} />
            <InterestsSection interests={interests} />
        </div>
    );
}
