export function getTocStyles(): string {
  return `
.table-of-contents {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 20px 30px;
  margin-bottom: 30px;
}
.table-of-contents h2 {
  font-size: 1.3em;
  margin-top: 0;
  margin-bottom: 15px;
  color: #2c3e50;
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 10px;
}
.table-of-contents ol { margin: 0; padding-left: 20px; }
.table-of-contents li { margin: 8px 0; }
.table-of-contents a { color: #3498db; text-decoration: none; }
.table-of-contents a:hover { text-decoration: underline; }
.toc-entry { margin: 0.3em 0; }
.toc-entry.level-1 { font-weight: bold; }
.toc-entry.level-2 { margin-left: 1.5em; }
.toc-entry.level-3 { margin-left: 3em; font-size: 0.95em; }
`;
}
