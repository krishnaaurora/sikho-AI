import sys
import os
from docling.document_converter import DocumentConverter

def main():
    if len(sys.argv) < 2:
        print("Usage: python extract_docling.py <file_path>", file=sys.stderr)
        sys.exit(1)
    
    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}", file=sys.stderr)
        sys.exit(1)
        
    try:
        converter = DocumentConverter()
        result = converter.convert(file_path)
        markdown_text = result.document.export_to_markdown()
        print(markdown_text)
    except Exception as e:
        print(f"Docling conversion failed: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
