export type { DetectedTable, TableDetectionResult } from "./table-detector/types";
export { detectTables } from "./table-detector/detector";
export { tableToHTML } from "./table-detector/renderer";
export {
  isTableBorderLine,
  isTableDataLine,
  parseTableRow,
  isKeyValueLine,
  isContinuationLine,
  isAlignedColumnLine,
  mergeKvTableRows,
} from "./table-detector/patterns";
