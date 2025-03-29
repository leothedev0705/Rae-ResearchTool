const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fetch = require("node-fetch");
require("dotenv").config();
const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = 5000;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function to delay execution (for rate limiting)
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

app.use(cors());
app.use(bodyParser.json());

// Helper function to extract DOI from various URL formats
function extractDOI(url) {
    if (!url) return null;
    
    // Try to match DOI patterns
    const doiPatterns = [
        /doi\.org\/([^\/\s]+\/[^\/\s]+)$/,
        /doi:\s*([^\/\s]+\/[^\/\s]+)/,
        /([^\/\s]+\/[^\/\s]+)$/
    ];

    for (const pattern of doiPatterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

// Endpoint for paper summarization
app.post("/api/summarize", async (req, res) => {
    const { title, authors, year, link } = req.body;
    
    try {
        let abstract = null;
        let source = null;
        let paperDetails = null;

        // Try to get paper details from Semantic Scholar
        try {
            // First, search for the paper
            const searchResponse = await axios.get(
                `https://api.semanticscholar.org/graph/v1/paper/search`, {
                params: {
                    query: title,
                    fields: 'paperId,title,abstract,year,authors,citationCount',
                    limit: 5
                }
            });

            // Find the best matching paper from the results
            const papers = searchResponse.data?.data || [];
            const matchingPaper = papers.find(p => {
                const titleMatch = p.title.toLowerCase() === title.toLowerCase();
                const yearMatch = p.year === parseInt(year);
                return titleMatch && yearMatch;
            }) || papers[0]; // Use the first result if no exact match

            if (matchingPaper?.paperId) {
                // Get detailed paper information using the paperId
                const paperResponse = await axios.get(
                    `https://api.semanticscholar.org/graph/v1/paper/${matchingPaper.paperId}`, {
                    params: {
                        fields: 'title,abstract,year,authors,citationCount,venue,publicationVenue,openAccessPdf'
                    }
                });

                if (paperResponse.data) {
                    paperDetails = paperResponse.data;
                    if (paperDetails.abstract) {
                        abstract = paperDetails.abstract;
                        source = "Semantic Scholar";
                    }
                }
            }
        } catch (error) {
            console.log("Semantic Scholar fetch failed:", error.message);
        }

        // If we found an abstract, format it nicely with additional details
        if (abstract) {
            const formattedResponse = `📑 RESEARCH PAPER DETAILS

Title: ${paperDetails.title}
Year: ${paperDetails.year}
Authors: ${paperDetails.authors?.map(a => a.name).join(", ")}
${paperDetails.venue ? `Venue: ${paperDetails.venue}\n` : ''}
${paperDetails.citationCount ? `Citations: ${paperDetails.citationCount}\n` : ''}

📌 ABSTRACT

${abstract}

${paperDetails.openAccessPdf ? `\n🔓 Open Access PDF available at: ${paperDetails.openAccessPdf.url}` : ''}

---
Source: Semantic Scholar
Retrieved: ${new Date().toLocaleDateString()}`;

            res.json({ summary: formattedResponse });
            return;
        }

        // If no abstract found, use Gemini for analysis
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `Analyze this research paper:
Title: "${title}"
Year: ${year}
Authors: ${authors}

Please provide a structured analysis in the following format:

📌 RESEARCH OVERVIEW
• Field of Study:
• Main Research Question:
• Key Objectives:

🔍 POTENTIAL METHODOLOGY
• Likely Research Methods:
• Possible Data Sources:
• Expected Approach:

💡 EXPECTED CONTRIBUTIONS
• Potential Findings:
• Likely Impact:
• Applications:

Note: This is an AI analysis based on the paper's metadata as the full text was not accessible.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const aiAnalysis = response.text();

        res.json({ 
            summary: `⚠️ ABSTRACT NOT AVAILABLE

We could not retrieve the official abstract for this paper. Below is an AI-generated analysis based on the available metadata:

${aiAnalysis}

---
Paper Details:
• Title: ${title}
• Authors: ${authors}
• Year: ${year}
• Note: This is an AI-generated analysis, not the official abstract.
• Last Updated: ${new Date().toLocaleDateString()}`
        });

    } catch (error) {
        console.error("Error in summarization endpoint:", error);
        res.status(500).json({ 
            error: "Failed to retrieve or generate summary. Please try again later.",
            details: error.message 
        });
    }
});

// ✅ Fetch Google Scholar Papers
const fetchGoogleScholarPapers = async (field) => {
  try {
    const response = await axios.get(`http://127.0.0.1:5001/api/scholar?field=${encodeURIComponent(field)}`);
    return (response.data.papers || []).filter(paper => paper.year && parseInt(paper.year, 10) >= 2022);
  } catch (error) {
    console.error("Error fetching papers from Google Scholar:", error);
    return [];
  }
};

// ✅ Fetch Top Papers from Semantic Scholar with rate limiting
const fetchSemanticScholarPapers = async (field) => {
  const API_URL = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(field)}&limit=50&fields=title,year,url,authors,citationCount`;

  try {
    const response = await fetch(API_URL);
    if (response.status === 429) {
      // If rate limited, wait 2 seconds and try again
      await delay(2000);
      return fetchSemanticScholarPapers(field);
    }
    
    if (!response.ok) throw new Error(`Semantic Scholar API error: ${response.status}`);

    const data = await response.json();
    if (!data || !data.data) throw new Error("Invalid response from Semantic Scholar");

    return data.data
      .filter(paper => paper.year && paper.year >= 2022)
      .sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0))
      .map(paper => ({
        title: paper.title || "No title",
        link: paper.url || "No link",
        year: paper.year || "Unknown",
        citations: paper.citationCount || 0,
        authors: paper.authors?.map(a => a.name).join(", ") || "Unknown"
      }));
  } catch (error) {
    console.error("Error fetching papers from Semantic Scholar:", error);
    return [];
  }
};

// ✅ Fetch Top Papers from CrossRef
const fetchCrossRefPapers = async (field) => {
  const API_URL = `https://api.crossref.org/works?query=${encodeURIComponent(field)}&rows=50&sort=score`;

  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`CrossRef API error: ${response.status}`);

    const data = await response.json();
    if (!data || !data.message || !data.message.items) throw new Error("Invalid response from CrossRef");

    return data.message.items
      .filter(paper => {
        const year = paper["published-print"]?.["date-parts"]?.[0][0] || paper["published-online"]?.["date-parts"]?.[0][0];
        return year && year >= 2022; // ✅ Ensure 2022+
      })
      .map(paper => ({
        title: paper.title?.[0] || "No title",
        link: paper.DOI ? `https://doi.org/${paper.DOI}` : "No link",
        year: paper["published-print"]?.["date-parts"]?.[0][0] || paper["published-online"]?.["date-parts"]?.[0][0] || "Unknown",
        authors: paper.author?.map(a => `${a.given} ${a.family}`).join(", ") || "Unknown"
      }));
  } catch (error) {
    console.error("Error fetching papers from CrossRef:", error);
    return [];
  }
};

// ✅ Fetch Top Papers from PubMed
const fetchPubMedPapers = async (field) => {
  const searchURL = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(field)}&retmode=json&retmax=50&sort=pub+date`;

  try {
    const searchResponse = await fetch(searchURL);
    const searchData = await searchResponse.json();

    if (!searchData.esearchresult || !searchData.esearchresult.idlist.length) return [];

    const pmidList = searchData.esearchresult.idlist.join(",");
    const summaryURL = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmidList}&retmode=json`;

    const summaryResponse = await fetch(summaryURL);
    const summaryData = await summaryResponse.json();

    return Object.values(summaryData.result)
      .filter(paper => {
        const year = paper.pubdate?.split(" ")[0];
        return year && parseInt(year, 10) >= 2022; // ✅ Ensure 2022+
      })
      .map(paper => ({
        title: paper.title || "No title",
        link: `https://pubmed.ncbi.nlm.nih.gov/${paper.uid}/`,
        year: paper.pubdate?.split(" ")[0] || "Unknown",
        authors: paper.authors?.map(a => a.name).join(", ") || "Unknown"
      }));
  } catch (error) {
    console.error("Error fetching papers from PubMed:", error);
    return [];
  }
};

// ✅ API Route to Fetch Research Papers with Pagination
app.get("/api/research", async (req, res) => {
  const field = req.query.field;
  const year = req.query.year;
  const author = req.query.author;
  const journal = req.query.journal;
  const page = parseInt(req.query.page) || 1;  // Default to page 1
  const limit = parseInt(req.query.limit) || 5;  // Default to 5 results per page

  if (!field) return res.status(400).json({ error: "Research field is required." });

  try {
    // Fetch fresh data from APIs
    const [semanticPapers, crossRefPapers, pubMedPapers, googleScholarPapers] = await Promise.all([
      fetchSemanticScholarPapers(field),
      fetchCrossRefPapers(field),
      fetchPubMedPapers(field),
      fetchGoogleScholarPapers(field)
    ]);

    let allPapers = [...semanticPapers, ...crossRefPapers, ...pubMedPapers, ...googleScholarPapers]
      .filter((paper, index, self) => index === self.findIndex((p) => p.title === paper.title));

    // ✅ Apply Filters
    if (year) allPapers = allPapers.filter(paper => paper.year && paper.year == year);
    if (author) allPapers = allPapers.filter(paper => paper.authors && paper.authors.toLowerCase().includes(author.toLowerCase()));
    if (journal) allPapers = allPapers.filter(paper => paper.journal && paper.journal.toLowerCase().includes(journal.toLowerCase()));

    // ✅ Sort Papers by Citations
    allPapers.sort((a, b) => (b.citations || 0) - (a.citations || 0));

    // ✅ Apply Pagination
    const totalResults = allPapers.length;
    const totalPages = Math.ceil(totalResults / limit);
    const startIndex = (page - 1) * limit;
    const paginatedPapers = allPapers.slice(startIndex, startIndex + limit);

    res.json({
      totalResults,
      totalPages,
      currentPage: page,
      perPage: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      papers: paginatedPapers
    });

  } catch (error) {
    console.error("Error fetching research papers:", error);
    res.status(500).json({ error: "Error fetching research papers." });
  }
});

// ✅ Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
