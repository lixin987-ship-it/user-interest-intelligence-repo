import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, Accordion, Spinner, Badge } from 'react-bootstrap';

// ─── Types ───────────────────────────────────────────────────────────

interface Signal {
    Date: string;
    Source: string;
    Action: string;
    should_filter: boolean;
    intent?: string;
    filter_reason?: string;
}

interface Topic {
    topic: string;
    count?: number;
    source?: string[];
    intent?: string;
    evidence?: { date: string; source?: string[]; action: string }[];
    confidence_score?: number;
}

interface Interest {
    interest_name: string;
    actual_activity?: string;
    inferred_intent?: string;
    confidence_score?: number;
    topics?: Topic[];
    state?: string;
    temporal?: string;
    count?: number;
    first_detect_date?: string;
    last_detect_date?: string;
    source?: string[];
}

interface MergeDecision {
    action: string;
    delta_interest_name: string;
    snapshot_interest_name?: string[];
    merged_interest_name?: string;
    merged_actual_activity?: string;
    merged_inferred_intent?: string;
    actual_activity?: string;
    inferred_intent?: string;
    reasoning?: string;
}

interface DeltaWindowData {
    date: string;
    signals?: { total: number; kept: number; filtered: number; items: Signal[] };
    deltaInterests?: Interest[];
    mergeDecisions?: MergeDecision[];
    snapshot?: Interest[];
    prevSnapshot?: Interest[];
    // Raw JSON per layer for debug viewing
    rawSignals?: any;
    rawDelta?: any;
    rawMerge?: any;
    rawSnapshot?: any;
    rawPrevSnapshot?: any;
}

interface IntermediateStepsViewProps {
    userId: string;
    runKey: string;
    dates: string[];  // sorted ascending from manifest
    loader: (key: string) => Promise<{ default: Record<string, string> }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function formatDate(d: string): string {
    if (/^\d{8}$/.test(d)) return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
    return d;
}

function confPercent(score: number | undefined): string {
    if (score == null) return '—';
    return `${Math.round(score * 100)}%`;
}

function parseJsonlForUser(jsonl: string, userId: string): any | null {
    const lines = jsonl.trim().split('\n').filter(l => l.trim());
    for (const line of lines) {
        try {
            const obj = JSON.parse(line);
            if (obj.user_id === userId) return obj;
        } catch { /* skip */ }
    }
    return null;
}

function parseDateData(raw: Record<string, string>, userId: string, date: string): DeltaWindowData {
    const win: DeltaWindowData = { date };

    if (raw['layer0_signal']) {
        const signals = parseJsonlForUser(raw['layer0_signal'], userId);
        if (signals?.signals) {
            const items: Signal[] = signals.signals;
            win.signals = {
                total: items.length,
                kept: items.filter((s: Signal) => !s.should_filter).length,
                filtered: items.filter((s: Signal) => s.should_filter).length,
                items,
            };
        }
        win.rawSignals = signals;
    }
    if (raw['layer1_postprocessing']) {
        const delta = parseJsonlForUser(raw['layer1_postprocessing'], userId);
        if (delta) win.deltaInterests = delta.interests || [];
        win.rawDelta = delta;
    }
    if (raw['layer2_merge']) {
        const merge = parseJsonlForUser(raw['layer2_merge'], userId);
        if (merge) win.mergeDecisions = merge.decisions || [];
        win.rawMerge = merge;
    }
    if (raw['layer2_postmerge']) {
        const snapshot = parseJsonlForUser(raw['layer2_postmerge'], userId);
        if (snapshot) win.snapshot = snapshot.interests || [];
        win.rawSnapshot = snapshot;
    }
    if (raw['prev_layer2_postmerge']) {
        const prev = parseJsonlForUser(raw['prev_layer2_postmerge'], userId);
        if (prev) win.prevSnapshot = prev.interests || [];
        win.rawPrevSnapshot = prev;
    }
    return win;
}

const sectionTitle: React.CSSProperties = {
    fontSize: '0.78rem', fontWeight: 700, color: '#0d6efd',
    letterSpacing: '0.03em',
    marginBottom: 8, marginTop: 0, paddingTop: 12,
    borderTop: '2px solid #dee2e6',
};

const sectionTitleFirst: React.CSSProperties = {
    ...sectionTitle,
    borderTop: 'none', paddingTop: 0, marginTop: 0,
};

const tableStyle: React.CSSProperties = {
    fontSize: '0.82rem', width: '100%', borderCollapse: 'collapse',
};

const thStyle: React.CSSProperties = {
    background: '#f8f9fa', borderBottom: '2px solid #dee2e6',
    padding: '6px 8px', textAlign: 'left', fontWeight: 600, fontSize: '0.78rem',
};

const tdStyle: React.CSSProperties = {
    padding: '5px 8px', borderBottom: '1px solid #eee', verticalAlign: 'top',
};

// ─── Sub-Components ──────────────────────────────────────────────────

/* ── Raw JSON viewer button + popover ── */
function RawJsonButton({ data, fileName }: { data: any; fileName?: string }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    if (!data) return null;

    return (
        <span ref={ref} style={{ position: 'relative', display: 'inline-block', marginLeft: 'auto' }}>
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    fontSize: '0.7rem', padding: '1px 8px', border: '1px solid #adb5bd',
                    borderRadius: 4, background: open ? '#e9ecef' : '#fff', color: '#495057',
                    cursor: 'pointer', lineHeight: '1.5',
                }}
            >{open ? 'Hide' : 'Raw JSON'}</button>
            {open && (
                <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: 4,
                    zIndex: 1050, width: 520, maxHeight: 420, overflowY: 'auto',
                    backgroundColor: '#f8f9fa', color: '#212529', borderRadius: 8,
                    border: '1px solid #dee2e6',
                    padding: '12px 14px', fontSize: '0.72rem', fontFamily: 'monospace',
                    lineHeight: '1.5', boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
                        paddingBottom: 6, borderBottom: '1px solid #dee2e6' }}>
                        <span style={{ color: '#495057', fontSize: '0.75rem', fontWeight: 600 }}>
                            {fileName ? `📄 ${fileName}` : 'Raw JSON'}
                        </span>
                        <span onClick={() => setOpen(false)}
                            style={{ color: '#6c757d', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>&times;</span>
                    </div>
                    {JSON.stringify(data, null, 2)}
                </div>
            )}
        </span>
    );
}

/* ── Section header with optional JSON button ── */
function SectionHeader({ style, title, rawJson, fileName }: { style: React.CSSProperties; title: string; rawJson?: any; fileName?: string }) {
    return (
        <div style={{ ...style, display: 'flex', alignItems: 'center' }}>
            <span>{title}</span>
            <RawJsonButton data={rawJson} fileName={fileName} />
        </div>
    );
}

/* ── Topic Tag with click popover (shows evidence + intent) ── */
function DeltaTopicTag({ topic }: { topic: Topic }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);
    const evidenceCount = Array.isArray(topic.evidence) ? topic.evidence.length : 0;

    // Close on click outside
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
        <span ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
            <span
                onClick={() => setOpen(o => !o)}
                style={{
                    display: 'inline-block', padding: '3px 10px',
                    backgroundColor: open ? '#DDD6FE' : '#EEF2FF', borderRadius: '5px',
                    fontSize: '0.78rem', color: '#4F46E5', border: '1px solid #C7D2FE',
                    cursor: 'pointer', transition: 'background-color 0.15s',
                    userSelect: 'none',
                }}>{topic.topic}</span>

            {open && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginTop: 4,
                    zIndex: 1050,
                    width: '300px',
                }}>
                    <div style={{
                        width: '100%', padding: '10px 12px',
                        backgroundColor: '#1A1B2E', color: '#E2E8F0', borderRadius: '8px',
                        fontSize: '0.75rem', lineHeight: '1.6',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#fff' }}>{topic.topic}</span>
                            <span onClick={() => setOpen(false)}
                                style={{ color: '#94A3B8', cursor: 'pointer', fontSize: '0.9rem', lineHeight: 1 }}>&times;</span>
                        </div>
                        {topic.intent && <div><span style={{ color: '#94A3B8' }}>Intent:</span> {topic.intent}</div>}
                        {topic.source && topic.source.length > 0 && (
                            <div><span style={{ color: '#94A3B8' }}>Source:</span> {topic.source.join(', ')}</div>
                        )}
                        {topic.confidence_score != null && (
                            <div><span style={{ color: '#94A3B8' }}>Confidence:</span> {confPercent(topic.confidence_score)}</div>
                        )}
                        {evidenceCount > 0 && (
                            <div style={{ marginTop: 4, borderTop: '1px solid #334155', paddingTop: 4, maxHeight: 150, overflowY: 'auto' }}>
                                <div style={{ color: '#94A3B8', marginBottom: 2 }}>Evidence ({evidenceCount}):</div>
                                {topic.evidence!.map((e, j) => (
                                    <div key={j} style={{ color: '#CBD5E1', fontSize: '0.7rem', marginBottom: 2 }}>
                                        <span style={{ color: '#64748B' }}>{e.date}</span>{' '}
                                        {Array.isArray(e.source) ? e.source.join('/') : ''} — {e.action}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </span>
    );
}

function DeltaInterestDetail({ interests }: { interests: Interest[] }) {
    if (!interests || interests.length === 0) {
        return <div className="text-muted" style={{ fontSize: '0.82rem' }}>No delta interests</div>;
    }

    return (
        <div style={{ border: '1px solid #dee2e6', borderRadius: 4, overflow: 'visible' }}>
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={thStyle}>Interest</th>
                        <th style={{ ...thStyle, width: 80 }}>Temporal</th>
                        <th style={{ ...thStyle, width: 55 }}>Decay</th>
                        <th style={thStyle}>Topics</th>
                    </tr>
                </thead>
                <tbody>
                    {interests.map((interest, idx) => (
                        <tr key={idx}>
                            <td style={{ ...tdStyle, fontWeight: 700 }}>{interest.interest_name}</td>
                            <td style={tdStyle}>{interest.temporal || ''}</td>
                            <td style={tdStyle}>{(interest as any).decay != null ? (interest as any).decay : ''}</td>
                            <td style={tdStyle}>
                                {(interest.topics || []).length > 0 ? (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                        {(interest.topics || []).map((t, ti) => (
                                            <DeltaTopicTag key={ti} topic={t} />
                                        ))}
                                    </div>
                                ) : '—'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function SignalSummary({ signals }: { signals: DeltaWindowData['signals'] }) {
    const [expanded, setExpanded] = useState(false);
    if (!signals) return <div className="text-muted" style={{ fontSize: '0.82rem' }}>No signal data</div>;

    return (
        <div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: '0.85rem', marginBottom: 8 }}>
                <span>Total: {signals.total}</span>
                <span style={{ color: '#198754', fontWeight: 600 }}>Kept: {signals.kept}</span>
                <span style={{ color: '#6c757d' }}>Filtered: {signals.filtered}</span>
                <button
                    className={expanded ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-outline-primary'}
                    onClick={() => setExpanded(!expanded)}
                    style={{ fontSize: '0.78rem', padding: '3px 12px', marginLeft: 8 }}
                >
                    {expanded ? 'Hide Signals' : `Show ${signals.kept} Kept Signals ▾`}
                </button>
            </div>
            {expanded && (
                <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: 4 }}>
                    <table style={{ ...tableStyle, tableLayout: 'fixed' }}>
                        <colgroup>
                            <col style={{ width: 90 }} />
                            <col style={{ width: 70 }} />
                            <col />
                            <col style={{ width: '30%' }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th style={thStyle}>Date</th>
                                <th style={thStyle}>Source</th>
                                <th style={thStyle}>Action</th>
                                <th style={thStyle}>Intent</th>
                            </tr>
                        </thead>
                        <tbody>
                            {signals.items.filter(s => !s.should_filter).map((s, i) => (
                                <tr key={i}>
                                    <td style={tdStyle}>{s.Date}</td>
                                    <td style={tdStyle}>{s.Source}</td>
                                    <td style={{ ...tdStyle, wordBreak: 'break-word' }}>{s.Action}</td>
                                    <td style={{ ...tdStyle, fontSize: '0.82rem' }}>{s.intent || ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function InterestTable({ interests, title, compact, first }: { interests: Interest[]; title: string; compact?: boolean; first?: boolean }) {
    if (!interests || interests.length === 0) {
        return title ? (
            <div>
                <div style={first ? sectionTitleFirst : sectionTitle}>{title}</div>
                <div className="text-muted" style={{ fontSize: '0.82rem' }}>No interests</div>
            </div>
        ) : <div className="text-muted" style={{ fontSize: '0.82rem' }}>No interests</div>;
    }

    return (
        <div>
            {title && <div style={first ? sectionTitleFirst : sectionTitle}>{title} ({interests.length})</div>}
            <div style={{ maxHeight: compact ? 200 : 300, overflowY: 'auto', border: '1px solid #eee', borderRadius: 4 }}>
                <table style={tableStyle}>
                    <thead>
                        <tr>
                            <th style={thStyle}>Interest</th>
                            <th style={{ ...thStyle, width: 60 }}>Conf</th>
                            <th style={{ ...thStyle, width: 70 }}>State</th>
                            <th style={thStyle}>Topics</th>
                        </tr>
                    </thead>
                    <tbody>
                        {interests.map((interest, i) => (
                            <tr key={i}>
                                <td style={{ ...tdStyle, fontWeight: 700 }}>{interest.interest_name}</td>
                                <td style={tdStyle}>{confPercent(interest.confidence_score)}</td>
                                <td style={tdStyle}>{interest.state || ''}</td>
                                <td style={tdStyle}>
                                    {(interest.topics || []).map(t => t.topic).join(', ')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function MergeDecisionsTable({ decisions, rawJson }: { decisions: MergeDecision[]; rawJson?: any }) {
    if (!decisions || decisions.length === 0) {
        return (
            <div>
                <SectionHeader style={sectionTitle} title="Layer 2 — Merge Decisions" rawJson={rawJson} fileName="layer2_merge.jsonl" />
                <div className="text-muted" style={{ fontSize: '0.82rem' }}>No merge decisions (first window)</div>
            </div>
        );
    }

    return (
        <div>
            <SectionHeader style={sectionTitle} title={`Layer 2 — Merge Decisions (${decisions.length})`} rawJson={rawJson} fileName="layer2_merge.jsonl" />
            <div style={{ maxHeight: 250, overflowY: 'auto', border: '1px solid #eee', borderRadius: 4 }}>
                <table style={{ ...tableStyle, tableLayout: 'fixed' }}>
                    <colgroup>
                        <col style={{ width: 60 }} />
                        <col style={{ width: '22%' }} />
                        <col style={{ width: '22%' }} />
                        <col style={{ width: '22%' }} />
                        <col />
                    </colgroup>
                    <thead>
                        <tr>
                            <th style={thStyle}>Action</th>
                            <th style={thStyle}>Delta Interest</th>
                            <th style={thStyle}>Snapshot Target(s)</th>
                            <th style={thStyle}>Merged Name</th>
                            <th style={thStyle}>Reasoning</th>
                        </tr>
                    </thead>
                    <tbody>
                        {decisions.map((d, i) => (
                            <tr key={i}>
                                <td style={tdStyle}>
                                    <Badge bg={d.action === 'add' ? 'success' : d.action === 'merge' ? 'primary' : 'secondary'}
                                        style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                                        {d.action}
                                    </Badge>
                                </td>
                                <td style={{ ...tdStyle, fontWeight: 700 }}>{d.delta_interest_name}</td>
                                <td style={{ ...tdStyle, fontWeight: 700 }}>
                                    {d.action === 'merge' ? (d.snapshot_interest_name || []).map((name, ni) => (
                                        <div key={ni} style={{ paddingLeft: 10 }}>• {name}</div>
                                    )) : '—'}
                                </td>
                                <td style={{ ...tdStyle, fontWeight: 700 }}>
                                    {d.action === 'merge' ? d.merged_interest_name : '—'}
                                </td>
                                <td style={tdStyle}>
                                    {d.reasoning || ''}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function SnapshotDiff({ prev, current }: { prev: Interest[]; current: Interest[] }) {
    const [expanded, setExpanded] = useState(false);
    if (!prev || prev.length === 0 || !current || current.length === 0) return null;

    const prevNames = new Set(prev.map(i => i.interest_name));
    const currNames = new Set(current.map(i => i.interest_name));

    const added = current.filter(i => !prevNames.has(i.interest_name));
    const removed = prev.filter(i => !currNames.has(i.interest_name));
    const retained = current.filter(i => prevNames.has(i.interest_name));

    const prevMap = new Map(prev.map(i => [i.interest_name, i]));
    const changes = retained.map(curr => {
        const prevInterest = prevMap.get(curr.interest_name);
        const prevConf = prevInterest?.confidence_score ?? 0;
        const currConf = curr.confidence_score ?? 0;
        const delta = currConf - prevConf;
        return { name: curr.interest_name, prevConf, currConf, delta };
    }).filter(c => Math.abs(c.delta) > 0.001);

    if (added.length === 0 && removed.length === 0 && changes.length === 0) return null;

    // Build unified rows for the diff table
    type DiffRow = { name: string; type: 'added' | 'removed' | 'changed'; prev?: string; curr?: string; delta?: number };
    const rows: DiffRow[] = [
        ...added.map(i => ({ name: i.interest_name, type: 'added' as const, curr: confPercent(i.confidence_score) })),
        ...removed.map(i => ({ name: i.interest_name, type: 'removed' as const, prev: confPercent(i.confidence_score) })),
        ...changes.map(c => ({ name: c.name, type: 'changed' as const, prev: `${Math.round(c.prevConf * 100)}%`, curr: `${Math.round(c.currConf * 100)}%`, delta: c.delta })),
    ];

    return (
        <div>
            <div style={sectionTitle}>
                <a href="#" onClick={(e) => { e.preventDefault(); setExpanded(!expanded); }}
                    style={{ color: '#0d6efd', textDecoration: 'none', fontWeight: 700, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {expanded ? '▾' : '▸'} Snapshot Diff ({rows.length} change{rows.length !== 1 ? 's' : ''})
                </a>
            </div>
            {expanded && (
                <div style={{ border: '1px solid #dee2e6', borderRadius: 4, maxHeight: 200, overflowY: 'auto' }}>
                <table style={tableStyle}>
                    <thead>
                        <tr>
                            <th style={thStyle}>Change</th>
                            <th style={thStyle}>Interest Name</th>
                            <th style={{ ...thStyle, width: 80 }}>Before</th>
                            <th style={{ ...thStyle, width: 80 }}>After</th>
                            <th style={{ ...thStyle, width: 70 }}>Delta</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, i) => (
                            <tr key={i} style={{ backgroundColor: r.type === 'added' ? '#d1e7dd' : r.type === 'removed' ? '#f8d7da' : undefined }}>
                                <td style={tdStyle}>
                                    <Badge bg={r.type === 'added' ? 'success' : r.type === 'removed' ? 'danger' : 'info'}
                                        style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                                        {r.type === 'added' ? '+ Added' : r.type === 'removed' ? '− Removed' : '↕ Changed'}
                                    </Badge>
                                </td>
                                <td style={{ ...tdStyle, fontWeight: 700 }}>{r.name}</td>
                                <td style={tdStyle}>{r.prev ?? '—'}</td>
                                <td style={tdStyle}>{r.curr ?? '—'}</td>
                                <td style={tdStyle}>
                                    {r.delta != null ? (
                                        <span style={{ color: r.delta > 0 ? '#198754' : r.delta < 0 ? '#dc3545' : undefined, fontWeight: 600 }}>
                                            {r.delta > 0 ? '+' : ''}{Math.round(r.delta * 100)}
                                        </span>
                                    ) : '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            )}
        </div>
    );
}

/* ── Collapsible PostMerge Snapshot ── */
function CollapsibleSnapshot({ interests, rawJson }: { interests: Interest[]; rawJson?: any }) {
    const [expanded, setExpanded] = useState(false);
    const count = interests?.length || 0;

    return (
        <div>
            <div style={{ ...sectionTitle, display: 'flex', alignItems: 'center' }}>
                <a href="#" onClick={(e) => { e.preventDefault(); setExpanded(!expanded); }}
                    style={{ color: '#0d6efd', textDecoration: 'none', fontWeight: 700, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {expanded ? '▾' : '▸'} Layer 2 PostMerge — Current Snapshot ({count})
                </a>
                <RawJsonButton data={rawJson} fileName="layer2_postmerge.jsonl" />
            </div>
            {expanded && (
                <div style={{ maxWidth: 600 }}>
                    <InterestTable interests={interests} title="" />
                </div>
            )}
        </div>
    );
}

// ─── Per-Date Accordion Item (lazy loaded) ───────────────────────────

function DateWindowItem({
    date, isFirst, userId, runKey, loader,
}: {
    date: string; isFirst: boolean;
    userId: string; runKey: string;
    loader: (key: string) => Promise<{ default: Record<string, string> }>;
}) {
    const [data, setData] = useState<DeltaWindowData | null>(null);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const handleEnter = useCallback(async () => {
        if (loaded) return;
        setLoading(true);
        try {
            const mod = await loader(`${runKey}/${date}`);
            const raw = mod.default;
            setData(parseDateData(raw, userId, date));
        } catch (e) {
            console.error('Failed to load date', date, e);
        } finally {
            setLoading(false);
            setLoaded(true);
        }
    }, [loaded, loader, runKey, date, userId]);

    return (
        <Accordion.Item eventKey={date}>
            <Accordion.Header onClick={handleEnter}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', fontSize: '0.84rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0d6efd', minWidth: 100 }}>
                        {formatDate(date)}
                    </span>
                    {data && (
                        <span style={{ color: '#495057', fontSize: '0.82rem' }}>
                            {data.signals ? `${data.signals.kept} signals` : '—'}
                            {' → '}
                            {data.deltaInterests ? `${data.deltaInterests.length} delta interests` : '—'}
                            {data.mergeDecisions && data.mergeDecisions.length > 0 ? ` → ${data.mergeDecisions.length} merge decisions` : isFirst ? ' (first window)' : ''}
                            {' → '}
                            {data.snapshot ? `${data.snapshot.length} in snapshot` : '—'}
                        </span>
                    )}
                    {!loaded && !loading && (
                        <span style={{ color: '#aaa', fontStyle: 'italic', fontSize: '0.8rem' }}>click to load</span>
                    )}
                    {loading && (
                        <Spinner animation="border" size="sm" variant="secondary" />
                    )}
                </div>
            </Accordion.Header>
            <Accordion.Body style={{ padding: '10px 14px 10px 28px' }}>
                {loading && (
                    <div className="text-center py-3">
                        <Spinner animation="border" size="sm" variant="primary" />
                        <span className="ms-2 text-muted">Loading...</span>
                    </div>
                )}
                {data && (
                    <>
                        <SectionHeader style={sectionTitleFirst} title="Layer 0 — Denoised Signals" rawJson={data.rawSignals} fileName="layer0_signal.jsonl" />
                        <SignalSummary signals={data.signals} />

                        <SectionHeader style={sectionTitle} title={`Layer 1 — Delta Interests (${(data.deltaInterests || []).length})`} rawJson={data.rawDelta} fileName="layer1_postprocessing.jsonl" />
                        <DeltaInterestDetail interests={data.deltaInterests || []} />

                        {!isFirst && (
                            <>
                                <SectionHeader style={sectionTitle} title={`Previous Snapshot (${(data.prevSnapshot || []).length})`} rawJson={data.rawPrevSnapshot} fileName="prev_layer2_postmerge.jsonl" />
                                <InterestTable
                                    interests={data.prevSnapshot || []}
                                    title=""
                                    compact
                                />
                            </>
                        )}

                        <MergeDecisionsTable decisions={data.mergeDecisions || []} rawJson={data.rawMerge} />
                        <SnapshotDiff prev={data.prevSnapshot || []} current={data.snapshot || []} />

                        <CollapsibleSnapshot interests={data.snapshot || []} rawJson={data.rawSnapshot} />
                    </>
                )}
                {loaded && !loading && !data && (
                    <div className="text-muted">No data found for this user in this window.</div>
                )}
            </Accordion.Body>
        </Accordion.Item>
    );
}

// ─── Main Component ──────────────────────────────────────────────────

export default function IntermediateStepsView({ userId, runKey, dates, loader }: IntermediateStepsViewProps) {
    if (!dates || dates.length === 0) {
        return <div className="alert alert-warning">No intermediate data available.</div>;
    }

    // Reverse: newest first
    const reversedDates = [...dates].reverse();

    return (
        <Card className="mb-4">
            <Card.Header>
                Intermediate Steps — {dates.length} delta window{dates.length !== 1 ? 's' : ''}
                <span className="ms-2" style={{ fontSize: '0.85rem' }}>
                    (User: {userId})
                </span>
            </Card.Header>
            <Card.Body style={{ padding: '8px 12px' }}>
                <Accordion>
                    {reversedDates.map((date) => {
                        const isFirst = date === dates[0];
                        return (
                            <DateWindowItem
                                key={date}
                                date={date}
                                isFirst={isFirst}
                                userId={userId}
                                runKey={runKey}
                                loader={loader}
                            />
                        );
                    })}
                </Accordion>
            </Card.Body>
        </Card>
    );
}
