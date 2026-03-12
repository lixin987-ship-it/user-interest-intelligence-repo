import { useState, useMemo } from 'react';
import { Container, Card, Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import MAIProfileView from './MAIProfileView';

// Load the NDJSON interest file and TSV demographics file as raw text
const jsonRaw = import.meta.glob('./Data/*.json', { eager: true, query: '?raw', import: 'default' });
const tsvRaw = import.meta.glob('./Data/*.tsv', { eager: true, query: '?raw', import: 'default' });

interface V3UserRecord {
    UserId: string;
    Date: string;
    FromDate: string;
    ToDate: string;
    Version: string;
    Layer: string;
    Interests: any[];
    Biography: string;
    LifeStage: { Value: string; Confidence: string; Evidence: string[] };
}

interface TsvDemographics {
    CurrentLocation: string;
    RecentVisit: string[];
    Age: string;
    Gender: string;
}

function parseNdjson(raw: string): V3UserRecord[] {
    return raw.trim().split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
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

function loadData() {
    // Parse the first (only) JSON file
    const jsonPath = Object.keys(jsonRaw)[0];
    const records = jsonPath ? parseNdjson(jsonRaw[jsonPath] as string) : [];

    // Parse the first (only) TSV file
    const tsvPath = Object.keys(tsvRaw)[0];
    const demographics = tsvPath ? parseTsv(tsvRaw[tsvPath] as string) : new Map<string, TsvDemographics>();

    return { records, demographics };
}

function MAIProfileSamples() {
    const { records, demographics } = useMemo(() => loadData(), []);
    const availableUserIds = useMemo(() => records.map(r => r.UserId), [records]);

    const [userId, setUserId] = useState<string>(availableUserIds[0] || '');
    const [isLoading, setIsLoading] = useState(false);
    const [sampleData, setSampleData] = useState<any>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');

    const handleSubmit = () => {
        if (!userId) {
            setErrorMessage('Please select a User ID.');
            return;
        }
        setErrorMessage('');
        setIsLoading(true);
        setSampleData(null);

        try {
            const record = records.find(r => r.UserId === userId);
            if (!record) {
                throw new Error('No matching user record found.');
            }
            const demo = demographics.get(userId);
            // Build combined data for the view
            setSampleData({ ...record, demographics: demo || null });
        } catch (err: any) {
            setErrorMessage(err.message || 'An error occurred while loading sample data.');
        } finally {
            setIsLoading(false);
        }
    };

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
                                        setSampleData(null);
                                    }}
                                >
                                    {availableUserIds.length === 0 && <option value="">No samples available</option>}
                                    {availableUserIds.map(id => (
                                        <option key={id} value={id}>{id}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3} className="d-flex align-items-end">
                            <Button
                                variant="primary"
                                onClick={handleSubmit}
                                disabled={isLoading || availableUserIds.length === 0}
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

            {sampleData && (
                <MAIProfileView data={sampleData} userId={userId} />
            )}
        </Container>
    );
}

export default MAIProfileSamples;
