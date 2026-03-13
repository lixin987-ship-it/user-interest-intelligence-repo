import { useState, useMemo } from 'react';
import { Container, Card, Form, Button, Row, Col, Spinner, Nav } from 'react-bootstrap';
import MAIProfileView from './MAIProfileView';
import RawSignalsView from './RawSignalsView';

// Load all data files as raw text at build time
const jsonlRaw = import.meta.glob('./Data/*.jsonl', { eager: true, query: '?raw', import: 'default' });
const tsvRaw = import.meta.glob('./Data/*.tsv', { eager: true, query: '?raw', import: 'default' });

interface TsvDemographics {
    CurrentLocation: string;
    RecentVisit: string[];
    Age: string;
    Gender: string;
}

interface ParsedData {
    profiles: Map<string, any>;
    signals: Map<string, any[]>;
    demographics: Map<string, TsvDemographics>;
    userIds: string[];
}

function parseTsv(raw: string): Map<string, TsvDemographics> {
    const map = new Map<string, TsvDemographics>();
    const lines = raw.trim().split('\n');
    if (lines.length < 2) return map;
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].replace(/\r$/, '').split('\t');
        if (cols.length < 5) continue;
        const [userId, currentLocation, recentVisitRaw, age, gender] = cols;
        map.set(userId.trim(), {
            CurrentLocation: currentLocation?.trim() || '',
            RecentVisit: recentVisitRaw ? recentVisitRaw.split('#TAB#').map(s => s.trim()).filter(Boolean) : [],
            Age: age?.trim() || '',
            Gender: gender?.trim() || '',
        });
    }
    return map;
}

function parseAllData(): ParsedData {
    const profiles = new Map<string, any>();
    const signals = new Map<string, any[]>();
    let demographics = new Map<string, TsvDemographics>();

    for (const [path, raw] of Object.entries(jsonlRaw)) {
        const filename = path.split('/').pop() || '';
        const text = raw as string;
        const lines = text.trim().split('\n').filter(l => l.trim());

        if (filename.toLowerCase().includes('interest')) {
            for (const line of lines) {
                const obj = JSON.parse(line);
                const userId = obj.Facts?.Identity?.MAI_ID;
                if (userId) profiles.set(userId, obj);
            }
        } else if (filename.toLowerCase().includes('signal')) {
            for (const line of lines) {
                const obj = JSON.parse(line);
                const userId = obj.user_id;
                if (userId) {
                    if (!signals.has(userId)) signals.set(userId, []);
                    signals.get(userId)!.push(obj);
                }
            }
        }
    }

    // Parse TSV demographics
    const tsvPath = Object.keys(tsvRaw)[0];
    if (tsvPath) demographics = parseTsv(tsvRaw[tsvPath] as string);

    const allIds = new Set([...profiles.keys(), ...signals.keys()]);
    const userIds = [...allIds].sort();
    return { profiles, signals, demographics, userIds };
}

function MAIProfileSamples() {
    const { profiles, signals, demographics, userIds } = useMemo(() => parseAllData(), []);

    const [userId, setUserId] = useState<string>(userIds[0] || '');
    const [isLoading, setIsLoading] = useState(false);
    const [profileData, setProfileData] = useState<any>(null);
    const [signalData, setSignalData] = useState<any[]>([]);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [activeTab, setActiveTab] = useState<string>('profile');

    const handleSubmit = () => {
        if (!userId) {
            setErrorMessage('Please select a User ID.');
            return;
        }
        setErrorMessage('');
        setIsLoading(true);
        setProfileData(null);
        setSignalData([]);

        try {
            const profile = profiles.get(userId) || null;
            const sigs = signals.get(userId) || [];
            if (!profile && sigs.length === 0) {
                throw new Error('No data found for this user.');
            }
            const demo = demographics.get(userId) || null;
            setProfileData({ ...profile, _demographics: demo });
            setSignalData(sigs);
        } catch (err: any) {
            setErrorMessage(err.message || 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const hasProfile = profileData != null;
    const hasSignals = signalData.length > 0;

    return (
        <Container className="mt-4">
            <h2 className="mb-4">MAI Profile V3 Samples</h2>

            <Card className="mb-4">
                <Card.Header>Query Parameters</Card.Header>
                <Card.Body>
                    <Row className="mb-3">
                        <Col md={5}>
                            <Form.Group>
                                <Form.Label>User ID</Form.Label>
                                <Form.Select
                                    value={userId}
                                    onChange={(e) => {
                                        setUserId(e.target.value);
                                        setProfileData(null);
                                        setSignalData([]);
                                    }}
                                >
                                    {userIds.length === 0 && <option value="">No samples available</option>}
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
                    {errorMessage && (
                        <div className="alert alert-danger mt-3">{errorMessage}</div>
                    )}
                </Card.Body>
            </Card>

            {(hasProfile || hasSignals) && (
                <>
                    <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'profile')} className="mb-3">
                        {hasProfile && <Nav.Item><Nav.Link eventKey="profile">MAI Profile</Nav.Link></Nav.Item>}
                        {hasSignals && <Nav.Item><Nav.Link eventKey="signals">Raw Signals ({signalData.length})</Nav.Link></Nav.Item>}
                    </Nav>

                    {activeTab === 'profile' && hasProfile && (
                        <MAIProfileView data={profileData} userId={userId} />
                    )}
                    {activeTab === 'signals' && hasSignals && (
                        <RawSignalsView signals={signalData} />
                    )}
                </>
            )}
        </Container>
    );
}

export default MAIProfileSamples;
