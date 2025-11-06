export interface ApiError {
  success: false;
  message: string;
  statusCode?: number;
  details?: any;
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
}
