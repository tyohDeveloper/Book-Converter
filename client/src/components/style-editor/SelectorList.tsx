import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { FileCode, Lock, Paintbrush, Layers, Copy } from "lucide-react";
import { naturalCompare } from "@shared/utils/natural-sort";
import type { CssRule } from "@/lib/file-manager/css/types";

interface SelectorListProps {
  rules: CssRule[];
  selectedSelector: string | null;
  onSelect: (selector: string) => void;
  disabled?: boolean;
  inlineCounts?: Map<string, number>;
  usageCounts?: Map<string, number>;
  className?: string;
  multiEditMode?: boolean;
  multiEditSelection?: Set<string>;
  onToggleMultiEdit?: (selector: string) => void;
}

function isEditableRule(rule: CssRule): boolean {
  const s = rule.selector;
  if (s.startsWith('@import')) return false;
  if (s.startsWith(':root')) return false;
  return true;
}

function isInlineStyle(selector: string): boolean { return selector.startsWith('[inline-style-'); }
function isMultiClass(selector: string): boolean { return selector.startsWith('[multi-class-'); }
function isDuplicate(selector: string): boolean { return selector.startsWith('[duplicate-'); }

function getCascadeLevel(selector: string): number {
  if (selector.startsWith('@import')) return 0;
  if (selector.startsWith('@')) return 1;
  if (/^[a-z]/i.test(selector) && !selector.startsWith('.')) return 2;
  if (selector.startsWith('.')) return 3;
  if (selector.startsWith('[inline-style-')) return 10;
  if (selector.startsWith('[multi-class-')) return 11;
  if (selector.startsWith('[duplicate-')) return 12;
  return 2;
}

function getIndentLevel(selector: string): number {
  return 0;
}

function sortRules(rules: CssRule[]): CssRule[] {
  return [...rules].sort((a, b) => {
    const levelA = getCascadeLevel(a.selector);
    const levelB = getCascadeLevel(b.selector);
    if (levelA !== levelB) return levelA - levelB;
    return naturalCompare(a.selector, b.selector);
  });
}


export function SelectorList({ rules, selectedSelector, onSelect, disabled, inlineCounts, usageCounts, className, multiEditMode, multiEditSelection, onToggleMultiEdit }: SelectorListProps) {
  const sortedRules = useMemo(() => sortRules(rules), [rules]);
  
  if (rules.length === 0) {
    return <div className="text-sm text-muted-foreground italic p-4">No CSS rules found. Add rules in the Raw CSS tab.</div>;
  }

  return (
    <ScrollArea className={cn("h-full", className)} scrollbarType="always">
      <div className="space-y-1 p-2 pr-3">
        {sortedRules.map((rule, index) => {
          const editable = isEditableRule(rule);
          const isInline = isInlineStyle(rule.selector);
          const isMulti = isMultiClass(rule.selector);
          const isDupe = isDuplicate(rule.selector);
          const isSelected = rule.selector === selectedSelector;
          const indent = getIndentLevel(rule.selector);
          const inlineCount = inlineCounts?.get(rule.selector);
          const usageCount = usageCounts?.get(rule.selector);
          const canMultiEdit = multiEditMode && editable && !isInline && !isMulti && !isDupe;
          const isMultiEditChecked = multiEditSelection?.has(rule.selector) ?? false;
          
          const handleClick = () => {
            if (editable) {
              onSelect(rule.selector);
            }
          };
          
          return (
            <div
              key={`${rule.selector}-${index}`}
              onClick={handleClick}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } }}
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-disabled={disabled}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-sm font-mono transition-colors flex items-center gap-2 cursor-pointer select-none",
                isSelected && !multiEditMode && "bg-primary text-primary-foreground",
                !isSelected && !isMultiEditChecked && "hover:bg-secondary",
                !editable && "bg-muted/30",
                isInline && !isSelected && "bg-amber-50 dark:bg-amber-900/20",
                isMulti && !isSelected && "bg-blue-50 dark:bg-blue-900/20",
                isDupe && !isSelected && "bg-teal-50 dark:bg-teal-900/20",
                isMultiEditChecked && "bg-primary/10 ring-1 ring-primary/30"
              )}
              style={{ paddingLeft: `${12 + indent * 16}px` }}
              data-testid={`selector-${rule.selector.replace(/[^a-zA-Z0-9]/g, '-')}`}
            >
              {canMultiEdit && (
                <Checkbox
                  checked={isMultiEditChecked}
                  onCheckedChange={() => onToggleMultiEdit?.(rule.selector)}
                  className="h-4 w-4 flex-shrink-0 border-primary data-[state=checked]:bg-primary"
                  onClick={(e) => e.stopPropagation()}
                  data-testid={`multi-edit-checkbox-${rule.selector.replace(/[^a-zA-Z0-9]/g, '-')}`}
                />
              )}
              {!canMultiEdit && !editable && <Lock className="h-3 w-3 flex-shrink-0" />}
              {!canMultiEdit && isInline && <Paintbrush className="h-3 w-3 flex-shrink-0 text-amber-600" />}
              {!canMultiEdit && isMulti && <Layers className="h-3 w-3 flex-shrink-0 text-blue-600" />}
              {!canMultiEdit && isDupe && <Copy className="h-3 w-3 flex-shrink-0 text-teal-600" />}
              {!canMultiEdit && editable && !isInline && !isMulti && !isDupe && <FileCode className="h-3 w-3 flex-shrink-0" />}
              <span className="truncate flex-1">{rule.selector}</span>
              {usageCount !== undefined && !isInline && !isMulti && !isDupe && (
                <span className={cn("text-xs px-1.5 py-0.5 rounded-full", usageCount === 0 ? "bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200" : "bg-muted text-muted-foreground")}>{usageCount}</span>
              )}
              {inlineCount !== undefined && inlineCount > 1 && (
                <span className={cn("text-xs px-1.5 py-0.5 rounded-full", isInline && "bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200", isMulti && "bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200", isDupe && "bg-teal-200 dark:bg-teal-800 text-teal-800 dark:text-teal-200")}>{inlineCount}×</span>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
