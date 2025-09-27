// A simple CSV parser and exporter without external libraries

/**
 * Converts an array of objects to a CSV string.
 * @param data Array of objects.
 * @returns A string in CSV format.
 */
function arrayToCsv(data: Record<string, any>[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      const escaped = ('' + row[header]).replace(/"/g, '""'); // Escape double quotes
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  return csvRows.join('\n');
}

/**
 * Triggers a browser download for a CSV file.
 * @param filename The desired filename (e.g., 'data.csv').
 * @param data Array of objects to be converted to CSV.
 */
export function exportToCsv(filename: string, data: Record<string, any>[]): void {
  const csvString = arrayToCsv(data);
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Parses a CSV file into an array of objects.
 * @param file The CSV file from a file input.
 * @returns A promise that resolves to an array of objects.
 */
export function parseCsv(file: File): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r\n|\n/);
        if (lines.length < 2) {
          resolve([]);
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const result: Record<string, any>[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line) continue;
          
          const values = line.split(',');
          const obj: Record<string, any> = {};
          
          for (let j = 0; j < headers.length; j++) {
            const value = values[j]?.trim().replace(/^"|"$/g, '').replace(/""/g, '"');
            obj[headers[j]] = value;
          }
          result.push(obj);
        }
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
}
