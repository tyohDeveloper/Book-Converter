import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateUUID } from '../generate-uuid';
import { getContainerXML } from '../get-container-xml';
import { getContentOPF } from '../get-content-opf';
import { getContentOPFFromChapters } from '../get-content-opf-from-chapters';
import { getTOCNCX } from '../get-toc-ncx';
import { getTOCNCXFromChapters } from '../get-toc-ncx-from-chapters';

describe('generateUUID', () => {
  it('should generate valid UUID format', () => {
    const uuid = generateUUID();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    assert.ok(uuidRegex.test(uuid), `UUID "${uuid}" does not match expected format`);
  });

  it('should generate unique UUIDs', () => {
    const uuid1 = generateUUID();
    const uuid2 = generateUUID();
    assert.notStrictEqual(uuid1, uuid2);
  });
});

describe('getContainerXML', () => {
  it('should return valid container XML', () => {
    const xml = getContainerXML();
    assert.ok(xml.includes('<?xml version="1.0"'));
    assert.ok(xml.includes('urn:oasis:names:tc:opendocument:xmlns:container'));
    assert.ok(xml.includes('OEBPS/content.opf'));
  });
});

describe('getContentOPF', () => {
  it('should generate OPF with title and author', () => {
    const options = {
      title: 'Test Book',
      author: 'Test Author',
      chapters: [{ title: 'Chapter 1', content: 'Content', page: 1 }],
      fullText: 'Full text content'
    };
    const opf = getContentOPF(options);
    assert.ok(opf.includes('<dc:title>Test Book</dc:title>'));
    assert.ok(opf.includes('<dc:creator>Test Author</dc:creator>'));
  });

  it('should escape XML special characters', () => {
    const options = {
      title: 'Test & Book',
      author: 'Author <Name>',
      chapters: [],
      fullText: ''
    };
    const opf = getContentOPF(options);
    assert.ok(opf.includes('Test &amp; Book'));
    assert.ok(opf.includes('Author &lt;Name&gt;'));
  });

  it('should include manifest items for chapters', () => {
    const options = {
      title: 'Test',
      author: 'Author',
      chapters: [
        { title: 'Ch 1', content: '', page: 1 },
        { title: 'Ch 2', content: '', page: 2 }
      ],
      fullText: ''
    };
    const opf = getContentOPF(options);
    assert.ok(opf.includes('chapter1.xhtml'));
    assert.ok(opf.includes('chapter2.xhtml'));
  });
});

describe('getTOCNCX', () => {
  it('should generate NCX with chapter navigation', () => {
    const options = {
      title: 'Test Book',
      author: 'Author',
      chapters: [
        { title: 'Introduction', content: '', page: 1 },
        { title: 'Chapter 1', content: '', page: 5 }
      ],
      fullText: ''
    };
    const ncx = getTOCNCX(options);
    assert.ok(ncx.includes('Introduction'));
    assert.ok(ncx.includes('Chapter 1'));
    assert.ok(ncx.includes('navPoint-1'));
    assert.ok(ncx.includes('navPoint-2'));
  });

  it('should escape XML in chapter titles', () => {
    const options = {
      title: 'Test',
      author: 'Author',
      chapters: [{ title: 'Chapter 1 & 2', content: '', page: 1 }],
      fullText: ''
    };
    const ncx = getTOCNCX(options);
    assert.ok(ncx.includes('Chapter 1 &amp; 2'));
  });

  it('should handle empty chapters with fallback', () => {
    const options = {
      title: 'Test',
      author: 'Author',
      chapters: [],
      fullText: 'Full content text'
    };
    const ncx = getTOCNCX(options);
    assert.ok(ncx.includes('Content'));
    assert.ok(ncx.includes('navPoint-1'));
  });
});

describe('getContentOPFFromChapters', () => {
  it('should generate OPF from extracted chapters', () => {
    const chapters = [
      { title: 'Chapter 1', content: 'Content 1', page: 1 },
      { title: 'Chapter 2', content: 'Content 2', page: 10 }
    ];
    const opf = getContentOPFFromChapters('Book Title', 'Author Name', chapters);
    assert.ok(opf.includes('<dc:title>Book Title</dc:title>'));
    assert.ok(opf.includes('<dc:creator>Author Name</dc:creator>'));
    assert.ok(opf.includes('chapter1.xhtml'));
    assert.ok(opf.includes('chapter2.xhtml'));
  });

  it('should include image manifest items', () => {
    const chapters = [{ title: 'Ch 1', content: '', page: 1 }];
    const images = [
      { id: 'img1', data: Buffer.from(''), type: 'image/png' as const, filename: 'img1.png', path: '/tmp/img1.png', page: 1, width: 100, height: 100 },
      { id: 'img2', data: Buffer.from(''), type: 'image/jpeg' as const, filename: 'img2.jpg', path: '/tmp/img2.jpg', page: 2, width: 200, height: 200 }
    ];
    const opf = getContentOPFFromChapters('Title', 'Author', chapters, images);
    assert.ok(opf.includes('images/img1.png'));
    assert.ok(opf.includes('images/img2.jpg'));
    assert.ok(opf.includes('media-type="image/png"'));
    assert.ok(opf.includes('media-type="image/jpeg"'));
  });
});

describe('getTOCNCXFromChapters', () => {
  it('should generate NCX from extracted chapters', () => {
    const chapters = [
      { title: 'Prologue', content: '', page: 1 },
      { title: 'Chapter 1', content: '', page: 5 }
    ];
    const ncx = getTOCNCXFromChapters('My Book', chapters);
    assert.ok(ncx.includes('My Book'));
    assert.ok(ncx.includes('Prologue'));
    assert.ok(ncx.includes('Chapter 1'));
  });

  it('should escape special characters in titles', () => {
    const chapters = [
      { title: 'Tom & Jerry\'s Adventure', content: '', page: 1 }
    ];
    const ncx = getTOCNCXFromChapters('Title', chapters);
    assert.ok(ncx.includes('Tom &amp; Jerry'));
  });
});
