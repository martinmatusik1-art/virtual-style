export enum AppStep {
  UPLOAD_PERSON = 'UPLOAD_PERSON',
  UPLOAD_CLOTHING = 'UPLOAD_CLOTHING',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT',
}

export interface ImageFile {
  preview: string; // Data URL for display
  base64: string;  // Raw base64 for API
  mimeType: string;
}

export interface TryOnResult {
  imageUrl: string;
  feedback?: string;
}