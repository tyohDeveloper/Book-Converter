import type { CSSProperties } from "react";

interface StylePreviewProps {
  selector: string;
  declarations: Record<string, string>;
}

function cssToReactStyle(declarations: Record<string, string>): CSSProperties {
  const result: Record<string, string> = {};
  for (const [prop, val] of Object.entries(declarations)) {
    if (!val) continue;
    const camelProp = prop.startsWith('--') 
      ? prop 
      : prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    result[camelProp] = val;
  }
  return result as CSSProperties;
}

export function StylePreview({ selector, declarations }: StylePreviewProps) {
  return (
    <div className="mt-4 pt-4 border-t flex-shrink-0">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Preview</h4>
      <div className="flex gap-3">
        <div 
          className="flex-1 p-4 rounded border min-h-[80px] flex items-center justify-center"
          style={{ 
            background: 'repeating-conic-gradient(#f0f0f0 0% 25%, #ffffff 0% 50%) 50% / 16px 16px',
          }}
          data-testid="css-style-preview"
        >
          <div 
            className="bg-white dark:bg-gray-900 p-3 rounded shadow-sm border"
            style={cssToReactStyle(declarations)}
          >
            Sample Text
          </div>
        </div>
        <pre className="flex-1 font-mono text-xs p-3 rounded bg-muted/50 border overflow-x-auto whitespace-pre-wrap" data-testid="css-definition-preview">
{selector} {"{"}
{Object.entries(declarations)
  .filter(([, v]) => v)
  .map(([prop, val]) => `  ${prop}: ${val};`)
  .join('\n') || '  /* no properties set */'}
{"}"}
        </pre>
      </div>
    </div>
  );
}
