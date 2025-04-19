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

export type LocationSpecifier =
  | HeadingLocation
  | SectionLocation
  | SentenceLocation
  | ParagraphLocation;

export interface HeadingLocation {
  type: 'heading';
  value: string;
  position: 'before' | 'after' | 'replace';
  matchLevel?: boolean;
}

export interface SectionLocation {
  type: 'section';
  number: string | number;
  position: 'start' | 'end' | 'replace';
}

export interface SentenceLocation {
  type: 'sentence';
  section?: string | number;
  paragraph?: number;
  sentenceNumber?: number;
  matchText?: string;
  position: 'before' | 'after' | 'replace';
}

export interface ParagraphLocation {
  type: 'paragraph';
  section?: string | number;
  paragraphNumber?: number;
  matchText?: string;
  position: 'before' | 'after' | 'replace';
}

export interface DocumentCommand {
  documentId: string;
  action: 'insert' | 'modify' | 'delete';
  location: {
    type: 'heading' | 'section' | 'sentence' | 'paragraph';
    value?: string; // For heading type
    number?: string | number; // For section type
    position: 'before' | 'after' | 'replace' | 'start' | 'end';
    matchText?: string; // For sentence/paragraph type
    section?: string | number; // For sentence/paragraph type
    paragraphNumber?: number; // For paragraph type
    sentenceNumber?: number; // For sentence type
    matchLevel?: boolean; // For heading type
  };
  content?: {
    text: string;
    style: {
      matchSource?: boolean;
      specific?: {
        bold?: boolean;
        italic?: boolean;
        underline?: boolean;
        color?: string;
        font?: string;
        size?: number;
        style?: string;
        spacing?: {
          before?: number;
          after?: number;
          line?: number;
        };
        alignment?: 'left' | 'center' | 'right' | 'justify';
      };
    };
  };
}

export type Change = {
  type: 'replace' | 'add';
  text: string;
  oldText?: string;
  section?: string;
};

export type ContractResult = {
  document?: string;
  error?: string;
  changes?: Change[];
};
