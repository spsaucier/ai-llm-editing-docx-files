export interface InsertionRequest {
  document: File;
  clause: string;
  targetSection: string;
  formatting?: {
    bold?: boolean;
    underline?: boolean;
  };
}

export interface ProcessingStatus {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  result?: {
    document?: string;
    error?: string;
  };
}

export interface ProcessingJob {
  id: string;
  document: string;
  clause: string;
  targetSection: string;
  formatting: {
    bold: boolean;
    underline: boolean;
  };
}

export interface StyleRequirements {
  matchSource?: boolean;
  specific?: {
    font?: string;
    size?: number;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    color?: string;
    style?: string;
    spacing?: {
      before?: number;
      after?: number;
      line?: number;
    };
    alignment?: 'left' | 'center' | 'right' | 'justify';
  };
}

export interface ContentSpecification {
  text: string;
  style: StyleRequirements;
}

export interface Change {
  type: 'replace' | 'add';
  text: string;
  oldText?: string;
  section?: string;
}

export type ContractResult = {
  document?: string;
  error?: string;
  changes?: Change[];
};

export interface HeadingLocation {
  type: 'heading';
  value: string;
  position: 'before' | 'after' | 'replace';
  matchLevel?: boolean;
}

export interface SectionLocation {
  type: 'section';
  number: string | number;
  position: 'before' | 'after' | 'replace';
  section?: string | number;
}

export interface ParagraphLocation {
  type: 'paragraph';
  matchText: string;
  position: 'before' | 'after' | 'replace';
  paragraphNumber?: number;
}

export interface SentenceLocation {
  type: 'sentence';
  number: string | number;
  position: 'before' | 'after' | 'replace';
  sentenceNumber?: number;
}

export type LocationSpecifier =
  | HeadingLocation
  | SectionLocation
  | ParagraphLocation
  | SentenceLocation;

export interface DocumentCommand {
  documentId: string;
  action: 'insert' | 'modify' | 'delete';
  location: LocationSpecifier;
  content?: {
    text: string;
    style: {
      matchSource?: boolean;
      specific?: {
        bold?: boolean;
        italic?: boolean;
        underline?: boolean;
      };
    };
  };
}
