import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Container, Card, Form, Button, Row, Col, Spinner, Nav } from 'react-bootstrap';
import MAIProfileView from './MAIProfileView';
import RawSignalsView from './RawSignalsView';
import IntermediateStepsView from './IntermediateStepsView';
import dogfoodManifest, { runLoaders, signalLoaders } from 'virtual:dogfood-data';
import intermediateManifest, { loaders as intermediateLoaders, rawLoaders as intermediateRawLoaders } from 'virtual:dogfood-intermediate-manifest';

interface ParsedRun {
    latestDate: string;
    runSummary: any | null;
    profiles: Map<string, any>;
    userIds: string[];
}

function parseRunData(data: string, latestDate: string, runSummary: any | null): ParsedRun {
    const profiles = new Map<string, any>();
    if (data) {
        const lines = data.trim().split('\n').filter(l => l.trim());
        for (const line of lines) {
            try {
                const obj = JSON.parse(line);
                const userId = obj.user_id;
                if (userId) profiles.set(userId, obj);
            } catch {
                // skip malformed lines
            }
        }
    }
    const userIds = [...profiles.keys()].sort();
    return { latestDate, runSummary, profiles, userIds };
}

function MAIProfileSamples() {
    const runKeys = useMemo(() => Object.keys(dogfoodManifest).sort().reverse(), []);
    const [selectedRun, setSelectedRun] = useState<string>(runKeys[0] || '');
    const [parsedRun, setParsedRun] = useState<ParsedRun | null>(null);
    const [runLoading, setRunLoading] = useState(false);

    // Cache loaded runs to avoid re-fetching
    const runCache = useRef<Record<string, ParsedRun>>({});

    const userIds = parsedRun?.userIds || [];
    const [userId, setUserId] = useState<string>('');
    const [profileData, setProfileData] = useState<any>(null);
    const [signalData, setSignalData] = useState<any[] | null>(null);
    const [signalLoading, setSignalLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'signal' | 'intermediate'>('profile');

    // Lazy-load run profile data when selectedRun changes
    useEffect(() => {
        if (!selectedRun) return;

        // Check cache first
        if (runCache.current[selectedRun]) {
            setParsedRun(runCache.current[selectedRun]);
            return;
        }

        const meta = dogfoodManifest[selectedRun];
        if (!meta) return;

        const loader = runLoaders[selectedRun];
        if (!loader) {
            // No loader means no data — show empty run
            const empty = parseRunData('', meta.latestDate, meta.runSummary);
            runCache.current[selectedRun] = empty;
            setParsedRun(empty);
            return;
        }

        setRunLoading(true);
        setParsedRun(null);
        loader().then(mod => {
            const parsed = parseRunData(mod.default, meta.latestDate, meta.runSummary);
            runCache.current[selectedRun] = parsed;
            setParsedRun(parsed);
        }).catch(() => {
            const empty = parseRunData('', meta.latestDate, meta.runSummary);
            runCache.current[selectedRun] = empty;
            setParsedRun(empty);
        }).finally(() => {
            setRunLoading(false);
        });
    }, [selectedRun]);

    const handleRunChange = (run: string) => {
        setSelectedRun(run);
        setUserId('');
        setProfileData(null);
        setSignalData(null);
        setErrorMessage('');
        setActiveTab('profile');
    };

    // Lazy-load signal data for a given run + userId
    const loadSignalData = useCallback(async (runKey: string, uid: string) => {
        setSignalLoading(true);
        setSignalData(null);
        try {
            const loader = signalLoaders[runKey];
            if (!loader) { setSignalData(null); return; }
            const mod = await loader();
            const rawData: string = mod.default;
            if (rawData) {
                const lines = rawData.trim().split('\n').filter((l: string) => l.trim());
                const userSignals: any[] = [];
                for (const line of lines) {
                    try {
                        const obj = JSON.parse(line);
                        if (obj.user_id === uid && Array.isArray(obj.signals)) {
                            userSignals.push(...obj.signals);
                        }
                    } catch { /* skip */ }
                }
                setSignalData(userSignals);
            }
        } catch {
            setSignalData(null);
        } finally {
            setSignalLoading(false);
        }
    }, []);

    const handleSubmit = () => {
        const effectiveId = userId || userIds[0] || '';
        if (!effectiveId) {
            setErrorMessage('Please select a User ID.');
            return;
        }
        setErrorMessage('');
        setIsLoading(true);
        setProfileData(null);

        try {
            const profile = parsedRun?.profiles.get(effectiveId) || null;
            if (!profile) {
                throw new Error('No data found for this user.');
            }
            setProfileData(profile);

            // If already on signal tab, reload signal data immediately
            setSignalData(null);
            setSignalLoading(false);
            if (activeTab === 'signal') {
                loadSignalData(selectedRun, effectiveId);
            }

            if (!userId) setUserId(effectiveId);
        } catch (err: any) {
            setErrorMessage(err.message || 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const effectiveUserId = userId || userIds[0] || '';

    // Dates for the selected run from the manifest (tiny, already loaded)
    const intermediateDates = intermediateManifest[selectedRun] || [];

    return (
        <Container className="mt-4">
            <h2 className="mb-4">MAI Profile V3 Dogfood Viewer</h2>

            <Card className="mb-4">
                <Card.Header>Query Parameters</Card.Header>
                <Card.Body>
                    <Row className="mb-3">
                        <Col md={5}>
                            <Form.Group>
                                <Form.Label>Dogfood Run</Form.Label>
                                <Form.Select
                                    value={selectedRun}
                                    onChange={(e) => handleRunChange(e.target.value)}
                                >
                                    {runKeys.length === 0 && <option value="">No runs available</option>}
                                    {runKeys.map(key => (
                                        <option key={key} value={key}>
                                            {key} (latest: {dogfoodManifest[key]?.latestDate || '?'})
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>User ID</Form.Label>
                                <Form.Select
                                    value={effectiveUserId}
                                    onChange={(e) => {
                                        setUserId(e.target.value);
                                        setProfileData(null);
                                    }}
                                >
                                    {userIds.length === 0 && <option value="">No users available</option>}
                                    {userIds.map(id => (
                                        <option key={id} value={id}>{id}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3} className="d-flex align-items-end">
                            <Button
                                variant="primary"
                                onClick={handleSubmit}
                                disabled={isLoading || userIds.length === 0}
                            >
                                {isLoading ? (
                                    <>
                                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                                        Loading...
                                    </>
                                ) : 'Submit'}
                            </Button>
                        </Col>
                    </Row>
                    {runLoading && (
                        <div className="text-center py-2">
                            <Spinner animation="border" size="sm" variant="primary" className="me-2" />
                            <span className="text-muted" style={{ fontSize: '0.85rem' }}>Loading run data...</span>
                        </div>
                    )}
                    {!runLoading && parsedRun && parsedRun.userIds.length > 0 && (
                        <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                            Latest date folder: <strong>{parsedRun.latestDate}</strong> · Users: <strong>{userIds.length}</strong>
                        </div>
                    )}
                    {!runLoading && parsedRun && parsedRun.userIds.length === 0 && (
                        <div className="alert alert-info mt-2 mb-0" style={{ fontSize: '0.85rem' }}>
                            No <code>layer4_postprocessing.jsonl</code> found for this run{parsedRun.latestDate ? ` (latest date: ${parsedRun.latestDate})` : ' (no date folders)'}.
                            The run may still be in progress.
                        </div>
                    )}
                    {errorMessage && (
                        <div className="alert alert-danger mt-3">{errorMessage}</div>
                    )}
                </Card.Body>
            </Card>

            {profileData && (
                <>
                    <Nav variant="tabs" className="mb-3">
                        <Nav.Item>
                            <Nav.Link
                                active={activeTab === 'profile'}
                                onClick={() => setActiveTab('profile')}
                                style={{ cursor: 'pointer' }}
                            >
                                MAI Profile
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link
                                active={activeTab === 'signal'}
                                onClick={() => {
                                    setActiveTab('signal');
                                    // Lazy-load signal data on first click
                                    if (!signalData && !signalLoading) {
                                        const uid = profileData?.user_id || effectiveUserId;
                                        loadSignalData(selectedRun, uid);
                                    }
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                Raw Signal
                            </Nav.Link>
                        </Nav.Item>                        <Nav.Item>
                            <Nav.Link
                                active={activeTab === 'intermediate'}
                                onClick={() => setActiveTab('intermediate')}
                                style={{ cursor: 'pointer' }}
                            >Intermediate Steps
                            </Nav.Link>
                        </Nav.Item>                    </Nav>

                    {activeTab === 'profile' && (
                        <MAIProfileView data={profileData} userId={profileData.user_id || effectiveUserId} runSummary={parsedRun?.runSummary} />
                    )}
                    {activeTab === 'signal' && signalLoading && (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <div className="mt-2 text-muted">Loading raw signals...</div>
                        </div>
                    )}
                    {activeTab === 'signal' && !signalLoading && signalData && (
                        <RawSignalsView signals={signalData} />
                    )}
                    {activeTab === 'signal' && !signalLoading && !signalData && (
                        <div className="alert alert-warning">No raw signal data available for this run.</div>
                    )}
                    {activeTab === 'intermediate' && intermediateDates.length > 0 && (
                        <IntermediateStepsView
                            userId={profileData.user_id || effectiveUserId}
                            runKey={selectedRun}
                            dates={intermediateDates}
                            loader={(key, raw) => raw ? intermediateRawLoaders[key]() : intermediateLoaders[key]()}
                        />
                    )}
                    {activeTab === 'intermediate' && intermediateDates.length === 0 && (
                        <div className="alert alert-warning">No intermediate data available for this run.</div>
                    )}
                </>
            )}
        </Container>
    );
}

export default MAIProfileSamples;
