# Digital Bindery - Document Toolkit

## Overview

Digital Bindery is a hub-and-spoke document toolkit for central file management and processing of PDF and DOCX files. It allows users to upload files and then utilize various tools such as Compress, Convert (to EPUB/HTML/PDF), Analyze Structure, Combine PDFs, and PDF Debugger. A core feature is intelligent text cleanup to address formatting issues from PDF extraction. The system supports true streaming with backpressure, enabling the handling of large files without size limits and with memory bounded only by single line content.

### Supported File Types
- **PDF**: Compression, structure analysis, HTML/EPUB conversion, combining, debugging.
- **DOCX**: Conversion to HTML, EPUB, or PDF.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Quality Priorities
-   **Visual Fidelity**: Very important. Output must look polished and professional.
-   **Consistent Book Design**: Important. Both individual files and merged/combined files should have unified styling across chapters and documents.
-   **Simplified, Consistent HTML**: Somewhat important. Clean, reviewable code structure for inspection and debugging.

### Memory Strategy by Tool Type
-   **PDF Analysis & Compression**: Use disk-based streaming with temporary files (out-of-memory risk with large PDFs).
-   **All Other Tools** (Convert, Combine, HTML/EPUB generation, DOCX processing): Use in-memory techniques for completeness, quality, and performance.

### Processing Pipeline
PDF analysis and compression use disk-based streaming. Text extraction is performed by `pdftotext` via subprocess. Other tools (conversion, combining, EPUB/HTML generation) process in-memory for better quality and performance. A cleanup system removes stale temporary files.

### Frontend Architecture
-   **Technology Stack**: React with TypeScript, Wouter for routing, Context API for state management, shadcn/ui (Radix UI) for components, TailwindCSS for styling, and Vite for building.
-   **Design Decisions**: Utilizes `shadcn/ui` for consistent design, Wouter for lightweight routing, and a custom `FileProvider` for global state. Features a "paper" theme with serif/sans-serif fonts.
-   **Key Features**: Drag-and-drop upload, real-time processing preview, interactive conversion settings, multi-file batch processing, customizable typography, and `sessionStorage` for per-browser-tab session isolation.

### Backend Architecture
-   **Technology Stack**: Node.js with TypeScript, Express.js, Poppler `pdftotext`, `archiver`, Busboy, Drizzle ORM, and Server-Sent Events (SSE).
-   **Design Decisions**: Emphasizes disk-based, sequential, and subprocess-driven processing for large files. Uses per-chapter temporary files to minimize memory during EPUB assembly. **"No logic in client"** architecture ensures all business logic, validation, and data processing happens server-side, with the client only handling UI and API calls.
-   **API Endpoints**: Provides endpoints for file upload, PDF conversion (EPUB), compression, combining, SSE for progress tracking with cancellation, tool eligibility (`/api/tools/available`), CSS transformation (`/api/css/*`), and document structure extraction (`/api/html/outline`).
-   **File Type Detection**: Uses canonical MIME types instead of filename suffix parsing for reliable file type identification.

### Data Processing Architecture
-   **PDF Parsing**: Uses `pdftotext` to pipe text to temporary files, holding only a small preview in memory.
-   **Text Transformations**: A modular streaming pipeline handles text cleanup via temporary files.
-   **Table Detection**: Employs a strategy-based detection system with four modular strategies (pipe, key-value, block, aligned), supporting multiline value merging and automatic bolding of definition labels.
-   **EPUB Generation**: Splits content into per-chapter temporary files and streams them into `archiver` for EPUB 2 structure.
-   **HTML Generation**: Supports bundled (single HTML) or individual (separate XHTML per PDF) output, rendering content with file-specific tables and optional ToC.
-   **Page-Aware Processing**: HTML conversion splits by form-feed before processing pages independently to prevent cross-page paragraph merging, with protected line numbers from table detection.

### Book Style Harmonizer

The Book Style Harmonizer provides consistent typography and design across merged/combined documents:

**Presets:**
- **Classic Serif**: Georgia font, traditional book typography with first-line indents
- **Modern Clean**: Sans-serif, no indents, generous spacing
- **Traditional Book**: Times New Roman, compact spacing, deep indents

**Customizable Settings:**
- Body font and size (12-24px)
- Heading font and scale (H1-H6 multipliers)
- Line height (1.2-2.5)
- Paragraph spacing and first-line indent
- TOC title and entry sizing, divider visibility

**Implementation:**
- `shared/contracts/book-style-preset.ts`: Type definitions and default presets
- `server/lib/book-styles/build-book-styles-css.ts`: CSS generator from preset
- `server/lib/epub/stylesheet.ts` and `server/lib/html-builder/styles.ts`: Integration points
- `client/src/components/convert/BookStylesPanel.tsx`: UI controls

### Error Handling Architecture

The application uses a centralized error hierarchy for consistent error propagation and handling:

**Error Classes (server/common/errors/):**
-   **AppError**: Base class for all application errors. Contains message, error code, HTTP status, and optional details.
-   **ConversionError**: Used for PDF/DOCX/EPUB conversion failures. Returns 500 status with `CONVERSION_FAILED` code.
-   **ValidationError**: Used for invalid input validation. Returns 400 status with `VALIDATION_ERROR` code.
-   **FileNotFoundError**: Used when requested files don't exist. Returns 404 status.
-   **OperationCancelledError**: Used when user cancels long-running operations. Returns 499 status.
-   **ExtractionError**: Used for text extraction failures. Returns 500 status.
-   **UploadError**: Used for file upload failures. Returns 400 status.

**Error Flow:**
1. Services throw specific error types (e.g., `throw new ConversionError("Failed to extract text")`)
2. Controllers catch errors or let them propagate to middleware
3. Error middleware (`error-middleware.ts`) transforms errors to consistent JSON responses
4. Frontend receives structured error responses with code, message, and optional details

### In-Memory Content Enhancement Pipeline

The content enhancement system (`server/lib/content-enhancer/`) processes text in-memory for quality and performance:

**Pipeline Components:**
-   **enhance-content-file.ts**: Orchestrator that sequences detectors based on options
-   **toc-detector.ts**: Identifies and preserves Table of Contents formatting
-   **footnote-detector.ts**: Converts footnote references to proper footnote markup
-   **code-detector.ts**: Identifies indented code blocks and marks them for styling
-   **index-detector.ts**: Preserves book index formatting

**Flow:**
1. Read source file into string array (lines)
2. Apply each enabled detector synchronously
3. Detectors return modified lines array
4. Orchestrator joins lines and returns enhanced content

**Design Rationale:**
- In-memory processing enables multi-pass analysis needed for accurate detection
- Synchronous operations simplify error handling and debugging
- String array operations are fast for typical document sizes
- Only PDF analysis/compression use disk streaming (memory safety for large files)

### Observability and Logging

The application uses structured logging for production troubleshooting:

**Logger (server/common/logger.ts):**
- Supports levels: debug, info, warn, error
- Produces structured JSON-like logs with timestamps
- Child loggers add service context automatically

**Pipeline Timing:**
Long-running pipelines log timing for each stage with correlation IDs:
```
[INFO] Starting PDF text preparation { pipelineId, cleanup: {...}, processing: {...}, enhancement: {...} }
[INFO] PDF text extraction completed { pipelineId, durationMs }
[INFO] Text cleanup completed { pipelineId, durationMs }
[INFO] Table detection for merge protection completed { pipelineId, durationMs }
[INFO] Paragraph merge completed { pipelineId, durationMs }
[INFO] Content enhancement completed { pipelineId, durationMs }
[INFO] PDF text preparation complete { pipelineId, totalDurationMs, tempFileCount }
```

**Metrics Context:**
- `pipelineId`: Unique identifier for correlating logs across a single pipeline run
- `durationMs`: Individual operation timing
- `totalDurationMs`: Full pipeline timing
- `count`: Item counts (tables, protected lines, etc.)
- `service`: Which service generated the log
- Grouped option flags: cleanup (hyphenation, headers, pages, whitespace, ligatures), processing (chapters, paragraphs, tables, sensitivity), enhancement (code, footnotes, TOC, index)

### Code Organization

The codebase follows a modular architecture optimized for maintainability by multiple developers. Target file size is under 200 lines, with pure logic functions in single-purpose files.

**Key Patterns:**
-   **Single-Function Files**: Pure logic functions live in dedicated files. Direct imports preferred over barrel re-exports. All barrel files have been eliminated (format/, file-manager/, content-enhancer/, pdf-structure/, object-storage/, errors/, contracts/).
-   **Orchestration Function Exception**: Functions exceeding 20 LOC are allowed when they are orchestrators that: (1) primarily sequence operations, (2) have helper functions already extracted, (3) contain minimal embedded business logic. Examples: `enhanceContentFile`, `generateEPUBFromHtml`, `sanitizeHtmlContent`.
-   **UI/Logic Separation**: React components are thin UI handlers; business logic lives in custom hooks.
-   **Service Layer**: Controllers delegate to focused services, keeping route handlers minimal.
-   **useAsyncAction Hook**: Shared pattern for async operations with toast notifications, abort controller support, and state management. Uses refs updated synchronously during render to prevent stale closures when execute() is called immediately after state changes. For same-tick parameter updates (e.g., options passed at call time), store values in a ref before calling execute(). Used by all conversion hooks, compression, combine, and clipboard paste.
-   **withAsyncToast Helper**: Simpler pattern for one-off async operations that only need toast notifications without full state management. Used for inline operations in CssEditor, useStylesApi, and similar.
-   **Modular Utilities**: Format functions split into `lib/format/` (file-size.ts, format-duration.ts, format-timestamp.ts, format-percentage.ts). File type checks in `lib/file-types.ts`.
-   **CSS Editor Architecture**: Follows "no parsing on client" rule. Server parses CSS and returns structured data (`shared/contracts/css-editor.ts`). Client stores parsed state, performs object manipulation for edits, and uses client-side serialization only (`client/src/lib/css-helpers.ts`) for immediate feedback. The `editable` flag on rules prevents mutation of non-editable rules like `@font-face` and `:root`.

**Directory Structure:**
```
shared/
├── utils/            # Shared utility functions
└── toc/              # Shared TOC types

client/src/
├── components/       # UI components (thin, focused)
├── hooks/            # Custom hooks with business logic
├── lib/              # Utility functions and API clients
└── pages/            # Route components using hooks

server/
├── common/           # Shared infrastructure (errors, logging, config)
├── controllers/      # Thin route handlers with validation
├── services/         # Business logic by domain (epub, docx, html-service)
└── lib/              # Shared utilities (epub, html-builder, text-utils, text-transforms)
```

## External Dependencies

### Key Libraries
**Backend:**
-   **Poppler (pdftotext):** PDF text extraction.
-   **archiver:** ZIP/EPUB creation.
-   **busboy:** Multipart form data streaming.
-   **drizzle-orm:** Type-safe SQL query builder.
-   **express:** Web server framework.

**Frontend:**
-   **@tanstack/react-query:** Data fetching.
-   **@radix-ui/*:** Headless UI primitives.
-   **framer-motion:** Animation.
-   **wouter:** Routing.
-   **zod:** Runtime type validation.
-   **tailwindcss:** CSS framework.

**Build Tools:**
-   **vite:** Frontend build tool.
-   **esbuild:** JavaScript bundler.
-   **typescript:** Type system.