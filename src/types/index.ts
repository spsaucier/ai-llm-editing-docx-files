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
