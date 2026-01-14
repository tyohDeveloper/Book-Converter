/**
 * Table detection patterns - re-exports from focused modules
 */

export { isTableBorderLine, isTableDataLine, parseTableRow } from "./pipe-patterns";
export { isKeyValueLine, isKeyValueLineSimple, isContinuationLine, isTableSectionHeader } from "./kv-patterns";
export { isAlignedColumnLine } from "./aligned-patterns";
export { isDefinitionStyleEntry, parseBlockEntryToRow } from "./block-patterns";
export { isSectionHeader } from "./is-section-header";
export { getSectionContentType, getSectionHeaderType } from "./section-content-type";
export { mergeKvTableRows } from "./merge-kv-table-rows";
