export interface ProcessingJob {
  document: string; // base64 encoded docx
  clause: string;
  targetSection: string;
  formatting: {
    bold: boolean;
    underline: boolean;
  };
}
