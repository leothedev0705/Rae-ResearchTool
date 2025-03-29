import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, Button, CircularProgress, Divider } from '@mui/material';
import axios from 'axios';
import { ArrowBack } from '@mui/icons-material';

function PaperSummary() {
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const paper = location.state?.paper;

    useEffect(() => {
        if (!paper) {
            navigate('/');
            return;
        }

        const fetchSummary = async () => {
            try {
                const response = await axios.post('http://localhost:5000/api/summarize', {
                    title: paper.title,
                    authors: paper.authors,
                    year: paper.year,
                    link: paper.link
                });
                setSummary(response.data.summary);
            } catch (error) {
                console.error("Error fetching summary:", error);
                setSummary("Failed to generate summary. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, [paper, navigate]);

    if (!paper) return null;

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Button
                startIcon={<ArrowBack />}
                onClick={() => navigate('/')}
                variant="outlined"
                sx={{ mb: 3 }}
            >
                Back to Search
            </Button>

            <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                {/* Paper Title */}
                <Typography 
                    variant="h4" 
                    component="h1" 
                    gutterBottom 
                    sx={{ 
                        color: '#1a73e8',
                        fontWeight: 600,
                        mb: 3
                    }}
                >
                    {paper.title}
                </Typography>

                {/* Paper Metadata */}
                <Paper 
                    elevation={1} 
                    sx={{ 
                        p: 2, 
                        mb: 4, 
                        backgroundColor: '#f8f9fa',
                        borderRadius: 1
                    }}
                >
                    <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50' }}>
                        Publication Details
                    </Typography>
                    <Typography variant="body1" paragraph>
                        <strong>Authors:</strong> {paper.authors}
                    </Typography>
                    <Typography variant="body1" paragraph>
                        <strong>Year:</strong> {paper.year}
                    </Typography>
                    {paper.citations && (
                        <Typography variant="body1" paragraph>
                            <strong>Citations:</strong> {paper.citations}
                        </Typography>
                    )}
                    <Button 
                        variant="contained" 
                        color="primary" 
                        href={paper.link} 
                        target="_blank"
                        sx={{ mt: 1 }}
                    >
                        View Original Paper
                    </Button>
                </Paper>

                <Divider sx={{ my: 3 }} />

                {/* Abstract/Summary Section */}
                <Typography 
                    variant="h5" 
                    gutterBottom 
                    sx={{ 
                        color: '#2c3e50',
                        fontWeight: 600
                    }}
                >
                    Paper Abstract
                </Typography>

                {loading ? (
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        padding: '40px',
                        flexDirection: 'column',
                        gap: '20px'
                    }}>
                        <CircularProgress size={50} />
                        <Typography variant="body1" color="textSecondary">
                            Retrieving paper abstract...
                        </Typography>
                    </div>
                ) : (
                    <div style={{ 
                        padding: '20px',
                        fontSize: '16px',
                        lineHeight: '1.8',
                        color: '#2c3e50',
                        backgroundColor: '#fff',
                        borderRadius: '8px',
                        border: '1px solid #e0e0e0'
                    }}>
                        <Typography 
                            variant="body1" 
                            component="div"
                            sx={{
                                '& h3': {
                                    color: '#1a73e8',
                                    mt: 3,
                                    mb: 2,
                                    fontSize: '1.2rem',
                                    fontWeight: 600
                                }
                            }}
                            dangerouslySetInnerHTML={{
                                __html: summary
                                    .replace(/📑 OFFICIAL ABSTRACT/g, '<h3>Official Abstract</h3>')
                                    .replace(/⚠️ ABSTRACT NOT AVAILABLE/g, '<h3>AI-Generated Analysis</h3>')
                                    .replace(/\n/g, '<br>')
                            }}
                        />
                    </div>
                )}
            </Paper>
        </Container>
    );
}

export default PaperSummary; 