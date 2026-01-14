export const CODE_STYLES = `/* Code blocks */
pre.code-block {
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1em;
  margin: 1em 0;
  overflow-x: auto;
  font-family: "Courier New", Courier, monospace;
  font-size: 0.9em;
  line-height: 1.4;
  white-space: pre-wrap;
  word-wrap: break-word;
}

pre.code-block code {
  background: none;
  padding: 0;
  font-size: inherit;
}

/* Inline code */
code {
  background-color: #f0f0f0;
  padding: 0.1em 0.3em;
  border-radius: 3px;
  font-family: "Courier New", Courier, monospace;
  font-size: 0.9em;
}`;

export const FOOTNOTE_STYLES = `/* Footnotes and endnotes */
.footnote-ref {
  font-size: 0.75em;
  vertical-align: super;
  line-height: 0;
}

.footnote-ref a {
  text-decoration: none;
  color: #0066cc;
}

.footnotes-section {
  margin-top: 3em;
  padding-top: 1em;
  border-top: 1px solid #ccc;
}

.footnotes-section h2 {
  font-size: 1.2em;
  margin-bottom: 1em;
}

.footnote-item {
  font-size: 0.9em;
  margin-bottom: 0.5em;
  text-indent: 0;
}

.footnote-item .footnote-number {
  font-weight: bold;
  margin-right: 0.5em;
}`;

export const TOC_STYLES = `/* Table of Contents */
.toc-section {
  margin: 2em 0;
}

.toc-entry {
  margin: 0.3em 0;
  text-indent: 0;
}

.toc-level-1 { margin-left: 0; font-weight: bold; }
.toc-level-2 { margin-left: 1.5em; }
.toc-level-3 { margin-left: 3em; }
.toc-level-4 { margin-left: 4.5em; font-size: 0.95em; }

.toc-entry .page-ref {
  float: right;
  color: #666;
}

/* Generated Table of Contents navigation */
nav.table-of-contents {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 1.5em 2em;
  margin-bottom: 2em;
}

nav.table-of-contents h2 {
  font-size: 1.3em;
  margin-top: 0;
  margin-bottom: 1em;
  padding-bottom: 0.5em;
  border-bottom: 1px solid #dee2e6;
}

nav.table-of-contents ol {
  margin: 0;
  padding-left: 1.5em;
}

nav.table-of-contents li {
  margin: 0.5em 0;
}

nav.table-of-contents a {
  color: #0066cc;
  text-decoration: none;
}

nav.table-of-contents a:hover {
  text-decoration: underline;
}`;

export const INDEX_STYLES = `/* Index section */
.index-section {
  column-count: 2;
  column-gap: 2em;
}

.index-letter {
  font-weight: bold;
  font-size: 1.2em;
  margin-top: 1em;
  margin-bottom: 0.5em;
  color: #333;
}

.index-entry {
  margin: 0.2em 0;
  text-indent: 0;
}

.index-subentry {
  margin-left: 1.5em;
  font-size: 0.95em;
}

.index-refs {
  color: #666;
}`;

export const TABLE_STYLES = `/* Tables */
table.detected-table {
  border-collapse: collapse;
  margin: 1em 0;
  width: 100%;
  font-size: 0.9em;
}

table.detected-table th,
table.detected-table td {
  border: 1px solid #ccc;
  padding: 0.5em 0.75em;
  text-align: left;
}

table.detected-table th {
  background-color: #f5f5f5;
  font-weight: bold;
}

table.detected-table tr:nth-child(even) {
  background-color: #fafafa;
}`;

export const IMAGE_STYLES = `/* Images */
.image-container {
  text-align: center;
  margin: 1.5em 0;
}

.image-container img {
  max-width: 100%;
  height: auto;
}

.image-caption {
  font-size: 0.85em;
  color: #666;
  margin-top: 0.5em;
  font-style: italic;
}`;
