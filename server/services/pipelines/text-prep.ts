// Backward compatibility - re-export everything from the split modules
export type {
  ProcessedPage,
  BaseConversionSettings,
  TextPrepOptions,
  PreparedText,
  TextPrepResult,
  PreparedContent,
  PageAwarePreparedContent,
} from "./types";

export { settingsToTextPrepOptions } from "./types";

export {
  preparePdfText,
  cleanupTempFiles,
  preparePdfForHtml,
} from "./prep";

export { preparePdfForHtmlPageAware } from "./page-aware";
