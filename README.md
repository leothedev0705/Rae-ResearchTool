# RAE - Research Assistance Enhancer
RAE is a powerful research paper aggregation tool that helps researchers find and analyze academic papers from multiple sources including Semantic Scholar, CrossRef, PubMed, and Google Scholar.

## Features

- Multi-source paper aggregation
- Real-time paper summarization using Gemini AI
- Advanced filtering options (by year, author, journal)
- Pagination support
- Citation count tracking
- Abstract retrieval from multiple sources
- Clean and modern user interface

## Tech Stack

- Frontend:
  - React.js
  - Material-UI
  - Framer Motion
  - Axios

- Backend:
  - Node.js
  - Express
  - Google Generative AI (Gemini)
  - Multiple academic APIs integration

## Setup

1. Clone the repository:
```bash
git clone https://github.com/leothedev0705/Rae-ResearchTool.git
cd Rae-ResearchTool
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up environment variables:
Create a `.env` file in the backend directory with:
```
GEMINI_API_KEY=your_gemini_api_key
SCOPUS_API_KEY=your_scopus_api_key
```

4. Start the application:
```bash
# Start backend (from backend directory)
npm start

# Start frontend (from frontend directory)
npm start
```

## Usage

1. Enter a research field in the search bar
2. Use filters to refine results
3. Click "View Summarization" on any paper to see AI-generated analysis
4. Use pagination to navigate through results
5. Click "Read More" to access the original paper

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
