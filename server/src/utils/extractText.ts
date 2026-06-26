import fs from 'fs/promises';

export async function extractTextFromFile(filePath: string, contentType: string): Promise<string> {
  try {
    if (contentType === 'pdf') {
      const pdfParse = (await import('pdf-parse')).default;
      const buffer = await fs.readFile(filePath);
      const data = await pdfParse(buffer);
      return data.text || '';
    }
    if (contentType === 'docx') {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || '';
    }
    return '';
  } catch (error) {
    console.error('提取文本失败:', error);
    return '';
  }
}
