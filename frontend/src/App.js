import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import axios from "axios";
import { Container, TextField, Button, Typography, Paper, List, CircularProgress, Card, CardContent, Grid, MenuItem, Select, InputLabel, FormControl, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from "@mui/material";
import { Search, Refresh, NavigateNext, NavigateBefore, Close as CloseIcon } from "@mui/icons-material";
import { motion } from "framer-motion";
import PaperSummary from './PaperSummary';

function MainContent() {
    const navigate = useNavigate();
    const [researchPapers, setResearchPapers] = useState([]);
    const [researchField, setResearchField] = useState("");
    const [loadingPapers, setLoadingPapers] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedYear, setSelectedYear] = useState("");
    const [openSummary, setOpenSummary] = useState(false);
    const [currentSummary, setCurrentSummary] = useState("");
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [selectedPaper, setSelectedPaper] = useState(null);

    // ✅ Load Google Font Dynamically
    useEffect(() => {
        const link = document.createElement("link");
        link.href = "https://fonts.googleapis.com/css2?family=Rajdhani:wght@700&display=swap";
        link.rel = "stylesheet";
        document.head.appendChild(link);
    }, []);

    const fetchPapers = useCallback(async () => {
        if (!researchField) return;
        setLoadingPapers(true);
        try {
            let url = `http://localhost:5000/api/research?field=${researchField}&page=${page}&limit=5`;
            if (selectedYear) {
                url += `&year=${selectedYear}`;
            }

            const response = await axios.get(url);
            setResearchPapers(response.data.papers);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error("Error fetching research papers:", error);
        }
        setLoadingPapers(false);
    }, [researchField, page, selectedYear]);

    useEffect(() => {
        if (researchField) {
            fetchPapers();
        }
    }, [fetchPapers]);

    const handleNextPage = () => {
        if (page < totalPages) {
            setPage(prevPage => prevPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (page > 1) {
            setPage(prevPage => prevPage - 1);
        }
    };

    // Function to fetch paper summary
    const fetchPaperSummary = async (paper) => {
        setLoadingSummary(true);
        setSelectedPaper(paper);
        setOpenSummary(true);
        
        try {
            const response = await axios.post('http://localhost:5000/api/summarize', {
                title: paper.title,
                authors: paper.authors,
                year: paper.year,
                link: paper.link
            });
            setCurrentSummary(response.data.summary);
        } catch (error) {
            console.error("Error fetching summary:", error);
            setCurrentSummary("Failed to generate summary. Please try again later.");
        } finally {
            setLoadingSummary(false);
        }
    };

    // Function to handle closing the summary dialog
    const handleCloseSummary = () => {
        setOpenSummary(false);
        setCurrentSummary("");
        setSelectedPaper(null);
    };

    return (
        <Container 
            maxWidth="lg" 
            sx={{ 
                minHeight: "100vh", 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center", 
                textAlign: "center", 
                padding: "20px"
            }}
        >
            {/* Welcome Header */}
            <Typography 
                variant="h2" 
                gutterBottom 
                sx={{ 
                    fontWeight: 700, 
                    color: "#1f1c2c", 
                    fontFamily: "'Rajdhani', sans-serif", 
                    textTransform: "uppercase",
                    letterSpacing: "2px"
                }}
            >
                Welcome to RAE! 🤖
            </Typography>

            {/* Search & Controls */}
            <Paper 
                elevation={4} 
                sx={{ 
                    padding: "20px", 
                    borderRadius: "12px", 
                    textAlign: "center",
                    width: "100%", 
                    maxWidth: "700px",
                }}
            >
                <TextField 
                    label="Enter research field" 
                    fullWidth 
                    variant="outlined"
                    value={researchField} 
                    onChange={(e) => setResearchField(e.target.value)} 
                    sx={{ marginBottom: "10px" }}
                />

                {/* ✅ Year Filter Dropdown */}
                <FormControl fullWidth sx={{ marginBottom: "10px" }}>
                    <InputLabel>Select Year</InputLabel>
                    <Select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                    >
                        <MenuItem value="">All Years</MenuItem>
                        <MenuItem value="2025">2025</MenuItem>
                        <MenuItem value="2024">2024</MenuItem>
                        <MenuItem value="2023">2023</MenuItem>
                        <MenuItem value="2022">2022</MenuItem>
                    </Select>
                </FormControl>

                <Grid container spacing={2} justifyContent="center">
                    <Grid item xs={12} sm={5}>
                        <Button 
                            variant="contained" 
                            color="primary" 
                            startIcon={<Search />} 
                            fullWidth
                            onClick={() => {
                                setPage(1); // Reset to first page when searching new topic
                                fetchPapers();
                            }}
                        >
                            Search
                        </Button>
                    </Grid>
                    <Grid item xs={12} sm={5}>
                        <Button 
                            variant="outlined" 
                            color="secondary" 
                            startIcon={<Refresh />} 
                            fullWidth
                            onClick={() => {
                                setResearchPapers([]);
                                setResearchField("");
                                setSelectedYear("");
                                setPage(1);
                            }}
                        >
                            Clear
                        </Button>
                    </Grid>
                </Grid>

                {/* Pagination Controls */}
                <Grid container spacing={2} justifyContent="center" alignItems="center" sx={{ marginTop: "15px" }}>
                    <Grid item xs={6} sm={4}>
                        <Button 
                            variant="outlined" 
                            color="primary" 
                            startIcon={<NavigateBefore />} 
                            fullWidth
                            onClick={handlePreviousPage}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                        <Typography variant="subtitle1">
                            Page {page} of {totalPages}
                        </Typography>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                        <Button 
                            variant="outlined" 
                            color="primary" 
                            endIcon={<NavigateNext />} 
                            fullWidth
                            onClick={handleNextPage}
                            disabled={page >= totalPages}
                        >
                            Next
                        </Button>
                    </Grid>
                </Grid>

                {loadingPapers && <CircularProgress sx={{ marginTop: "15px" }} />}
            </Paper>

            {/* ✅ Clickable Card Instruction */}
            <Typography variant="subtitle1" sx={{ color: "#777", marginTop: "20px" }}>
                📌 Click on a card to redirect to the research paper.
            </Typography>

            {/* Display Research Papers */}
            <List sx={{ marginTop: "10px", width: "100%", maxWidth: "900px" }}>
                <Grid container spacing={3} justifyContent="center">
                    {researchPapers.length > 0 ? (
                        researchPapers.map((paper, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Card 
                                        sx={{ 
                                            borderRadius: "15px", 
                                            padding: "15px", 
                                            background: "#ffffff", 
                                            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)", 
                                            textAlign: "left",
                                            height: "350px",
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "space-between",
                                            cursor: "pointer",
                                            overflow: "hidden"
                                        }}
                                    >
                                        <CardContent sx={{ 
                                            flexGrow: 1, 
                                            overflowY: "auto", 
                                            maxHeight: "200px", 
                                            scrollbarWidth: "none",
                                            "&::-webkit-scrollbar": { display: "none" }
                                        }}>
                                            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                                                {paper.title}
                                            </Typography>
                                            <Typography variant="subtitle2" sx={{ color: "#555" }}>
                                                <strong>By:</strong> {paper.authors}
                                            </Typography>
                                            <Typography variant="subtitle2" sx={{ color: "#777" }}>
                                                <strong>Published:</strong> {paper.year}
                                            </Typography>
                                        </CardContent>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <Button 
                                                variant="contained" 
                                                color="primary" 
                                                href={paper.link} 
                                                target="_blank"
                                                fullWidth
                                            >
                                                Read More
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                color="secondary"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    navigate('/summary', { state: { paper } });
                                                }}
                                                fullWidth
                                            >
                                                View Summarization
                                            </Button>
                                        </div>
                                    </Card>
                                </motion.div>
                            </Grid>
                        ))
                    ) : null}
                </Grid>
            </List>

            {/* Summary Dialog */}
            <Dialog
                open={openSummary}
                onClose={handleCloseSummary}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    style: {
                        borderRadius: '15px',
                        padding: '10px',
                        background: 'linear-gradient(to bottom, #ffffff, #f8f9fa)'
                    }
                }}
            >
                <DialogTitle>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        borderBottom: '2px solid #f0f0f0',
                        paddingBottom: '10px'
                    }}>
                        <Typography variant="h5" style={{ fontWeight: 600, color: '#2c3e50' }}>
                            Research Paper Analysis
                        </Typography>
                        <Button 
                            onClick={handleCloseSummary}
                            style={{ 
                                minWidth: '40px', 
                                height: '40px', 
                                borderRadius: '20px',
                                color: '#666'
                            }}
                        >
                            ✕
                        </Button>
                    </div>
                </DialogTitle>
                <DialogContent>
                    {loadingSummary ? (
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
                                Generating comprehensive analysis...
                            </Typography>
                        </div>
                    ) : (
                        <div style={{ 
                            padding: '20px',
                            fontSize: '16px',
                            lineHeight: '1.6',
                            color: '#2c3e50'
                        }}>
                            <Typography 
                                variant="body1" 
                                component="div"
                                style={{ 
                                    whiteSpace: 'pre-line',
                                    '& h3': {
                                        color: '#1a73e8',
                                        marginTop: '20px',
                                        marginBottom: '10px',
                                        fontSize: '1.2rem',
                                        fontWeight: 600
                                    },
                                    '& ul': {
                                        paddingLeft: '20px',
                                        marginTop: '10px',
                                        marginBottom: '15px'
                                    },
                                    '& li': {
                                        marginBottom: '8px'
                                    }
                                }}
                                dangerouslySetInnerHTML={{
                                    __html: currentSummary
                                        .replace(/📌 /g, '<h3 style="color: #1a73e8; margin-top: 25px; margin-bottom: 15px; font-size: 1.2rem; font-weight: 600;">📌 ')
                                        .replace(/🔍 /g, '<h3 style="color: #1a73e8; margin-top: 25px; margin-bottom: 15px; font-size: 1.2rem; font-weight: 600;">🔍 ')
                                        .replace(/🎯 /g, '<h3 style="color: #1a73e8; margin-top: 25px; margin-bottom: 15px; font-size: 1.2rem; font-weight: 600;">🎯 ')
                                        .replace(/💡 /g, '<h3 style="color: #1a73e8; margin-top: 25px; margin-bottom: 15px; font-size: 1.2rem; font-weight: 600;">💡 ')
                                        .replace(/🌟 /g, '<h3 style="color: #1a73e8; margin-top: 25px; margin-bottom: 15px; font-size: 1.2rem; font-weight: 600;">🌟 ')
                                        .replace(/• /g, '<br>• ')
                                        .replace(/\n/g, '<br>')
                                }}
                            />
                        </div>
                    )}
                </DialogContent>
                <DialogActions style={{ padding: '16px', borderTop: '1px solid #f0f0f0' }}>
                    <Button 
                        onClick={handleCloseSummary} 
                        variant="contained" 
                        color="primary"
                        style={{
                            borderRadius: '20px',
                            padding: '8px 24px'
                        }}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<MainContent />} />
                <Route path="/summary" element={<PaperSummary />} />
            </Routes>
        </Router>
    );
}

export default App;
