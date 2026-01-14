import { useCallback, useRef } from "react";
import type { FontSelection } from "@/components/font-picker/FontPicker";
import type { ParsedStylesheet } from "@/lib/file-manager/css/types";
import { stylesheetToCss } from "@shared/css/stylesheet-to-css";
import { updateRuleParsed } from "@shared/css/update-rule-parsed";

interface UseRuleEditorOptions {
  selectedSelector: string | null;
  mode: "visual" | "management" | "raw";
  parsed: ParsedStylesheet;
  multiEditSelection: Set<string>;
  onParsedUpdate: (parsed: ParsedStylesheet, styles: string) => void;
  onRawStylesUpdate: (updater: (styles: string) => string) => void;
}

function applyPropertyUpdate(decls: Record<string, string>, property: string, value: string): Record<string, string> {
  const newDecls = { ...decls };
  if (property === 'padding') {
    delete newDecls['padding-top']; delete newDecls['padding-right'];
    delete newDecls['padding-bottom']; delete newDecls['padding-left'];
  } else if (property.startsWith('padding-')) delete newDecls['padding'];
  if (property === 'margin') {
    delete newDecls['margin-top']; delete newDecls['margin-right'];
    delete newDecls['margin-bottom']; delete newDecls['margin-left'];
  } else if (property.startsWith('margin-')) delete newDecls['margin'];
  if (value) newDecls[property] = value; else delete newDecls[property];
  return newDecls;
}

export function useRuleEditor({ selectedSelector, mode, parsed, multiEditSelection, onParsedUpdate, onRawStylesUpdate }: UseRuleEditorOptions) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const updateDeclaration = useCallback((property: string, value: string) => {
    if (multiEditSelection.size > 0) {
      let updatedParsed = parsed;
      multiEditSelection.forEach(selector => {
        const rule = updatedParsed.rules.find(r => r.selector === selector);
        const currentDecls = rule?.declarations || {};
        const newDecls = applyPropertyUpdate(currentDecls, property, value);
        updatedParsed = updateRuleParsed(updatedParsed, selector, newDecls);
      });
      onParsedUpdate(updatedParsed, stylesheetToCss(updatedParsed));
      return;
    }
    
    if (!selectedSelector) return;
    const rule = parsed.rules.find(r => r.selector === selectedSelector);
    const currentDecls = rule?.declarations || {};
    const newDecls = applyPropertyUpdate(currentDecls, property, value);
    const updatedParsed = updateRuleParsed(parsed, selectedSelector, newDecls);
    onParsedUpdate(updatedParsed, stylesheetToCss(updatedParsed));
  }, [selectedSelector, parsed, multiEditSelection, onParsedUpdate]);

  const handleFontSelect = useCallback((selection: FontSelection) => {
    if (mode === "visual" && (selectedSelector || multiEditSelection.size > 0)) {
      let updatedParsed = parsed;
      if (selection.googleImport && !parsed.imports.includes(selection.googleImport)) {
        updatedParsed = { ...parsed, imports: [...parsed.imports, selection.googleImport] };
      }
      
      if (multiEditSelection.size > 0) {
        multiEditSelection.forEach(selector => {
          const rule = updatedParsed.rules.find(r => r.selector === selector);
          const currentDecls = rule?.declarations || {};
          const updatedDecls = { ...currentDecls, 'font-family': selection.fontFamily };
          updatedParsed = updateRuleParsed(updatedParsed, selector, updatedDecls);
        });
      } else if (selectedSelector) {
        const rule = updatedParsed.rules.find(r => r.selector === selectedSelector);
        const currentDecls = rule?.declarations || {};
        const updatedDecls = { ...currentDecls, 'font-family': selection.fontFamily };
        updatedParsed = updateRuleParsed(updatedParsed, selectedSelector, updatedDecls);
      }
      onParsedUpdate(updatedParsed, stylesheetToCss(updatedParsed));
    } else {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const { fontFamily, googleImport } = selection;
      onRawStylesUpdate(currentStyles => {
        let newStyles = currentStyles;
        let insertOffset = 0;
        if (googleImport && !currentStyles.includes(googleImport)) {
          const importLine = googleImport + "\n\n";
          newStyles = importLine + currentStyles;
          insertOffset = importLine.length;
        }
        const start = textarea.selectionStart + insertOffset;
        const end = textarea.selectionEnd + insertOffset;
        const before = newStyles.substring(0, start);
        const after = newStyles.substring(end);
        setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + fontFamily.length, start + fontFamily.length); }, 0);
        return before + fontFamily + after;
      });
    }
  }, [mode, selectedSelector, parsed, multiEditSelection, onParsedUpdate, onRawStylesUpdate]);

  return { textareaRef, updateDeclaration, handleFontSelect };
}
