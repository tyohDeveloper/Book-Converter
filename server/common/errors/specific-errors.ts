import { ErrorCode } from "./error-codes";
import { AppError } from "./app-error";

export class ValidationError extends AppError {
  constructor(message: string, details?: string) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, details);
  }
}

export class FileNotFoundError extends AppError {
  constructor(fileId?: string) {
    super(
      fileId ? `File not found: ${fileId}` : "File not found",
      ErrorCode.FILE_NOT_FOUND,
      404
    );
  }
}

export class SessionNotFoundError extends AppError {
  constructor(sessionId?: string) {
    super(
      sessionId ? `Session not found: ${sessionId}` : "Session not found",
      ErrorCode.SESSION_NOT_FOUND,
      404
    );
  }
}

export class OperationNotFoundError extends AppError {
  constructor(operationId?: string) {
    super(
      operationId ? `Operation not found: ${operationId}` : "Operation not found",
      ErrorCode.OPERATION_NOT_FOUND,
      404
    );
  }
}

export class OperationCancelledError extends AppError {
  constructor(operationId?: string) {
    super(
      operationId ? `Operation cancelled: ${operationId}` : "Operation cancelled",
      ErrorCode.OPERATION_CANCELLED,
      499
    );
  }
}

export class ConversionError extends AppError {
  constructor(message: string, details?: string) {
    super(message, ErrorCode.CONVERSION_FAILED, 500, details);
  }
}

export class ExtractionError extends AppError {
  constructor(message: string, details?: string) {
    super(message, ErrorCode.EXTRACTION_FAILED, 500, details);
  }
}

export class UploadError extends AppError {
  constructor(message: string, details?: string) {
    super(message, ErrorCode.UPLOAD_FAILED, 400, details);
  }
}
