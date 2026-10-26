/**
 * RFC 4180 Compliant CSV Parser & Serializer with Spreadsheet Formula Injection Defense
 */

export interface ParsedCSVRow {
  [key: string]: string;
}

/**
 * Sanitizes a field against Spreadsheet Formula Injection (CSV Injection).
 * Characters like =, +, -, @, \t, \r can trigger execution if opened in Excel or Google Sheets.
 * Prepending a single quote ' neutralizes the cell without corrupting text.
 */
export function sanitizeForSpreadsheet(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  const trimmed = str.trimStart();
  if (
    trimmed.startsWith('=') ||
    trimmed.startsWith('+') ||
    trimmed.startsWith('-') ||
    trimmed.startsWith('@') ||
    trimmed.startsWith('\t') ||
    trimmed.startsWith('\r')
  ) {
    return `'${str}`;
  }
  return str;
}

/**
 * Serializes an array of records into RFC 4180 CSV format.
 * Automatically wraps cells containing commas, quotes, or newlines in double-quotes,
 * escapes internal quotes as "", and applies spreadsheet injection protection.
 */
export function serializeToCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const sanitizeCell = (raw: string | number | null | undefined): string => {
    const safeStr = sanitizeForSpreadsheet(raw);
    if (safeStr.includes('"') || safeStr.includes(',') || safeStr.includes('\n') || safeStr.includes('\r')) {
      return `"${safeStr.replace(/"/g, '""')}"`;
    }
    return safeStr;
  };

  const headerLine = headers.map(sanitizeCell).join(',');
  const rowLines = rows.map((row) => row.map(sanitizeCell).join(','));
  return [headerLine, ...rowLines].join('\r\n');
}

/**
 * Robust RFC 4180 CSV Parser.
 * Properly handles quoted fields, escaped quotes (""), embedded commas, and embedded newlines.
 */
export function parseCSV(text: string): { headers: string[]; rows: ParsedCSVRow[] } {
  if (!text || !text.trim()) {
    return { headers: [], rows: [] };
  }

  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote: "" -> "
          currentField += '"';
          i++;
        } else {
          // Closing quote
          insideQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        // Handle \r or \r\n
        if (nextChar === '\n') {
          i++;
        }
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.some((f) => f.length > 0)) {
          lines.push(currentRow);
        }
        currentRow = [];
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.some((f) => f.length > 0)) {
          lines.push(currentRow);
        }
        currentRow = [];
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      lines.push(currentRow);
    }
  }

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = lines[0].map((h) => h.replace(/^'/, '').trim());
  const rows: ParsedCSVRow[] = [];

  for (let r = 1; r < lines.length; r++) {
    const line = lines[r];
    const rowObj: ParsedCSVRow = {};
    headers.forEach((h, colIdx) => {
      let rawVal = line[colIdx] ?? '';
      // Strip leading spreadsheet protection quote if present
      if (rawVal.startsWith("'")) {
        rawVal = rawVal.slice(1);
      }
      rowObj[h] = rawVal;
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}
