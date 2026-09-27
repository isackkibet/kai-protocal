import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * POST /api/studio/parse-pdf
 * Accepts a multipart/form-data request with a `file` field (PDF).
 * Returns extracted text blocks from the PDF byte stream using heuristic UTF-8 parsing.
 *
 * NOTE: Full PDF text extraction requires a library like pdf-parse or pdfjs-dist.
 * This route is intentionally structured so the heavy extraction happens server-side
 * and can be swapped in when the package is installed.
 * For now it returns a structured placeholder with the filename and size.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported.' }, { status: 400 });
    }

    const MAX_SIZE_MB = 10;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `File is too large. Max size is ${MAX_SIZE_MB}MB.` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Heuristic: extract readable ASCII/UTF-8 text runs from raw PDF bytes.
    // This works well for text-based PDFs. For scanned PDFs you'd need OCR.
    const extracted = extractTextFromPdfBytes(bytes);

    return NextResponse.json({
      success: true,
      filename: file.name,
      sizeBytes: file.size,
      charCount: extracted.length,
      text: extracted,
      method: 'heuristic-byte-extraction',
      note: extracted.length < 100
        ? 'Very little text extracted. This may be a scanned/image PDF. Try copy-pasting your content directly into the editor.'
        : null,
    });
  } catch (err: any) {
    console.error('[parse-pdf] Error:', err);
    return NextResponse.json(
      { error: 'Failed to parse PDF. Please try again or paste your content manually.' },
      { status: 500 }
    );
  }
}

/**
 * Heuristic text extraction from raw PDF bytes.
 * Extracts runs of printable ASCII characters, filters noise,
 * and reconstructs readable paragraphs.
 */
function extractTextFromPdfBytes(bytes: Uint8Array): string {
  const decoder = new TextDecoder('latin1');
  const raw = decoder.decode(bytes);

  const textBlocks: string[] = [];
  let currentBlock = '';

  for (let i = 0; i < raw.length; i++) {
    const code = raw.charCodeAt(i);
    // Printable ASCII range + newlines/tabs
    if ((code >= 32 && code <= 126) || code === 10 || code === 13 || code === 9) {
      currentBlock += raw[i];
    } else {
      if (currentBlock.trim().length > 3) {
        textBlocks.push(currentBlock.trim());
      }
      currentBlock = '';
    }
  }
  if (currentBlock.trim().length > 3) {
    textBlocks.push(currentBlock.trim());
  }

  // Join, clean up PDF syntax noise
  const joined = textBlocks
    .join(' ')
    .replace(/\(([^)]{1,500})\)/g, '$1') // PDF string literals (text)
    .replace(/BT\s+/g, '')
    .replace(/\s*ET\s*/g, '\n')
    .replace(/Tf\s+/g, '')
    .replace(/Td\s+/g, '\n')
    .replace(/Tj\s+/g, '')
    .replace(/TJ\s+/g, '')
    .replace(/\s{3,}/g, '  ')
    .replace(/([.!?])\s{2,}/g, '$1\n\n')
    .trim();

  // Further clean: remove PDF keywords that leaked through
  const pdfKeywords = /\b(stream|endstream|obj|endobj|xref|startxref|trailer|%%EOF|BT|ET|Tf|Td|Tj|TJ|Tm|cm|Do|BI|ID|EI|RG|rg|SCN|scn|CS|cs|G|g|K|k|W|n|S|s|f|h|m|l|c|v|y|re|q|Q|w|J|j|M|d|ri|i|gs)\b/g;
  const cleaned = joined.replace(pdfKeywords, '').replace(/\s{2,}/g, ' ').trim();

  return cleaned;
}
