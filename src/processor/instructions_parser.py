from docx import Document
from typing import List, TypedDict
from pathlib import Path

class Instruction(TypedDict):
    contract: str
    instruction: str
    clause: str

def get_full_formatting(paragraph) -> str:
    """Extract all possible formatting and metadata from a paragraph."""
    text = []
    
    # Paragraph level formatting
    props = []
    if paragraph.style:
        props.append(f"style={paragraph.style.name}")
    if paragraph.paragraph_format.alignment:
        props.append(f"align={paragraph.paragraph_format.alignment}")
    if paragraph.paragraph_format.line_spacing:
        props.append(f"line_spacing={paragraph.paragraph_format.line_spacing}")
    if paragraph.paragraph_format.space_before:
        props.append(f"space_before={paragraph.paragraph_format.space_before}")
    if paragraph.paragraph_format.space_after:
        props.append(f"space_after={paragraph.paragraph_format.space_after}")
    if paragraph.paragraph_format.first_line_indent:
        props.append(f"indent={paragraph.paragraph_format.first_line_indent}")
    
    if props:
        text.append(f"[p:{','.join(props)}]")
    
    # Run level formatting
    for run in paragraph.runs:
        props = []
        if run.bold:
            props.append('bold')
        if run.italic:
            props.append('italic')
        if run.underline:
            props.append('underline')
        if run.font.name:
            props.append(f"font={run.font.name}")
        if run.font.size:
            props.append(f"size={run.font.size}")
        if run.font.color.rgb:
            props.append(f"color={run.font.color.rgb}")
        if run.style:
            props.append(f"style={run.style.name}")
        
        if props:
            text.append(f"[{','.join(props)}]{run.text}")
        else:
            text.append(run.text)
    
    return ''.join(text)

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
                'contract': formatted_text.split('Contract 1', 1)[0] + 'Contract 1',
                'instruction': instruction,
                'clause': ''
            }
            state = LOOKING_FOR_CLAUSE
        elif plain_text.startswith('Contract '):
            if current:
                instructions.append(current)
            current = {
                'contract': formatted_text,
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
    instructions = parse_instructions('Instructions and Snippets of Text.docx')
    for inst in instructions:
        print(f"\n{inst['contract']}")
        print(f"Instruction: {inst['instruction']}")
        print(f"Clause: {inst['clause']}")
        print("-" * 80)

if __name__ == '__main__':
    main() 