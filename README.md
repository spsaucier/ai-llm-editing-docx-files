# Edit .docx files natively via an LLM & Python

Intelligent document processing system that can insert legal clauses into Word documents while maintaining formatting and structure.

## Features

- Process instruction documents containing multiple contract modifications
- Parse and execute complex document commands
- Maintain document formatting and styles
- Generate detailed processing reports
- Handle multiple types of modifications:
  - Insert text after headings
  - Add content between sentences
  - Create new sections
  - Replace existing text

## Setup

1. Install dependencies:

```bash
# Install Bun dependencies
bun install

# Set up Python virtual environment
python -m venv .venv
source .venv/bin/activate  # or `.venv\Scripts\activate` on Windows
pip install python-docx openai
```

2. Set up environment variables:

```bash
export OPENAI_API_KEY=your_key_here
```

## Usage

### Process Documents

Place your documents in the following structure:

```
test-documents/
  ├── Instructions and Snippets of Text.docx  # Instructions file
  ├── Contract 1.docx                         # Source contracts
  ├── Contract 2.docx
  └── Contract 3.docx
```

Run the processing script:

```bash
bun run src/scripts/process_documents.ts
```

Processed documents will be saved in `test-documents-updated/` along with a `processing_report.json` containing details of all changes made.

### Development

Run tests:

```bash
bun test
```

Check document structure:

```bash
.venv/bin/python3 src/scripts/check_document.py test-documents/Contract\ 1.docx
```

## Architecture

- **API Layer**: Bun HTTP server for file handling and process management
- **LLM Layer**: OpenAI integration for instruction parsing and command generation
- **Document Processing**: Python-based document manipulation with style preservation
- **Command System**: Structured command generation and validation

## License

[License Type] - See LICENSE file for details
