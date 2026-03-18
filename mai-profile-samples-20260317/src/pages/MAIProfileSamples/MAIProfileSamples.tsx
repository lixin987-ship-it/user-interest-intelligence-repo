import { useState, useMemo } from 'react';
import { Container, Card, Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import MAIProfileView from './MAIProfileView';
import dogfoodRuns from 'virtual:dogfood-data';

interface ParsedRun {
    latestDate: string;
    profiles: Map<string, any>;
    userIds: string[];
}

function parseRun(raw: { latestDate: string; data: string }): ParsedRun {
    const profiles = new Map<string, any>();
    const lines = raw.data.trim().split('\n').filter(l => l.trim());

    for (const line of lines) {
        try {
            const obj = JSON.parse(line);
            const userId = obj.user_id;
            if (userId) profiles.set(userId, obj);
        } catch {
            // skip malformed lines
        }
    }

    const userIds = [...profiles.keys()].sort();
    return { latestDate: raw.latestDate, profiles, userIds };
}

function MAIProfileSamples() {
    const runKeys = useMemo(() => Object.keys(dogfoodRuns).sort().reverse(), []);
    const [selectedRun, setSelectedRun] = useState<string>(runKeys[0] || '');

    const parsedRun = useMemo(() => {
        const raw = dogfoodRuns[selectedRun];
        if (!raw) return null;
        return parseRun(raw);
    }, [selectedRun]);

    const userIds = parsedRun?.userIds || [];
    const [userId, setUserId] = useState<string>('');
    const [profileData, setProfileData] = useState<any>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRunChange = (run: string) => {
        setSelectedRun(run);
        setUserId('');
        setProfileData(null);
        setErrorMessage('');
    };

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
            if (!userId) setUserId(effectiveId);
        } catch (err: any) {
            setErrorMessage(err.message || 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const effectiveUserId = userId || userIds[0] || '';

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
                                            {key} (latest: {dogfoodRuns[key]?.latestDate || '?'})
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
                    {parsedRun && (
                        <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                            Latest date folder: <strong>{parsedRun.latestDate}</strong> · Users: <strong>{userIds.length}</strong>
                        </div>
                    )}
                    {errorMessage && (
                        <div className="alert alert-danger mt-3">{errorMessage}</div>
                    )}
                </Card.Body>
            </Card>

            {profileData && (
                <MAIProfileView data={profileData} userId={profileData.user_id || effectiveUserId} />
            )}
        </Container>
    );
}

export default MAIProfileSamples;
