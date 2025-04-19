# YellowPad - Smart Legal Document Processor

A system that intelligently inserts legal clauses into Word documents while maintaining formatting and structure.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/yellowpadai.git
cd yellowpadai

# Install dependencies
bun install
python3 -m venv .venv
source .venv/bin/activate
pip install python-docx

# Start the server
bun run src/api/index.ts
```

## 🔧 API Endpoints

### Health Check

```http
GET /health
```

Returns `OK` if the service is running.

### Process Document

```http
POST /documents
Content-Type: multipart/form-data

document: File (docx)
clause: string
targetSection: string
formatting: JSON string (optional)
```

Example formatting:

```json
{
  "bold": true,
  "underline": false
}
```

Returns:

```json
{
  "id": "uuid",
  "status": "processing"
}
```

### Check Processing Status

```http
GET /documents/:id
```

Returns:

```json
{
  "id": "uuid",
  "status": "processing|completed|failed",
  "result": {
    "document": "base64-encoded-docx", // if completed
    "error": "error message" // if failed
  }
}
```

### Metrics

```http
GET /metrics
```

Returns system metrics including request counts, processing times, and error rates.

## 📊 Metrics & Logging

- Request metrics are available at `/metrics`
- Logs use Pino with pretty printing
- Set log level via `LOG_LEVEL` environment variable (default: "info")

## 🧪 Testing

```bash
# Run all tests
bun test

# Run specific test file
bun test src/api/api.test.ts
```

## 🛠️ Development

### Project Structure

```
src/
├── api/          # HTTP server and endpoints
├── processor/    # Document processing logic
├── types/        # TypeScript type definitions
└── utils/        # Shared utilities
```

### Environment Variables

- `PORT`: Server port (default: 3000)
- `LOG_LEVEL`: Logging level (default: "info")

### Adding New Features

1. Add types to `src/types/`
2. Implement functionality in appropriate module
3. Add tests
4. Update documentation

## 📝 Example Usage

```typescript
// Upload and process a document
const formData = new FormData();
formData.append('document', docxFile);
formData.append('clause', 'New legal clause text');
formData.append('targetSection', '4.1');
formData.append(
  'formatting',
  JSON.stringify({
    bold: true,
    underline: false,
  })
);

const response = await fetch('http://localhost:3000/documents', {
  method: 'POST',
  body: formData,
});

const { id } = await response.json();

// Check status
const status = await fetch(`http://localhost:3000/documents/${id}`);
const result = await status.json();
```

---

# 🧪 YellowPad Coding Challenge: Smart Clause Insertion in MS Word

## 📌 Overview

This exercise simulates a core challenge from our MS Word Add-in: **intelligently inserting legal language into the correct place in a few Word documents, with the correct formatting**. Your goal is to:

- Identify where a clause should go in each contract
- Fore each contract, insert the clause with the correct font, size, spacing, and formatting
- Handle edge cases like headings, numbering, and placement before/after other sections

You may use **any tools, libraries, or AI assistance** — speed and practicality are key.

## 🕑 Time Limit

Spend **no more than 2 hours** on this. We value quick iteration and resourcefulness over polish.

## 🧩 The Challenge

### You are given:

- A few sample contracts in `.docx` format (provided in the repo)
- A few snippets of text (a new clause to insert)
- An few instructions like:

> _"Insert this clause as section 4.2, directly after the last paragraph in section 4.1. If a heading is needed, format it bold and underlined, and match the document's style."_

### Your task:

1. Parse the documents and find the correct insertion points based on the instruction
2. Insert the clauses with **correct placement and formatting**, matching each contract's existing style
3. Return the updated `.docx` files that shows the result

## 💻 Tech Notes

- Use **Python** with `python-docx` (or similar), or **JavaScript** with an open-source Word manipulation tool
- You **do not need to use LLMs**, but feel free to if it helps
- The clauses, instructions, and contracts are provided in this repo

## ✅ Submission Instructions

1. Fork this repo (or download the files)
2. Work locally
3. Record a short Loom video walking through:
   - Your approach
   - Challenges you encountered
   - Any AI tools you used
4. Email your Loom + code/repo link to: `ananda@yellowpad.ai`

## 💵 Compensation

We will compensate you at **$70/hour** for up to 2 hours of work
