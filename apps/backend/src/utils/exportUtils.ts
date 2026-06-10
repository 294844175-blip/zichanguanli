import { Parser } from 'json2csv';
import { Response } from 'express';

export interface ExportConfig {
  data: any[];
  headers: Record<string, string>;
  excludeFields?: string[];
  filename: string;
}

function flattenObject(obj: any, prefix = ''): any {
  const result: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      Object.assign(result, flattenObject(value, newKey));
    } else if (Array.isArray(value)) {
      result[newKey] = JSON.stringify(value);
    } else if (value instanceof Date) {
      result[newKey] = value.toISOString().split('T')[0] + ' ' + value.toTimeString().split(' ')[0];
    } else {
      result[newKey] = value ?? '';
    }
  }
  
  return result;
}

export function exportToCSV(res: Response, config: ExportConfig) {
  const { data, headers, excludeFields = [], filename } = config;

  const processedData = data.map(item => {
    const flat = flattenObject(item);
    const filtered: any = {};
    
    for (const [key, label] of Object.entries(headers)) {
      if (!excludeFields.includes(key)) {
        filtered[label] = flat[key] ?? flat[label] ?? '';
      }
    }
    
    return filtered;
  });

  const fields = Object.values(headers).filter(h => !excludeFields.includes(Object.keys(headers).find(k => headers[k] === h) || ''));
  
  const parser = new Parser({ fields });
  const csv = parser.parse(processedData);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}.csv"`);
  res.setHeader('Cache-Control', 'must-revalidate, post-check=0, pre-check=0');
  
  res.send('\uFEFF' + csv);
}
