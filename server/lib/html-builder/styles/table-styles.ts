export function getTableStyles(): string {
  return `
.detected-table {
  border-collapse: collapse;
  width: 100%;
  margin: 1.5em 0;
  font-size: 0.95em;
}
.detected-table th, .detected-table td {
  border: 1px solid #ddd;
  padding: 10px 12px;
  text-align: left;
  vertical-align: top;
}
.detected-table th {
  background-color: #f5f5f5;
  font-weight: 600;
  width: 25%;
}
.detected-table tr:nth-child(even) { background-color: #fafafa; }
pre.code-block {
  background-color: #f4f4f4;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1em;
  overflow-x: auto;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.9em;
}
`;
}
