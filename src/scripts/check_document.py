from docx import Document
import sys

def check_document(doc_path):
    doc = Document(doc_path)
    print(f"\nChecking document: {doc_path}\n")
    
    print("Document structure:")
    for i, para in enumerate(doc.paragraphs, 1):
        # Skip empty paragraphs
        if not para.text.strip():
            continue
            
        # Get style info
        style = para.style.name if para.style else "Normal"
        is_bold = any(run.bold for run in para.runs)
        is_underline = any(run.underline for run in para.runs)
        
        print(f"{i:3d}. {'[BOLD]' if is_bold else '      '} {'[UNDERLINE]' if is_underline else '          '} {style:12} | {para.text[:100]}")

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python check_document.py <docx_file>")
        sys.exit(1)
        
    check_document(sys.argv[1]) 