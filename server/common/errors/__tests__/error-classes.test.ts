import { describe, it, expect } from "vitest";
import { ErrorCode } from "../error-codes";
import { AppError } from "../app-error";
import {
  ValidationError,
  FileNotFoundError,
  SessionNotFoundError,
  OperationNotFoundError,
  OperationCancelledError,
  ConversionError,
  ExtractionError,
  UploadError,
} from "../specific-errors";

describe("ErrorCode", () => {
  it("has all expected error codes", () => {
    expect(ErrorCode.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
    expect(ErrorCode.FILE_NOT_FOUND).toBe("FILE_NOT_FOUND");
    expect(ErrorCode.SESSION_NOT_FOUND).toBe("SESSION_NOT_FOUND");
    expect(ErrorCode.OPERATION_NOT_FOUND).toBe("OPERATION_NOT_FOUND");
    expect(ErrorCode.OPERATION_CANCELLED).toBe("OPERATION_CANCELLED");
    expect(ErrorCode.CONVERSION_FAILED).toBe("CONVERSION_FAILED");
    expect(ErrorCode.EXTRACTION_FAILED).toBe("EXTRACTION_FAILED");
    expect(ErrorCode.UPLOAD_FAILED).toBe("UPLOAD_FAILED");
    expect(ErrorCode.INTERNAL_ERROR).toBe("INTERNAL_ERROR");
  });
});

describe("AppError", () => {
  it("creates error with all properties", () => {
    const error = new AppError("Test message", ErrorCode.INTERNAL_ERROR, 500, "details");
    
    expect(error.message).toBe("Test message");
    expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
    expect(error.statusCode).toBe(500);
    expect(error.details).toBe("details");
    expect(error.isOperational).toBe(true);
  });

  it("defaults to status 500", () => {
    const error = new AppError("Test", ErrorCode.INTERNAL_ERROR);
    expect(error.statusCode).toBe(500);
  });

  it("serializes to JSON correctly", () => {
    const error = new AppError("Test message", ErrorCode.VALIDATION_ERROR, 400, "extra info");
    const json = error.toJSON();
    
    expect(json).toEqual({
      error: "Test message",
      code: ErrorCode.VALIDATION_ERROR,
      details: "extra info",
    });
  });

  it("excludes details from JSON when not provided", () => {
    const error = new AppError("Test", ErrorCode.INTERNAL_ERROR, 500);
    const json = error.toJSON();
    
    expect(json).toEqual({
      error: "Test",
      code: ErrorCode.INTERNAL_ERROR,
    });
    expect(json).not.toHaveProperty("details");
  });
});

describe("ValidationError", () => {
  it("creates with correct properties", () => {
    const error = new ValidationError("Invalid input", "field is required");
    
    expect(error.message).toBe("Invalid input");
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.statusCode).toBe(400);
    expect(error.details).toBe("field is required");
  });
});

describe("FileNotFoundError", () => {
  it("creates with file ID", () => {
    const error = new FileNotFoundError("abc123");
    
    expect(error.message).toBe("File not found: abc123");
    expect(error.code).toBe(ErrorCode.FILE_NOT_FOUND);
    expect(error.statusCode).toBe(404);
  });

  it("creates without file ID", () => {
    const error = new FileNotFoundError();
    expect(error.message).toBe("File not found");
  });
});

describe("SessionNotFoundError", () => {
  it("creates with session ID", () => {
    const error = new SessionNotFoundError("session123");
    
    expect(error.message).toBe("Session not found: session123");
    expect(error.code).toBe(ErrorCode.SESSION_NOT_FOUND);
    expect(error.statusCode).toBe(404);
  });

  it("creates without session ID", () => {
    const error = new SessionNotFoundError();
    expect(error.message).toBe("Session not found");
  });
});

describe("OperationNotFoundError", () => {
  it("creates with operation ID", () => {
    const error = new OperationNotFoundError("op123");
    
    expect(error.message).toBe("Operation not found: op123");
    expect(error.code).toBe(ErrorCode.OPERATION_NOT_FOUND);
    expect(error.statusCode).toBe(404);
  });
});

describe("OperationCancelledError", () => {
  it("creates with correct status code 499", () => {
    const error = new OperationCancelledError("op123");
    
    expect(error.message).toBe("Operation cancelled: op123");
    expect(error.code).toBe(ErrorCode.OPERATION_CANCELLED);
    expect(error.statusCode).toBe(499);
  });
});

describe("ConversionError", () => {
  it("creates with correct properties", () => {
    const error = new ConversionError("Failed to convert", "invalid format");
    
    expect(error.message).toBe("Failed to convert");
    expect(error.code).toBe(ErrorCode.CONVERSION_FAILED);
    expect(error.statusCode).toBe(500);
    expect(error.details).toBe("invalid format");
  });
});

describe("ExtractionError", () => {
  it("creates with correct properties", () => {
    const error = new ExtractionError("Failed to extract");
    
    expect(error.message).toBe("Failed to extract");
    expect(error.code).toBe(ErrorCode.EXTRACTION_FAILED);
    expect(error.statusCode).toBe(500);
  });
});

describe("UploadError", () => {
  it("creates with correct properties", () => {
    const error = new UploadError("Upload failed", "file too large");
    
    expect(error.message).toBe("Upload failed");
    expect(error.code).toBe(ErrorCode.UPLOAD_FAILED);
    expect(error.statusCode).toBe(400);
    expect(error.details).toBe("file too large");
  });
});
