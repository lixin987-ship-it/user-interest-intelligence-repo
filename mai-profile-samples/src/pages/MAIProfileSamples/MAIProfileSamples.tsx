import { useState, useMemo } from 'react';
import { Container, Card, Form, Button, Row, Col, Spinner, Tab, Tabs } from 'react-bootstrap';
import MAIProfileView from './MAIProfileView';
import RawSignalsView from './RawSignalsView';

// Use import.meta.glob to discover all JSON files in the Data directory
const dataFiles = import.meta.glob('./Data/*.json', { eager: true });

// Parse filenames to extract unique UserIds
// Filename format: MaiProfile_{UserId}_v{Date}_{Days}days.json
function parseDataFiles(files: Record<string, unknown>): { userId: string; version: string; days: string; path: string }[] {
    const entries: { userId: string; version: string; days: string; path: string }[] = [];
    for (const path of Object.keys(files)) {
        const filename = path.split('/').pop()?.replace('.json', '') || '';
        const match = filename.match(/^MaiProfile_(.+?)_v(\d+)_(\d+)days$/);
        if (match) {
            entries.push({ userId: match[1], version: match[2], days: match[3], path });
        }
    }
    return entries;
}

function MAIProfileSamples() {
    const fileEntries = useMemo(() => parseDataFiles(dataFiles), []);
    const availableUserIds = useMemo(() => [...new Set(fileEntries.map(e => e.userId))], [fileEntries]);

    const [userId, setUserId] = useState<string>(availableUserIds[0] || '');
    const [isLoading, setIsLoading] = useState(false);
    const [sampleData, setSampleData] = useState<any>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [activeTab, setActiveTab] = useState<string>('maiProfile');

    // Get available versions for the selected userId
    const availableVersions = useMemo(
        () => fileEntries.filter(e => e.userId === userId).map(e => e.version).sort((a, b) => Number(a) - Number(b)),
        [fileEntries, userId]
    );
    const [selectedVersion, setSelectedVersion] = useState<string>(availableVersions[availableVersions.length - 1] || '');

    const handleSubmit = () => {
        if (!userId) {
            setErrorMessage('Please select a User ID.');
            return;
        }
        setErrorMessage('');
        setIsLoading(true);
        setSampleData(null);

        try {
            // Find the matching file entry and load its data directly
            const entry = fileEntries.find(e => e.userId === userId && e.version === (selectedVersion || availableVersions[availableVersions.length - 1]));
            if (!entry) {
                throw new Error('No matching sample file found.');
            }
            const data = (dataFiles[entry.path] as any)?.default || dataFiles[entry.path];
            setSampleData(data);
        } catch (err: any) {
            setErrorMessage(err.message || 'An error occurred while loading sample data.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container className="mt-4">
            <h2 className="mb-4">MAI Profile Samples</h2>

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
                                        // Reset version to latest for the new user
                                        const versions = fileEntries.filter(en => en.userId === e.target.value).map(en => en.version);
                                        setSelectedVersion(versions[versions.length - 1] || '');
                                    }}
                                >
                                    {availableUserIds.length === 0 && <option value="">No samples available</option>}
                                    {availableUserIds.map(id => (
                                        <option key={id} value={id}>{id}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Date / Days</Form.Label>
                                <Form.Select
                                    value={selectedVersion}
                                    onChange={(e) => { setSelectedVersion(e.target.value); setSampleData(null); }}
                                >
                                    {availableVersions.map(v => {
                                        const entry = fileEntries.find(e => e.userId === userId && e.version === v);
                                        // Format: date / days (e.g., 2026-01-14 / 14 days)
                                        const dateLabel = v.length === 8
                                            ? `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`
                                            : `v${v}`;
                                        const label = entry?.days ? `${dateLabel} / ${entry.days} days` : dateLabel;
                                        return <option key={v} value={v}>{label}</option>;
                                    })}
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
                <Tabs
                    activeKey={activeTab}
                    onSelect={(k) => setActiveTab(k || 'maiProfile')}
                    className="mb-3"
                >
                    <Tab eventKey="maiProfile" title="MAI Profile">
                        <MAIProfileView data={sampleData} userId={userId} />
                    </Tab>
                    <Tab eventKey="rawSignal" title="Raw Signals">
                        <RawSignalsView userId={userId} version={selectedVersion} days={fileEntries.find(e => e.userId === userId && e.version === selectedVersion)?.days || ''} />
                    </Tab>
                    <Tab eventKey="evaluation" title="Evaluation">
                        <Card>
                            <Card.Body className="text-center py-5">
                                <h4 className="text-muted mb-3">🚧 Work in Progress</h4>
                                <p className="text-muted">The evaluation framework is currently under active development. Stay tuned for updates.</p>
                            </Card.Body>
                        </Card>
                    </Tab>
                </Tabs>
            )}
        </Container>
    );
}

export default MAIProfileSamples;
