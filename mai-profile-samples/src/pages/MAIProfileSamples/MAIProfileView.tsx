import React, { useState } from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';

// ─── Type Definitions ────────────────────────────────────────────────

interface MAIProfileData {
    Version?: string;
    AsOfDate?: string;
    Market?: string;
    Facts?: {
        Identity?: {
            MAI_ID?: string | null;
            ANID?: string | null;
            MUID?: string | null;
            Name?: string | null;
        };
        Demographics?: Record<string, { value?: any; confidence?: string; provenance?: string[] }>;
        Locations?: {
            CurrentLocation?: { value?: string | null; last_30d?: boolean };
            PastVisitedLocations?: Array<{ value?: string }> | { value?: string | null };
        };
        Employment?: {
            CurrentCompany?: { value?: string | null };
            PastCompany?: { value?: string | null };
        };
        UncertaintyNotes?: string[];
    };
    Interests?: {
        Interests?: InterestTopic[];
    };
    Biography?: {
        Summary?: string;
        StageOfLifeSignals?: string;
        ActiveGoals?: Array<{ goal: string; horizon: string; linked_interests?: string[]; confidence?: string }>;
        LongTermGoals?: Array<{ goal: string; horizon: string; linked_interests?: string[]; confidence?: string }>;
        Highlights?: string[];
    };
    Memory?: {
        Working?: {
            WindowHours?: number;
            TopInterestsLast24h?: Array<{ interest_ref: string; summary: string; confidence?: string }>;
            OneDaySpikes?: any[];
        };
        ShortTerm?: {
            WindowDays?: number;
            MultiDayRepeatedEngagement?: Array<{ interest_ref: string; summary: string; confidence?: string }>;
            WeeklyCycles?: any[];
            CrossTopicCooccurrence?: Array<{ interest_refs: string[]; summary: string; confidence?: string }>;
        };
        LongTerm?: {
            WindowDays?: number;
            HighInterestFrequency?: Array<{ interest_ref: string; summary: string; confidence?: string }>;
            ConsistentDomainAffinity?: Array<{ domain_category: string; summary: string; confidence?: string }>;
            SeasonalRecurrences?: any[];
        };
    };
    Preferences?: {
        Items?: Array<{
            PreferenceId?: string;
            Dimension?: string;
            Value?: string;
            ConfidenceScore?: number;
        }>;
    };
    [key: string]: any;
}

interface InterestTopic {
    InterestName: string;
    Persona?: string;
    ConfidenceScore?: number;
    ConfidenceLevel?: string;
    Strength?: number;
    State?: string;
    DecayRate?: number;
    TemporalType?: string;
    Seasonality?: string;
    Trigger?: { Type?: string; Value?: string };
    SignalSourceCounts?: Record<string, number>;
    Signals?: {
        PositiveCount?: number;
        NegativeCount?: number;
        NeutralCount?: number;
        PositiveSamples?: any[];
        NegativeSamples?: any[];
    };
    ActualActivity?: string;
    IntentionInferred?: string;
    Topics?: Array<{ Topic: string; Weight: number }>;
    FirstDetectDate?: string;
    LastDetectDate?: string;
    LifetimeDays?: number;
    TemporalStats?: {
        RecencyDays?: number;
        ActiveDays?: number;
        EventCount?: number;
    };
    Evidence?: Array<{ date?: string; source?: string; action?: string; raw_record?: string }>;
    Internal?: { Topic?: string; Subtopic?: string; StrengthUpdate?: string };
}

interface MAIProfileViewProps {
    data: MAIProfileData;
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

    // Memory cards
    memoryCard: (color: 'green' | 'blue') => ({
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '12px',
        backgroundColor: color === 'green' ? '#F0FFF4' : '#EFF6FF',
        borderLeft: `4px solid ${color === 'green' ? '#34C759' : '#3B82F6'}`,
    }) as React.CSSProperties,
    memoryTitle: (color: 'green' | 'blue') => ({
        fontSize: '0.72rem',
        fontWeight: '700',
        color: color === 'green' ? '#059669' : '#2563EB',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    }) as React.CSSProperties,
    memoryText: {
        fontSize: '0.88rem',
        color: '#374151',
        lineHeight: '1.6',
    } as React.CSSProperties,
};

// ─── Confidence Helpers ──────────────────────────────────────────────

const confidenceColorMap: Record<string, { bg: string; text: string; border: string; badgeBg: string }> = {
    high: { bg: '#FFF5F5', text: '#E53E3E', border: '#FEB2B2', badgeBg: '#FED7D7' },
    medium: { bg: '#FFFFFF', text: '#1C1C1E', border: '#E2E8F0', badgeBg: '#F7FAFC' },
    low: { bg: '#FFFFFF', text: '#718096', border: '#E2E8F0', badgeBg: '#F7FAFC' },
};

function getConfidenceScore(topic: InterestTopic): number {
    if (topic.ConfidenceScore != null) return Math.round(topic.ConfidenceScore * 100);
    if (topic.Strength != null) return Math.round(topic.Strength * 100);
    return 0;
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

// Category color map (borrowed from existing codebase)
const categoryColorMap: Record<string, string> = {
    'Technology': '#0d6efd',
    'Entertainment': '#dc3545',
    'Business & Finance': '#fd7e14',
    'Travel & Attractions': '#0dcaf0',
    'Sports': '#198754',
    'Gaming': '#0d6efd',
    'Food & Drink': '#dc3545',
    'Society, Culture & History': '#6f42c1',
    'Fashion & Style': '#e83e8c',
    'Home & Garden': '#20c997',
    'Beauty & Personal Care': '#d63384',
    'Public Safety & Emergencies': '#dc3545',
    'Climate & Weather': '#0dcaf0',
    'Environment & Wildlife': '#198754',
};

function getInterestColor(category: string | undefined): string {
    if (!category) return '#6C757D';
    return categoryColorMap[category] || '#6C757D';
}

// Signal source icon map
const signalIconMap: Record<string, string> = {
    'WatchReadClick': '📄',
    'Search': '🔍',
    'Commerce': '🛒',
    'Other': '💬',
};

// ─── Sub-Components ──────────────────────────────────────────────────

/** Header bar with User ID and Last Updated */
function HeaderBar({ userId, asOfDate }: { userId: string; asOfDate?: string }) {
    return (
        <div style={styles.headerBar}>
            <div>
                <div style={styles.headerLabel}>User ID:</div>
                <div style={styles.headerValue}>{userId}</div>
            </div>
            {asOfDate && (
                <div style={{ textAlign: 'right' }}>
                    <div style={styles.headerLabel}>Last Updated:</div>
                    <div style={{ ...styles.headerValue, fontFamily: 'monospace' }}>
                        {formatDate(asOfDate)}
                    </div>
                </div>
            )}
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

/** Biography dark card */
function BiographySection({ biography }: { biography?: MAIProfileData['Biography'] }) {
    if (!biography?.Summary) return null;
    // Split summary into paragraphs on sentence boundaries for readability
    const paragraphs = biography.Summary.split(/(?<=[.!?])\s+(?=[A-Z])/);

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

/** Facts section */
function FactsSection({ facts, stageOfLife }: { facts?: MAIProfileData['Facts']; stageOfLife?: string }) {
    if (!facts) return null;

    const identity = facts.Identity;
    const demos = facts.Demographics || {};
    const locations = facts.Locations;
    const employment = facts.Employment;

    // Visited locations – handle both array and object formats
    const pastVisited = locations?.PastVisitedLocations;
    const visitedLocations: string[] = pastVisited
        ? Array.isArray(pastVisited)
            ? pastVisited.map(l => l.value).filter(Boolean) as string[]
            : pastVisited.value ? [pastVisited.value] : []
        : [];

    return (
        <Card style={styles.sectionCard}>
            <Card.Body style={{ padding: '20px 28px' }}>
                <div style={styles.sectionTitle}>
                    <span style={{ fontSize: '1.2rem' }}>⚡</span>
                    <span>Facts</span>
                </div>

                {/* ── ACTUAL DATA ── */}
                <div style={styles.sectionSubheading}>ACTUAL DATA</div>
                <Row>
                    {/* Row 1: Name, Occupation, Current Location */}
                    <Col md={4} style={{ marginBottom: '16px' }}>
                        <div style={styles.factLabel}><span>👤</span> Name</div>
                        <div style={styles.factValue}>{identity?.Name || '—'}</div>
                    </Col>
                    <Col md={4} style={{ marginBottom: '16px' }}>
                        <div style={styles.factLabel}><span>🏢</span> Occupation</div>
                        <div style={styles.factValue}>{demos.Occupation?.value || '—'}</div>
                    </Col>
                    <Col md={4} style={{ marginBottom: '16px' }}>
                        <div style={styles.factLabel}><span>📍</span> Current Location</div>
                        <div style={styles.factValue}>{locations?.CurrentLocation?.value || '—'}</div>
                    </Col>

                    {/* Row 2: Age / Range, Company, Recent Visits */}
                    <Col md={4} style={{ marginBottom: '16px' }}>
                        <div style={styles.factLabel}><span>📅</span> Age / Range</div>
                        <div style={styles.factValue}>{demos.Age?.value != null ? `${demos.Age.value}` : '—'}</div>
                    </Col>
                    <Col md={4} style={{ marginBottom: '16px' }}>
                        <div style={styles.factLabel}><span>🏢</span> Company</div>
                        <div style={styles.factValue}>{employment?.CurrentCompany?.value || '—'}</div>
                    </Col>
                    <Col md={4} style={{ marginBottom: '16px' }}>
                        <div style={styles.factLabel}><span>📍</span> Recent Visits</div>
                        <div style={styles.factValue}>{visitedLocations.length > 0 ? visitedLocations.join('; ') : '—'}</div>
                        {visitedLocations.length > 0 && (
                            <div style={{ fontSize: '0.72rem', color: '#ADB5BD' }}>Last 30 days</div>
                        )}
                    </Col>
                </Row>

                {/* ── INFERRED DATA (non-WIP fields only) ── */}
                <hr style={{ border: 'none', borderTop: '1px solid #E9ECEF', margin: '8px 0 16px' }} />
                <div style={{ ...styles.sectionSubheading, color: '#6C757D' }}>INFERRED DATA</div>
                <Row>
                    <Col md={3} style={{ marginBottom: '16px' }}>
                        <div style={styles.factLabel}><span>🔄</span> Generation</div>
                        {demos.Generation?.value
                            ? <span style={styles.tag}>{demos.Generation.value}</span>
                            : <span style={{ fontSize: '0.85rem', color: '#ADB5BD' }}>—</span>}
                    </Col>
                    <Col md={3} style={{ marginBottom: '16px' }}>
                        <div style={styles.factLabel}><span>👤</span> Life Stage</div>
                        {stageOfLife && stageOfLife !== 'unknown'
                            ? <span style={styles.tag}>{stageOfLife}</span>
                            : <span style={{ fontSize: '0.85rem', color: '#ADB5BD' }}>—</span>}
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
}

/** Single interest card – always shows all sections; empty values render as "—" */
function InterestCard({ topic }: { topic: InterestTopic }) {
    const [showEvidence, setShowEvidence] = useState(false);
    const score = getConfidenceScore(topic);
    const color = getInterestColor(topic.Internal?.Topic);
    const level = topic.ConfidenceLevel || 'medium';

    // Build signal sources from SignalSourceCounts (only non-zero)
    const signalSources = topic.SignalSourceCounts
        ? Object.entries(topic.SignalSourceCounts).filter(([, v]) => v > 0).map(([k, v]) => ({ name: k, count: v }))
        : [];

    // Format trigger display
    const triggerDisplay = topic.Trigger
        ? `${capitalize(topic.Trigger.Type || '—')} / ${capitalize(topic.Trigger.Value || '—')}`
        : '—';

    const sectionLabelStyle: React.CSSProperties = {
        fontSize: '0.7rem',
        fontWeight: '600',
        color: '#8E8E93',
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
        marginBottom: '6px',
    };

    const emptyText = <span style={{ fontSize: '0.82rem', color: '#ADB5BD' }}>—</span>;

    return (
        <div style={styles.interestCard}>
            {/* Title + Confidence */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ ...styles.interestName, color }}>{topic.InterestName || '—'}</div>
                <span style={getConfidenceBadgeStyle(level)}>
                    Confidence Score: {score}%
                </span>
            </div>

            {/* PERSONA – always shown */}
            <div style={{ ...sectionLabelStyle, marginBottom: '4px' }}>PERSONA</div>
            <p style={{ fontSize: '0.84rem', color: '#4A5568', lineHeight: '1.5', marginBottom: '10px' }}>
                {topic.Persona || emptyText}
            </p>

            {/* State / Seasonality / Trigger / Decay / Temporal Type metadata table – always shown */}
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
                {/* Row 1 */}
                <span style={styles.metaLabel}>State</span>
                <span style={styles.metaValue}>{topic.State ? capitalize(topic.State) : '—'}</span>
                <span style={styles.metaLabel}>Seasonality</span>
                <span style={styles.metaValue}>{topic.Seasonality ? capitalize(topic.Seasonality) : '—'}</span>

                {/* Row 2 */}
                <span style={styles.metaLabel}>Trigger</span>
                <span style={styles.metaValue}>{triggerDisplay}</span>
                <span style={styles.metaLabel}>Decay</span>
                <span style={styles.metaValue}>{topic.DecayRate != null ? topic.DecayRate : '—'}</span>

                {/* Row 3 */}
                <span style={styles.metaLabel}>Temporal Type</span>
                <span style={styles.metaValue}>{topic.TemporalType ? capitalize(topic.TemporalType) : '—'}</span>
                <span></span>
                <span></span>
            </div>

            {/* SIGNALS – always shown */}
            <div style={sectionLabelStyle}>SIGNALS</div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', fontSize: '0.82rem' }}>
                {signalSources.length > 0
                    ? signalSources.map((src, i) => (
                        <span key={i} style={{ color: '#4A5568' }}>
                            {signalIconMap[src.name] || '📌'} {src.name} ({src.count})
                        </span>
                    ))
                    : emptyText
                }
            </div>

            {/* INTENTION – always shown */}
            <div style={sectionLabelStyle}>INTENTION</div>
            <p style={{ fontSize: '0.82rem', color: '#4A5568', lineHeight: '1.5', marginBottom: '6px' }}>
                <strong style={{ color: '#1C1C1E' }}>Actual:</strong> {topic.ActualActivity || '—'}
            </p>
            <p style={{ fontSize: '0.82rem', color: '#6B7280', lineHeight: '1.5', marginBottom: '10px' }}>
                <strong style={{ color: '#6B7280' }}>Inferred:</strong> {topic.IntentionInferred || '—'}
            </p>

            {/* TOPICS – always shown */}
            <div style={sectionLabelStyle}>TOPICS</div>
            <div style={{ marginBottom: '10px' }}>
                {topic.Topics && topic.Topics.length > 0
                    ? topic.Topics.map((t, i) => (
                        <span key={i} style={styles.keywordTag}>{t.Topic} ({t.Weight})</span>
                    ))
                    : emptyText
                }
            </div>

            {/* Temporal Stats – always shown */}
            <div style={{ display: 'flex', gap: '24px', fontSize: '0.78rem', color: '#6C757D', borderTop: '1px solid #F2F2F7', paddingTop: '10px' }}>
                <div>
                    <div style={{ fontSize: '0.68rem', color: '#ADB5BD' }}>First Detect</div>
                    <div style={{ fontWeight: '600', color: '#1C1C1E' }}>{topic.FirstDetectDate || '—'}</div>
                </div>
                <div>
                    <div style={{ fontSize: '0.68rem', color: '#ADB5BD' }}>Last Detect</div>
                    <div style={{ fontWeight: '600', color: '#1C1C1E' }}>{topic.LastDetectDate || '—'}</div>
                </div>
                <div>
                    <div style={{ fontSize: '0.68rem', color: '#ADB5BD' }}>Frequency</div>
                    <div style={{ fontWeight: '600', color: '#1C1C1E' }}>{topic.TemporalStats?.EventCount != null ? topic.TemporalStats.EventCount : '—'}</div>
                </div>
                <div>
                    <div style={{ fontSize: '0.68rem', color: '#ADB5BD' }}>Lifetime</div>
                    <div style={{ fontWeight: '600', color: '#1C1C1E' }}>{topic.LifetimeDays != null ? `${topic.LifetimeDays}d` : '—'}</div>
                </div>
            </div>

            {/* Evidence link */}
            {topic.Evidence && topic.Evidence.length > 0 && (
                <div style={{ marginTop: '10px', borderTop: '1px solid #F2F2F7', paddingTop: '8px' }}>
                    <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); setShowEvidence(!showEvidence); }}
                        style={{ fontSize: '0.8rem', color: '#0d6efd', textDecoration: 'none', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                        {showEvidence ? '▾' : '▸'} Evidence ({topic.Evidence.length})
                    </a>
                    {showEvidence && (
                        <div style={{ marginTop: '8px', maxHeight: '300px', overflowY: 'auto', border: '1px solid #E9ECEF', borderRadius: '8px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#F8F9FA' }}>
                                        <th style={{ padding: '6px 10px', borderBottom: '1px solid #DEE2E6', textAlign: 'left', color: '#6C757D', fontWeight: '600', whiteSpace: 'nowrap' }}>Date</th>
                                        <th style={{ padding: '6px 10px', borderBottom: '1px solid #DEE2E6', textAlign: 'left', color: '#6C757D', fontWeight: '600' }}>Source</th>
                                        <th style={{ padding: '6px 10px', borderBottom: '1px solid #DEE2E6', textAlign: 'left', color: '#6C757D', fontWeight: '600' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topic.Evidence.map((ev, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #F2F2F7' }}>
                                            <td style={{ padding: '5px 10px', whiteSpace: 'nowrap', fontFamily: 'monospace', color: '#495057' }}>{ev.date || '—'}</td>
                                            <td style={{ padding: '5px 10px', color: '#495057' }}>{ev.source || '—'}</td>
                                            <td style={{ padding: '5px 10px', color: '#495057' }}>{ev.action || '—'}</td>
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

/** Interests section with 3-column confidence grouping */
function InterestsSection({ interests }: { interests?: MAIProfileData['Interests'] }) {
    const topics = interests?.Interests || [];
    if (topics.length === 0) return null;

    const high = topics.filter(t => t.ConfidenceLevel === 'high').sort((a, b) => (b.ConfidenceScore ?? 0) - (a.ConfidenceScore ?? 0));
    const medium = topics.filter(t => t.ConfidenceLevel === 'medium').sort((a, b) => (b.ConfidenceScore ?? 0) - (a.ConfidenceScore ?? 0));
    const low = topics.filter(t => t.ConfidenceLevel === 'low').sort((a, b) => (b.ConfidenceScore ?? 0) - (a.ConfidenceScore ?? 0));

    const columnStyle: React.CSSProperties = { flex: 1, minWidth: 0 };

    return (
        <Card style={styles.sectionCard}>
            <Card.Body style={{ padding: '20px 28px' }}>
                <div style={styles.sectionTitle}>
                    <span style={{ fontSize: '1.2rem' }}>❤️</span>
                    <span>Interests</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0d6efd' }}>
                        {topics.length}
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

/** Memory and Goals section */
function MemoryAndGoalsSection({ biography, memory }: { biography?: MAIProfileData['Biography']; memory?: MAIProfileData['Memory'] }) {
    const activeGoals = biography?.ActiveGoals || [];
    const longTermGoals = biography?.LongTermGoals || [];
    const hasGoals = activeGoals.length > 0 || longTermGoals.length > 0;

    // Memory layers
    const working = memory?.Working;
    const shortTerm = memory?.ShortTerm;
    const longTerm = memory?.LongTerm;

    const hasMemory = working || shortTerm || longTerm;

    if (!hasGoals && !hasMemory) return null;

    // Build working memory summary
    const workingSummary = working?.TopInterestsLast24h?.map(i => i.summary).join(' ') || '';
    // Build short term summary from multi-day engagement
    const shortTermSummary = shortTerm?.MultiDayRepeatedEngagement?.map(i => i.summary).join(' ') || '';
    // Build long term summary
    const longTermSummary = [
        ...(longTerm?.HighInterestFrequency?.map(i => i.summary) || []),
        ...(longTerm?.ConsistentDomainAffinity?.map(i => i.summary) || []),
    ].join(' ') || '';

    // Preferences as memory categories (closest match to the Figma "Memory Categories" table)

    return (
        <Card style={styles.sectionCard}>
            <Card.Body style={{ padding: '20px 28px' }}>
                <div style={styles.sectionTitle}>
                    <span style={{ fontSize: '1.2rem' }}>🧠</span>
                    <span>Memory and Goals</span>
                </div>

                {/* Active Goals */}
                {hasGoals && (
                    <>
                        <div style={{ ...styles.sectionSubheading, marginTop: '20px', marginBottom: '16px', color: '#1C1C1E', fontSize: '0.85rem' }}>
                            <span style={{ marginRight: '6px' }}>◎</span> Active Goals
                        </div>
                        <Row style={{ marginBottom: '20px' }}>
                            {activeGoals.length > 0 && (
                                <Col md={6}>
                                    <div style={{ backgroundColor: '#F8F9FA', borderRadius: '12px', padding: '16px 20px' }}>
                                        <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span>⏱</span> SHORT TERM
                                        </div>
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                            {activeGoals.map((g, i) => (
                                                <li key={i} style={{ fontSize: '0.88rem', color: '#1C1C1E', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ color: '#34C759', fontSize: '0.6rem' }}>●</span> {g.goal}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </Col>
                            )}
                            {longTermGoals.length > 0 && (
                                <Col md={6}>
                                    <div style={{ backgroundColor: '#F8F9FA', borderRadius: '12px', padding: '16px 20px' }}>
                                        <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span>🚩</span> LONG TERM
                                        </div>
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                            {longTermGoals.map((g, i) => (
                                                <li key={i} style={{ fontSize: '0.88rem', color: '#1C1C1E', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ color: '#3B82F6', fontSize: '0.6rem' }}>●</span> {g.goal}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </Col>
                            )}
                        </Row>
                    </>
                )}

                {/* Memory Layers */}
                {hasMemory && (
                    <>
                        {workingSummary && (
                            <div style={styles.memoryCard('green')}>
                                <div style={styles.memoryTitle('green')}>
                                    <span>👤</span> CURRENT WORKING MEMORY (LAST {working?.WindowHours || 24} HOURS)
                                </div>
                                <p style={styles.memoryText}>{workingSummary}</p>
                            </div>
                        )}

                        {shortTermSummary && (
                            <div style={styles.memoryCard('green')}>
                                <div style={styles.memoryTitle('green')}>
                                    <span>🕐</span> SHORT TERM MEMORY (LAST {shortTerm?.WindowDays || 28} DAYS)
                                </div>
                                <p style={styles.memoryText}>{shortTermSummary}</p>
                            </div>
                        )}

                        {longTermSummary && (
                            <div style={styles.memoryCard('blue')}>
                                <div style={styles.memoryTitle('blue')}>
                                    <span>📋</span> LONG TERM MEMORY (LAST {longTerm?.WindowDays || 365} DAYS)
                                </div>
                                <p style={styles.memoryText}>{longTermSummary}</p>
                            </div>
                        )}
                    </>
                )}
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
            <HeaderBar userId={userId} asOfDate={data.AsOfDate} />
            <BiographySection biography={data.Biography} />
            <FactsSection facts={data.Facts} stageOfLife={data.Biography?.StageOfLifeSignals} />
            <InterestsSection interests={data.Interests} />
            <MemoryAndGoalsSection biography={data.Biography} memory={data.Memory} />
        </div>
    );
}
