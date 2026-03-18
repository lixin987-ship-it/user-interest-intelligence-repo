import React, { useState } from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';

// ─── Helpers ─────────────────────────────────────────────────────────

function getConfidenceLevel(score: number | undefined): string {
    if (score == null) return 'low';
    if (score >= 0.75) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
}

function getConfidencePercent(score: number | undefined): number {
    return score != null ? Math.round(score * 100) : 0;
}

function capitalize(s: string): string {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

function formatDateShort(dateStr: string | undefined): string {
    if (!dateStr) return '';
    if (/^\d{8}$/.test(dateStr)) {
        dateStr = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    }
    return dateStr; // keep YYYY-MM-DD as-is per Figma
}

function computeLifetimeDays(first: string | undefined, last: string | undefined): string {
    if (!first || !last) return '';
    const f = formatDateShort(first);
    const l = formatDateShort(last);
    const d1 = new Date(f + 'T00:00:00');
    const d2 = new Date(l + 'T00:00:00');
    const diff = Math.round((d2.getTime() - d1.getTime()) / 86400000);
    return diff >= 0 ? `${diff}d` : '';
}



// ─── Sub-Components ──────────────────────────────────────────────────

const sectionLabel: React.CSSProperties = {
    fontSize: '0.7rem', fontWeight: '700', color: '#C89030',
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', marginTop: '12px',
};

const metaCellLabel: React.CSSProperties = {
    fontSize: '0.72rem', color: '#8E9AAF', marginBottom: '2px',
};

const metaCellValue: React.CSSProperties = {
    fontSize: '0.88rem', fontWeight: '600', color: '#1C1C1E',
};

/* ── Header (MAI Profile bar from Figma top) ── */
function HeaderBar({ userId }: { userId: string; data: any }) {
    return (
        <div style={{
            backgroundColor: '#FFFFFF', borderBottom: '1px solid #E9ECEF',
            padding: '12px 24px', marginBottom: '24px', display: 'flex',
            alignItems: 'center', gap: '16px', flexWrap: 'wrap',
        }}>
            <span style={{ fontWeight: '700', fontSize: '1.1rem', color: '#1C1C1E' }}>
                <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#4F46E5',
                    color: '#fff', fontWeight: '700', fontSize: '0.85rem', marginRight: '8px',
                }}>M</span>
                MAI Profile
            </span>
            <span style={{ color: '#8E9AAF', fontSize: '0.85rem' }}>User ID:</span>
            <span style={{
                backgroundColor: '#F1F3F5', padding: '4px 14px', borderRadius: '6px',
                fontSize: '0.9rem', fontWeight: '600', fontFamily: 'monospace', color: '#1C1C1E',
            }}>{userId}</span>
        </div>
    );
}

/* ── Biography (dark card, matches Figma) ── */
function BiographySection({ biography }: { biography: string | any }) {
    const summary = typeof biography === 'string' ? biography : biography?.Summary;
    if (!summary) return null;
    const paragraphs = summary.split(/(?<=[.!?])\s+(?=[A-Z])/);

    return (
        <Card style={{
            backgroundColor: '#1A1B2E', borderRadius: '16px', border: 'none',
            marginBottom: '24px', overflow: 'hidden',
        }}>
            <Card.Body style={{ padding: '24px 28px' }}>
                <div style={{
                    color: '#FFFFFF', fontSize: '1.1rem', fontWeight: '700',
                    marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                    <span>Biography</span>
                    <span style={{ fontSize: '0.85rem', color: '#8E9AAF', cursor: 'help' }} title="AI-generated biography based on user signals">ⓘ</span>
                </div>
                {paragraphs.map((para: string, i: number) => (
                    <p key={i} style={{
                        color: '#C7C8D1', fontSize: '0.92rem', lineHeight: '1.75', marginBottom: '14px',
                    }}>{para}</p>
                ))}
            </Card.Body>
        </Card>
    );
}

/* ── Facts (Figma 2×3 grid layout) ── */
function FactsSection({ data }: { data: any }) {
    const ls = data.life_stage;
    const facts = data.facts || {};

    // Map fields — data may or may not have them
    const name = facts.name || '';
    const occupation = facts.occupation || '';
    const currentLocation = facts.current_location || '';
    const ageValue = facts.age ? String(facts.age) : '';
    const ageRange = facts.age_range || '';
    const ageDisplay = ageValue && ageRange ? `${ageValue} (${ageRange})` : ageValue || ageRange || '';
    const company = facts.company || '';
    const recentVisits = facts.recent_visits || [];

    const grid: { icon: string; label: string; value: string }[] = [
        { icon: '👤', label: 'Name', value: name },
        { icon: '🏢', label: 'Occupation', value: occupation },
        { icon: '📍', label: 'Current Location', value: currentLocation },
        { icon: '📅', label: 'Age / Range', value: ageDisplay },
        { icon: '🏛', label: 'Company', value: company },
        { icon: '📍', label: 'Recent Visits', value: Array.isArray(recentVisits) ? recentVisits.join('; ') : recentVisits },
    ];

    return (
        <Card style={{
            borderRadius: '16px', border: '1px solid #E9ECEF',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '24px', overflow: 'hidden',
        }}>
            <Card.Body style={{ padding: '20px 28px' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1C1C1E', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.2rem' }}>⚡</span>
                    <span>Facts</span>
                </div>

                {/* ACTUAL DATA heading */}
                <div style={sectionLabel}>ACTUAL DATA</div>

                <Row>
                    {grid.map((item, i) => (
                        <Col md={4} key={i} style={{ marginBottom: '16px' }}>
                            <div style={metaCellLabel}>{item.icon} {item.label}</div>
                            <div style={metaCellValue}>{item.value || '—'}</div>
                        </Col>
                    ))}
                </Row>

                {/* Life Stage (from life_stage field) */}
                {ls && (
                    <>
                        <div style={{ ...sectionLabel, marginTop: '8px' }}>INFERRED DATA</div>
                        <Row>
                            <Col md={4} style={{ marginBottom: '16px' }}>
                                <div style={metaCellLabel}>👤 Life Stage</div>
                                <div style={metaCellValue}>
                                    {ls.value ? capitalize(ls.value) : '—'}
                                    {ls.confidence && (
                                        <span style={{ fontSize: '0.72rem', color: '#8E9AAF', marginLeft: '6px' }}>
                                            ({ls.confidence})
                                        </span>
                                    )}
                                </div>
                            </Col>
                        </Row>
                        {ls.evidence && ls.evidence.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                                {ls.evidence.map((e: string, i: number) => (
                                    <span key={i} style={{
                                        display: 'inline-block', padding: '4px 12px',
                                        backgroundColor: '#F2F2F7', borderRadius: '16px',
                                        fontSize: '0.8rem', color: '#1C1C1E', fontWeight: '500',
                                    }}>{e}</span>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </Card.Body>
        </Card>
    );
}

/* ── Interest Card (Figma layout) ── */
function InterestCard({ interest }: { interest: any }) {
    const [showEvidence, setShowEvidence] = useState(false);
    const score = getConfidencePercent(interest.confidence_score);

    const topics: any[] = interest.topics || [];
    const topicNames = topics.map((t: any) => t.topic);

    // Compute source percentages from topics evidence
    const sourceCounts: Record<string, number> = {};
    let totalEvidence = 0;
    for (const t of topics) {
        if (t.evidence && Array.isArray(t.evidence)) {
            for (const e of t.evidence) {
                const srcs = Array.isArray(e.source) ? e.source : [e.source];
                for (const s of srcs) {
                    const key = String(s).toLowerCase();
                    sourceCounts[key] = (sourceCounts[key] || 0) + 1;
                    totalEvidence++;
                }
            }
        }
    }

    // Flatten all evidence for collapsible section
    const allEvidence: any[] = [];
    for (const t of topics) {
        if (t.evidence && Array.isArray(t.evidence)) {
            for (const e of t.evidence) {
                allEvidence.push({ ...e, _topic: t.topic });
            }
        }
    }

    const lifetime = computeLifetimeDays(interest.first_detect_date, interest.last_detect_date);

    return (
        <div style={{
            borderRadius: '12px', border: '1px solid #E9ECEF', padding: '16px',
            marginBottom: '16px', backgroundColor: '#FFFFFF',
        }}>
            {/* Title + Confidence */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: '700', color: '#1C1C1E' }}>
                    {interest.interest_name || '—'}
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#4F7BE5' }}>
                    Confidence Score: {score}%
                </span>
            </div>

            {/* PERSONA */}
            {interest.persona && (
                <>
                    <div style={sectionLabel}>PERSONA</div>
                    <p style={{ fontSize: '0.84rem', color: '#4A5568', lineHeight: '1.55', marginBottom: '10px' }}>
                        {interest.persona}
                    </p>
                </>
            )}

            {/* Metadata grid — matches Figma: State, Seasonality / Trigger, Decay / Temporal Type */}
            <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px',
                fontSize: '0.78rem', marginBottom: '12px',
            }}>
                <div>
                    <span style={metaCellLabel}>State (User)</span>
                    <div style={metaCellValue}>{interest.state ? capitalize(interest.state) : '—'}</div>
                </div>
                <div>
                    <span style={metaCellLabel}>Seasonality</span>
                    <div style={metaCellValue}>{interest.seasonality ? capitalize(interest.seasonality) : '—'}</div>
                </div>
                <div>
                    <span style={metaCellLabel}>Trigger</span>
                    <div style={metaCellValue}>{interest.trigger ? capitalize(interest.trigger) : '—'}</div>
                </div>
                <div>
                    <span style={metaCellLabel}>Decay</span>
                    <div style={metaCellValue}>{interest.decay != null ? interest.decay : '—'}</div>
                </div>
                <div>
                    <span style={metaCellLabel}>Temporal Type</span>
                    <div style={metaCellValue}>{interest.temporal ? capitalize(interest.temporal) : '—'}</div>
                </div>
            </div>

            {/* SIGNALS — source percentages */}
            {totalEvidence > 0 && (
                <>
                    <div style={sectionLabel}>SIGNALS</div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', marginBottom: '10px', flexWrap: 'wrap' }}>
                        {Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).map(([src, cnt]) => {
                            const pct = Math.round((cnt / totalEvidence) * 100);
                            return (
                                <span key={src} style={{ color: '#4A5568' }}>
                                    {capitalize(src)} {pct}%
                                </span>
                            );
                        })}
                    </div>
                </>
            )}

            {/* INTENTION */}
            <div style={sectionLabel}>INTENTION</div>
            <p style={{ fontSize: '0.82rem', color: '#4A5568', lineHeight: '1.5', marginBottom: '4px' }}>
                <strong style={{ color: '#1C1C1E' }}>Actual:</strong> {interest.actual_activity || '—'}
            </p>
            <p style={{ fontSize: '0.82rem', color: '#4A5568', lineHeight: '1.5', marginBottom: '10px' }}>
                <strong style={{ color: '#1C1C1E' }}>Inferred:</strong> {interest.inferred_intent || '—'}
            </p>

            {/* INTEREST TOPIC — flat tags */}
            {topicNames.length > 0 && (
                <>
                    <div style={sectionLabel}>INTEREST TOPIC</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                        {topicNames.map((name: string, i: number) => (
                            <span key={i} style={{
                                display: 'inline-block', padding: '4px 12px',
                                backgroundColor: '#EEF2FF', borderRadius: '6px',
                                fontSize: '0.78rem', color: '#4F46E5', border: '1px solid #C7D2FE',
                            }}>{name}</span>
                        ))}
                    </div>
                </>
            )}

            {/* Bottom stats row — Figma: First Detect, Last Detect, Frequency, Lifetime */}
            <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px',
                fontSize: '0.78rem', borderTop: '1px solid #F2F2F7', paddingTop: '10px',
            }}>
                <div>
                    <div style={{ fontSize: '0.68rem', color: '#ADB5BD' }}>First Detect</div>
                    <div style={{ fontWeight: '600', color: '#1C1C1E' }}>{formatDateShort(interest.first_detect_date) || '—'}</div>
                </div>
                <div>
                    <div style={{ fontSize: '0.68rem', color: '#ADB5BD' }}>Last Detect</div>
                    <div style={{ fontWeight: '600', color: '#1C1C1E' }}>{formatDateShort(interest.last_detect_date) || '—'}</div>
                </div>
                <div>
                    <div style={{ fontSize: '0.68rem', color: '#ADB5BD' }}>Frequency</div>
                    <div style={{ fontWeight: '600', color: '#1C1C1E' }}>{interest.count != null ? interest.count : '—'}</div>
                </div>
                <div>
                    <div style={{ fontSize: '0.68rem', color: '#ADB5BD' }}>Lifetime</div>
                    <div style={{ fontWeight: '600', color: '#1C1C1E' }}>{lifetime || '—'}</div>
                </div>
            </div>

            {/* Evidence – collapsible (not in Figma, but kept per requirement) */}
            {allEvidence.length > 0 && (
                <div style={{ marginTop: '8px', borderTop: '1px solid #F2F2F7', paddingTop: '8px' }}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setShowEvidence(!showEvidence); }}
                        style={{ fontSize: '0.8rem', color: '#0d6efd', textDecoration: 'none', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {showEvidence ? '▾' : '▸'} Evidence ({allEvidence.length})
                    </a>
                    {showEvidence && (
                        <div style={{ marginTop: '8px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #E9ECEF', borderRadius: '8px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#F8F9FA' }}>
                                        <th style={{ padding: '5px 8px', borderBottom: '1px solid #DEE2E6', textAlign: 'left', color: '#6C757D' }}>Date</th>
                                        <th style={{ padding: '5px 8px', borderBottom: '1px solid #DEE2E6', textAlign: 'left', color: '#6C757D' }}>Source</th>
                                        <th style={{ padding: '5px 8px', borderBottom: '1px solid #DEE2E6', textAlign: 'left', color: '#6C757D' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allEvidence.map((e: any, j: number) => (
                                        <tr key={j} style={{ borderBottom: '1px solid #F2F2F7' }}>
                                            <td style={{ padding: '4px 8px', color: '#495057', whiteSpace: 'nowrap' }}>{e.date}</td>
                                            <td style={{ padding: '4px 8px', color: '#495057' }}>{Array.isArray(e.source) ? e.source.join(', ') : e.source}</td>
                                            <td style={{ padding: '4px 8px', color: '#495057' }}>{e.action}</td>
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

/* ── Interests Section (3-column High/Medium/Low) ── */
function InterestsSection({ interests }: { interests: any[] }) {
    if (interests.length === 0) return null;

    const high = interests.filter(t => getConfidenceLevel(t.confidence_score) === 'high')
        .sort((a, b) => (b.confidence_score ?? 0) - (a.confidence_score ?? 0));
    const medium = interests.filter(t => getConfidenceLevel(t.confidence_score) === 'medium')
        .sort((a, b) => (b.confidence_score ?? 0) - (a.confidence_score ?? 0));
    const low = interests.filter(t => getConfidenceLevel(t.confidence_score) === 'low')
        .sort((a, b) => (b.confidence_score ?? 0) - (a.confidence_score ?? 0));

    const colStyle: React.CSSProperties = { flex: 1, minWidth: 0 };

    return (
        <Card style={{
            borderRadius: '16px', border: '1px solid #E9ECEF',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '24px', overflow: 'hidden',
        }}>
            <Card.Body style={{ padding: '20px 28px' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1C1C1E', display: 'flex', alignItems: 'center', gap: '10px' }}>
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
    const interests = data.interests || [];
    return (
        <div>
            <HeaderBar userId={userId} data={data} />
            <BiographySection biography={data.biography} />
            <FactsSection data={data} />
            <InterestsSection interests={interests} />
        </div>
    );
}
