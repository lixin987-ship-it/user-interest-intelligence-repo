import React, { useState } from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';

// ─── Type Definitions (V3) ───────────────────────────────────────────

interface V3Topic {
    Topic: string;
    Count: number;
    Source: string[];
    Intent?: string;
    FirstDetectDate?: string;
    LastDetectDate?: string;
    ConfidenceScore?: number;
}

interface V3Interest {
    InterestName: string;
    ActualActivity?: string;
    InterestInferred?: string;
    Topics?: V3Topic[];
    ConfidenceScore?: number;
    FirstDetectDate?: string;
    LastDetectDate?: string;
    Count?: number;
    State?: string;
    Source?: string[];
    Persona?: string;
}

interface V3Demographics {
    CurrentLocation: string;
    RecentVisit: string[];
    Age: string;
    Gender: string;
}

interface V3ProfileData {
    UserId: string;
    Date: string;
    FromDate: string;
    ToDate: string;
    Version: string;
    Layer: string;
    Interests: V3Interest[];
    Biography: string;
    LifeStage?: { Value: string; Confidence: string; Evidence: string[] };
    demographics: V3Demographics | null;
}

interface MAIProfileViewProps {
    data: V3ProfileData;
    userId: string;
}

// ─── Style Constants ─────────────────────────────────────────────────

const styles = {
    // Header
    headerBar: {
        backgroundColor: '#F8F9FA',
        borderRadius: '12px',
        padding: '16px 24px',
        marginBottom: '24px',
        border: '1px solid #E9ECEF',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
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

    // Biography
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

    // Section Card
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
    sectionSubheading: {
        fontSize: '0.72rem',
        fontWeight: '700',
        color: '#007AFF',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        marginBottom: '12px',
        marginTop: '16px',
    } as React.CSSProperties,

    // Fact field
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

    // Tags
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
    keywordTag: {
        display: 'inline-block',
        padding: '4px 12px',
        backgroundColor: '#EEF2FF',
        borderRadius: '16px',
        fontSize: '0.78rem',
        color: '#4F46E5',
        border: '1px solid #C7D2FE',
        marginRight: '6px',
        marginBottom: '6px',
    } as React.CSSProperties,

    // Interest Card
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

    // Metadata row in interest
    metaRow: {
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap' as const,
        fontSize: '0.8rem',
        color: '#6C757D',
        marginBottom: '8px',
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

// ─── Confidence Helpers ──────────────────────────────────────────────

const confidenceColorMap: Record<string, { bg: string; text: string; border: string; badgeBg: string }> = {
    high: { bg: '#FFF5F5', text: '#E53E3E', border: '#FEB2B2', badgeBg: '#FED7D7' },
    medium: { bg: '#FFFFFF', text: '#1C1C1E', border: '#E2E8F0', badgeBg: '#F7FAFC' },
    low: { bg: '#FFFFFF', text: '#718096', border: '#E2E8F0', badgeBg: '#F7FAFC' },
};

function getConfidenceLevel(score: number | undefined): string {
    if (score == null) return 'low';
    if (score >= 0.75) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
}

function getConfidencePercent(score: number | undefined): number {
    if (score == null) return 0;
    return Math.round(score * 100);
}

function getConfidenceBadgeStyle(level: string): React.CSSProperties {
    const colors = confidenceColorMap[level] || confidenceColorMap.medium;
    return {
        ...styles.confidenceBadge,
        backgroundColor: colors.badgeBg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
    };
}

// ─── Sub-Components ──────────────────────────────────────────────────

/** Header bar with User ID, date range and version */
function HeaderBar({ userId, data }: { userId: string; data: V3ProfileData }) {
    return (
        <div style={styles.headerBar}>
            <div>
                <div style={styles.headerLabel}>User ID:</div>
                <div style={styles.headerValue}>{userId}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
                <div style={styles.headerLabel}>Date Range:</div>
                <div style={{ ...styles.headerValue, fontFamily: 'monospace' }}>
                    {formatDate(data.FromDate)} — {formatDate(data.ToDate)}
                </div>
            </div>
            <div style={{ textAlign: 'right' }}>
                <div style={styles.headerLabel}>Version / Layer:</div>
                <div style={{ ...styles.headerValue, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {data.Version} / {data.Layer}
                </div>
            </div>
        </div>
    );
}

function formatDate(dateStr: string): string {
    try {
        const d = new Date(dateStr + 'T00:00:00');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    } catch {
        return dateStr;
    }
}

/** Biography dark card – V3 Biography is a plain string */
function BiographySection({ biography }: { biography?: string }) {
    if (!biography) return null;
    const paragraphs = biography.split(/(?<=[.!?])\s+(?=[A-Z])/);

    return (
        <Card style={styles.biographyCard}>
            <Card.Body style={{ padding: '24px 28px' }}>
                <div style={styles.biographyTitle}>
                    <span>Biography</span>
                    <span style={{ fontSize: '0.85rem', color: '#8E8E93', cursor: 'help' }} title="AI-generated biography based on user signals">ⓘ</span>
                </div>
                {paragraphs.map((para, i) => (
                    <p key={i} style={styles.biographyText}>{para}</p>
                ))}
            </Card.Body>
        </Card>
    );
}

/** Facts section – reads demographics from TSV data + LifeStage from JSON */
function FactsSection({ demographics, lifeStage }: { demographics: V3Demographics | null; lifeStage?: V3ProfileData['LifeStage'] }) {
    if (!demographics && !lifeStage) return null;

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
                            {lifeStage?.Value || '—'}
                            {lifeStage?.Confidence && (
                                <span style={{ fontSize: '0.75rem', color: '#8E8E93', marginLeft: '6px' }}>
                                    ({lifeStage.Confidence})
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
                                {demographics.RecentVisit.map((v, i) => (
                                    <span key={i} style={styles.tag}>{v}</span>
                                ))}
                            </div>
                        </Col>
                    </Row>
                )}

                {lifeStage?.Evidence && lifeStage.Evidence.length > 0 && (
                    <Row>
                        <Col md={12}>
                            <div style={{ ...styles.factLabel, marginBottom: '6px' }}>Life Stage Evidence</div>
                            <ul style={{ fontSize: '0.85rem', color: '#4A5568', paddingLeft: '20px', marginBottom: 0 }}>
                                {lifeStage.Evidence.map((e, i) => (
                                    <li key={i}>{e}</li>
                                ))}
                            </ul>
                        </Col>
                    </Row>
                )}
            </Card.Body>
        </Card>
    );
}

/** Single interest card for V3 format */
function InterestCard({ topic }: { topic: V3Interest }) {
    const [showTopics, setShowTopics] = useState(false);
    const score = getConfidencePercent(topic.ConfidenceScore);
    const level = getConfidenceLevel(topic.ConfidenceScore);

    const sectionLabelStyle: React.CSSProperties = {
        fontSize: '0.7rem',
        fontWeight: '600',
        color: '#8E8E93',
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
        marginBottom: '6px',
    };

    return (
        <div style={styles.interestCard}>
            {/* Title + Confidence */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ ...styles.interestName, color: '#1C1C1E' }}>{topic.InterestName || '—'}</div>
                <span style={getConfidenceBadgeStyle(level)}>
                    {score}%
                </span>
            </div>

            {/* PERSONA */}
            {topic.Persona && (
                <>
                    <div style={{ ...sectionLabelStyle, marginBottom: '4px' }}>PERSONA</div>
                    <p style={{ fontSize: '0.84rem', color: '#4A5568', lineHeight: '1.5', marginBottom: '10px' }}>
                        {topic.Persona}
                    </p>
                </>
            )}

            {/* State / Count / Sources metadata */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'auto auto auto auto',
                gap: '6px 20px',
                fontSize: '0.78rem',
                marginBottom: '12px',
                padding: '10px 12px',
                backgroundColor: '#F8F9FA',
                borderRadius: '8px',
                border: '1px solid #E9ECEF',
            }}>
                <span style={styles.metaLabel}>State</span>
                <span style={styles.metaValue}>{topic.State ? capitalize(topic.State) : '—'}</span>
                <span style={styles.metaLabel}>Count</span>
                <span style={styles.metaValue}>{topic.Count != null ? topic.Count : '—'}</span>

                <span style={styles.metaLabel}>Sources</span>
                <span style={styles.metaValue}>{topic.Source && topic.Source.length > 0 ? topic.Source.join(', ') : '—'}</span>
                <span></span>
                <span></span>
            </div>

            {/* INTENTION */}
            <div style={sectionLabelStyle}>INTENTION</div>
            <p style={{ fontSize: '0.82rem', color: '#4A5568', lineHeight: '1.5', marginBottom: '6px' }}>
                <strong style={{ color: '#1C1C1E' }}>Actual:</strong> {topic.ActualActivity || '—'}
            </p>
            <p style={{ fontSize: '0.82rem', color: '#6B7280', lineHeight: '1.5', marginBottom: '10px' }}>
                <strong style={{ color: '#6B7280' }}>Inferred:</strong> {topic.InterestInferred || '—'}
            </p>

            {/* Temporal Stats */}
            <div style={{ display: 'flex', gap: '24px', fontSize: '0.78rem', color: '#6C757D', borderTop: '1px solid #F2F2F7', paddingTop: '10px' }}>
                <div>
                    <div style={{ fontSize: '0.68rem', color: '#ADB5BD' }}>First Detect</div>
                    <div style={{ fontWeight: '600', color: '#1C1C1E' }}>{topic.FirstDetectDate || '—'}</div>
                </div>
                <div>
                    <div style={{ fontSize: '0.68rem', color: '#ADB5BD' }}>Last Detect</div>
                    <div style={{ fontWeight: '600', color: '#1C1C1E' }}>{topic.LastDetectDate || '—'}</div>
                </div>
            </div>

            {/* TOPICS – collapsible */}
            {topic.Topics && topic.Topics.length > 0 && (
                <div style={{ marginTop: '10px', borderTop: '1px solid #F2F2F7', paddingTop: '8px' }}>
                    <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); setShowTopics(!showTopics); }}
                        style={{ fontSize: '0.8rem', color: '#0d6efd', textDecoration: 'none', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                        {showTopics ? '▾' : '▸'} Topics ({topic.Topics.length})
                    </a>
                    {showTopics && (
                        <div style={{ marginTop: '8px', maxHeight: '300px', overflowY: 'auto', border: '1px solid #E9ECEF', borderRadius: '8px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#F8F9FA' }}>
                                        <th style={{ padding: '6px 10px', borderBottom: '1px solid #DEE2E6', textAlign: 'left', color: '#6C757D', fontWeight: '600' }}>Topic</th>
                                        <th style={{ padding: '6px 10px', borderBottom: '1px solid #DEE2E6', textAlign: 'left', color: '#6C757D', fontWeight: '600' }}>Count</th>
                                        <th style={{ padding: '6px 10px', borderBottom: '1px solid #DEE2E6', textAlign: 'left', color: '#6C757D', fontWeight: '600' }}>Score</th>
                                        <th style={{ padding: '6px 10px', borderBottom: '1px solid #DEE2E6', textAlign: 'left', color: '#6C757D', fontWeight: '600' }}>Intent</th>
                                        <th style={{ padding: '6px 10px', borderBottom: '1px solid #DEE2E6', textAlign: 'left', color: '#6C757D', fontWeight: '600' }}>Source</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topic.Topics.map((t, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #F2F2F7' }}>
                                            <td style={{ padding: '5px 10px', color: '#495057', fontWeight: '500' }}>{t.Topic}</td>
                                            <td style={{ padding: '5px 10px', color: '#495057' }}>{t.Count}</td>
                                            <td style={{ padding: '5px 10px', color: '#495057' }}>{t.ConfidenceScore != null ? `${Math.round(t.ConfidenceScore * 100)}%` : '—'}</td>
                                            <td style={{ padding: '5px 10px', color: '#495057' }}>{t.Intent || '—'}</td>
                                            <td style={{ padding: '5px 10px', color: '#495057' }}>{t.Source?.join(', ') || '—'}</td>
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

/** Interests section with 3-column confidence grouping (derived from ConfidenceScore) */
function InterestsSection({ interests }: { interests: V3Interest[] }) {
    if (interests.length === 0) return null;

    const high = interests.filter(t => getConfidenceLevel(t.ConfidenceScore) === 'high').sort((a, b) => (b.ConfidenceScore ?? 0) - (a.ConfidenceScore ?? 0));
    const medium = interests.filter(t => getConfidenceLevel(t.ConfidenceScore) === 'medium').sort((a, b) => (b.ConfidenceScore ?? 0) - (a.ConfidenceScore ?? 0));
    const low = interests.filter(t => getConfidenceLevel(t.ConfidenceScore) === 'low').sort((a, b) => (b.ConfidenceScore ?? 0) - (a.ConfidenceScore ?? 0));

    const columnStyle: React.CSSProperties = { flex: 1, minWidth: 0 };

    return (
        <Card style={styles.sectionCard}>
            <Card.Body style={{ padding: '20px 28px' }}>
                <div style={styles.sectionTitle}>
                    <span style={{ fontSize: '1.2rem' }}>❤️</span>
                    <span>Interests</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0d6efd' }}>
                        {interests.length}
                    </span>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#8E8E93', marginBottom: '16px' }}>
                    General interests across all surfaces
                </p>

                {/* Confidence level headers */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Badge bg="danger" style={{ fontSize: '0.72rem', padding: '4px 10px' }}>High Confidence</Badge>
                        <span style={{ fontSize: '0.75rem', color: '#8E8E93' }}>75-100%</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Badge bg="secondary" style={{ fontSize: '0.72rem', padding: '4px 10px', backgroundColor: '#E2E8F0', color: '#1C1C1E' }}>Medium Confidence</Badge>
                        <span style={{ fontSize: '0.75rem', color: '#8E8E93' }}>40-74%</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Badge bg="light" text="dark" style={{ fontSize: '0.72rem', padding: '4px 10px', border: '1px solid #E2E8F0' }}>Low Confidence</Badge>
                        <span style={{ fontSize: '0.75rem', color: '#8E8E93' }}>&lt; 40%</span>
                    </div>
                </div>

                {/* 3-column layout */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={columnStyle}>
                        {high.length > 0 ? high.map((t, i) => <InterestCard key={i} topic={t} />) : (
                            <div style={{ padding: '16px', color: '#ADB5BD', fontSize: '0.85rem', textAlign: 'center' }}>No high confidence interests</div>
                        )}
                    </div>
                    <div style={columnStyle}>
                        {medium.length > 0 ? medium.map((t, i) => <InterestCard key={i} topic={t} />) : (
                            <div style={{ padding: '16px', color: '#ADB5BD', fontSize: '0.85rem', textAlign: 'center' }}>No medium confidence interests</div>
                        )}
                    </div>
                    <div style={columnStyle}>
                        {low.length > 0 ? low.map((t, i) => <InterestCard key={i} topic={t} />) : (
                            <div style={{ padding: '16px', color: '#ADB5BD', fontSize: '0.85rem', textAlign: 'center' }}>No low confidence interests</div>
                        )}
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
}

// ─── Utility ─────────────────────────────────────────────────────────

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}



// ─── Main Component ──────────────────────────────────────────────────

export default function MAIProfileView({ data, userId }: MAIProfileViewProps) {
    return (
        <div>
            <HeaderBar userId={userId} data={data} />
            <BiographySection biography={data.Biography} />
            <FactsSection demographics={data.demographics} lifeStage={data.LifeStage} />
            <InterestsSection interests={data.Interests || []} />
        </div>
    );
}
