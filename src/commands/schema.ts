/**
 * Document manipulation command schema
 */

// Location types for finding positions in documents
export type LocationSpecifier =
  | HeadingLocation
  | SectionLocation
  | SentenceLocation
  | ParagraphLocation;

export interface HeadingLocation {
  type: 'heading';
  value: string;
  position: 'before' | 'after' | 'replace';
  matchLevel?: boolean; // Match the heading level if replacing
}

export interface SectionLocation {
  type: 'section';
  number: string | number; // Support both "11.2" and 11
  position: 'start' | 'end' | 'replace';
}

export interface SentenceLocation {
  type: 'sentence';
  section?: string | number;
  paragraph?: number;
  sentenceNumber?: number;
  matchText?: string; // Alternative to specifying numbers
  position: 'before' | 'after' | 'replace';
}

export interface ParagraphLocation {
  type: 'paragraph';
  section?: string | number;
  paragraphNumber?: number;
  matchText?: string; // Alternative to specifying numbers
  position: 'before' | 'after' | 'replace';
}

// Style requirements for inserted content
export interface StyleRequirements {
  matchSource?: boolean; // Use styles from the target document
  specific?: {
    font?: string;
    size?: number;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    color?: string;
    style?: string; // Named style from Word
    spacing?: {
      before?: number;
      after?: number;
      line?: number;
    };
    alignment?: 'left' | 'center' | 'right' | 'justify';
  };
}

// Content to be inserted or used for modification
export interface ContentSpecification {
  text: string;
  style: StyleRequirements;
}

// Main command interface
export interface DocumentCommand {
  documentId: string; // Path or identifier of the document
  action: 'insert' | 'modify' | 'delete';
  location: LocationSpecifier;
  content?: ContentSpecification; // Required for insert/modify, not for delete
  validation?: {
    preConditions?: {
      mustExist?: string[]; // Text/elements that must exist
      mustNotExist?: string[]; // Text/elements that must not exist
    };
    postConditions?: {
      shouldExist?: string[]; // Text/elements that should exist after
      shouldNotExist?: string[]; // Text/elements that should not exist after
    };
  };
}

// Example command:
/*
{
  documentId: "Contract1.docx",
  action: "insert",
  location: {
    type: "heading",
    value: "Definitions",
    position: "after"
  },
  content: {
    text: '"Affiliate" means any entity...',
    style: {
      matchSource: true,
      specific: {
        bold: false
      }
    }
  },
  validation: {
    preConditions: {
      mustExist: ["Definitions"]
    },
    postConditions: {
      shouldExist: ["Affiliate", "means any entity"]
    }
  }
}
*/
