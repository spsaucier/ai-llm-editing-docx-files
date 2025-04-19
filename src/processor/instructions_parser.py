from docx import Document
from typing import List, TypedDict
from pathlib import Path
import sys
import json
import re

class Instruction(TypedDict):
    contract: str
    instruction: str
    clause: str

def get_full_formatting(paragraph):
    """Get text with formatting."""
    formatted_text = ''
    for run in paragraph.runs:
        if run.text.strip():
            formatted_text += run.text
    return formatted_text

def clean_contract_name(text: str) -> str:
    """Extract clean contract filename."""
    # Extract contract number
    match = re.search(r'Contract (\d+)', text)
    if match:
        return f'Contract {match.group(1)}.docx'
    return text

def parse_instructions(doc_path: str | Path) -> List[Instruction]:
    """Parse the instructions document into structured data."""
    doc = Document(doc_path)
    instructions: List[Instruction] = []
    current: Instruction | None = None
    
    # States for parsing
    LOOKING_FOR_CONTRACT = 0
    LOOKING_FOR_INSTRUCTION = 1
    LOOKING_FOR_CLAUSE = 2
    
    state = LOOKING_FOR_CONTRACT
    
    for para in doc.paragraphs:
        formatted_text = get_full_formatting(para)
        plain_text = ''.join(run.text for run in para.runs).strip()
        if not plain_text:
            continue

        # Special handling for Contract 1 which has instruction in same paragraph as title
        if plain_text.startswith('Contract 1'):
            if current:
                instructions.append(current)
            # Split the text after "Contract 1"
            parts = plain_text.split('Contract 1', 1)
            instruction = parts[1].strip() if len(parts) > 1 else ''
            current = {
                'contract': clean_contract_name(formatted_text),
                'instruction': instruction,
                'clause': ''
            }
            state = LOOKING_FOR_CLAUSE
        elif plain_text.startswith('Contract '):
            if current:
                instructions.append(current)
            current = {
                'contract': clean_contract_name(formatted_text),
                'instruction': '',
                'clause': ''
            }
            state = LOOKING_FOR_INSTRUCTION
        elif current:
            if state == LOOKING_FOR_INSTRUCTION:
                current['instruction'] = formatted_text
                state = LOOKING_FOR_CLAUSE
            elif state == LOOKING_FOR_CLAUSE:
                current['clause'] = formatted_text
                state = LOOKING_FOR_CONTRACT

    # Don't forget the last one
    if current:
        instructions.append(current)

    return instructions

def main():
    """CLI interface for testing the parser."""
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Missing document path argument"}))
        sys.exit(1)

    try:
        instructions = parse_instructions(sys.argv[1])
        print(json.dumps(instructions))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == '__main__':
    main() 