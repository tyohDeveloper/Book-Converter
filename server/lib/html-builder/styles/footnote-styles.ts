export function getFootnoteStyles(): string {
  return `
.footnote-ref { font-size: 0.75em; vertical-align: super; }
.footnote-item {
  font-size: 0.9em;
  border-top: 1px solid #eee;
  padding-top: 0.5em;
  margin-top: 0.5em;
}
.index-section { margin: 1em 0; }
.index-letter {
  font-weight: bold;
  font-size: 1.2em;
  border-bottom: 1px solid #ccc;
  margin-top: 1em;
}
.index-entry { margin-left: 1em; }
`;
}
