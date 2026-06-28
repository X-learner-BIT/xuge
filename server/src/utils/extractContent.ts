import fs from 'fs/promises';
import { inflate } from 'zlib';
import { promisify } from 'util';
import JSZip from 'jszip';

const inflateAsync = promisify(inflate);

export interface ExtractedContent {
  text: string;
  images: Buffer[];
  isScannedPdf: boolean;
}

export async function extractContent(filePath: string, contentType: string): Promise<ExtractedContent> {
  if (contentType === 'pdf') {
    return extractPdfContent(filePath);
  }
  if (contentType === 'docx') {
    return extractDocxContent(filePath);
  }
  return { text: '', images: [], isScannedPdf: false };
}

async function extractPdfContent(filePath: string): Promise<ExtractedContent> {
  const buffer = await fs.readFile(filePath);

  // 1. 提取文本（pdf-parse 有测试文件读取的 bug，需绕过）
  let data: any;
  try {
    process.env.PDF_PARSER_TEST_FILE = 'dummy';
    const pdfParse = (await import('pdf-parse')).default;
    data = await pdfParse(buffer);
  } catch (err: any) {
    console.error('[Extract] pdf-parse failed:', err?.message || err);
    // pdf-lib 降级会产生垃圾数据，直接返回空文本
    data = { text: '' };
  }
  const text = (data?.text || '').trim();

  // 2. 检测是否是扫描版（综合文本长度和文件大小判断）
  const fileSize = buffer.length;
  const isScannedPdf = text.length < 50 && fileSize > 500 * 1024;
  if (text.length < 50 && fileSize <= 500 * 1024) {
    console.log(`[Extract] Short document detected: ${text.length} chars, ${Math.round(fileSize / 1024)}KB. Not scanned PDF.`);
  }

  // 3. 提取嵌入图片（仅非扫描版时尝试）
  let images: Buffer[] = [];
  if (!isScannedPdf) {
    images = await extractPdfImages(buffer);
  }

  return { text, images, isScannedPdf };
}

async function extractPdfImages(buffer: Buffer): Promise<Buffer[]> {
  try {
    const { PDFDocument, PDFName } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.load(buffer);
    const images: Buffer[] = [];

    for (let i = 0; i < pdfDoc.getPageCount(); i++) {
      const page = pdfDoc.getPage(i);
      const node: any = page.node;
      const resources = node.Resources ? node.Resources() : null;
      if (!resources) continue;

      const xObjects = resources.lookup(PDFName.of('XObject'));
      if (!xObjects) continue;

      const dict = xObjects as any;
      const entries = typeof dict.entries === 'function' ? dict.entries() : Object.entries(dict);

      for (const [, ref] of entries) {
        try {
          const obj = dict.lookup ? dict.lookup(ref) : ref;
          if (!obj || !obj.dict) continue;

          const subtype = obj.dict.lookup(PDFName.of('Subtype'));
          if (subtype !== PDFName.of('Image')) continue;

          const width = obj.dict.lookup(PDFName.of('Width'));
          const height = obj.dict.lookup(PDFName.of('Height'));
          const w = width?.numberValue ?? 0;
          const h = height?.numberValue ?? 0;

          // 跳过太小的图片（图标、装饰线）
          if (w < 80 || h < 80) continue;

          const filter = obj.dict.lookup(PDFName.of('Filter'));
          let rawData: Uint8Array | undefined;

          if (filter === PDFName.of('DCTDecode')) {
            // JPEG 格式，数据已经是标准 JPEG
            rawData = obj.getContents ? obj.getContents() : obj.contents;
          } else if (filter === PDFName.of('FlateDecode')) {
            // FlateDecode 可能是 PNG 或原始像素数据，尝试解压并检测 PNG 头
            try {
              const rawCompressed = obj.getContents ? obj.getContents() : obj.contents;
              if (!rawCompressed) continue;
              const decompressed = await inflateAsync(Buffer.from(rawCompressed));
              // 检测 PNG 格式签名：89 50 4E 47 0D 0A 1A 0A
              const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
              if (decompressed.slice(0, 8).equals(pngSignature)) {
                rawData = decompressed;
              } else {
                continue; // 非 PNG 的原始像素数据，暂不支持
              }
            } catch {
              continue;
            }
          } else if (
            filter === PDFName.of('JPXDecode') ||
            filter === PDFName.of('JBIG2Decode')
          ) {
            // 复杂格式，暂时跳过
            continue;
          } else {
            // 无 filter 或其他情况，尝试直接读取
            rawData = obj.getContents ? obj.getContents() : obj.contents;
          }

          if (rawData && rawData.length > 2000) {
            images.push(Buffer.from(rawData));
          }
        } catch {
          // 跳过有问题的图片对象
        }
      }
    }

    // 限制图片数量，避免 API 调用过大
    return images.slice(0, 20);
  } catch (err) {
    console.error('[Extract] PDF image extraction failed:', err);
    return [];
  }
}

async function extractDocxContent(filePath: string): Promise<ExtractedContent> {
  const buffer = await fs.readFile(filePath);

  // 检测文件签名：.docx 是 ZIP 格式（50 4B 03 04），.doc 是 OLE 格式（D0 CF 11 E0）
  const sig = buffer.slice(0, 4).toString('hex').toUpperCase();
  const isActualDocx = sig === '504B0304';
  const isActualDoc = sig === 'D0CF11E0';

  if (isActualDoc) {
    // 旧版 .doc 格式，mammoth 不支持
    return {
      text: '【格式不支持】检测到该文件为旧版 Word 格式（.doc），系统暂不支持自动解析。建议将文件另存为 .docx 格式后重新上传。',
      images: [],
      isScannedPdf: false,
    };
  }

  if (!isActualDocx) {
    // 既不是 .docx 也不是 .doc 的奇怪文件
    return {
      text: '【格式异常】无法识别该文件的格式，请确保上传的是有效的 PDF 或 Word（.docx）文件。',
      images: [],
      isScannedPdf: false,
    };
  }

  try {
    // 1. 提取 HTML（保留表格结构），再转为纯文本
    const mammoth = await import('mammoth');
    const htmlResult = await mammoth.convertToHtml({ buffer });
    const text = htmlToPlainText(htmlResult.value);

    // 2. 提取嵌入图片
    const images = await extractDocxImages(buffer);

    return { text, images, isScannedPdf: false };
  } catch (err: any) {
    console.error('[Extract] DOCX parsing failed:', err?.message || err);
    return {
      text: `【解析失败】无法读取该 Word 文件的内容：${err?.message || '未知错误'}。请检查文件是否损坏，或尝试转换为 PDF 后上传。`,
      images: [],
      isScannedPdf: false,
    };
  }
}

function htmlToPlainText(html: string): string {
  return (
    html
      // 保留段落和标题结构
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      // 保留表格结构：单元格用制表符分隔，行用换行
      .replace(/<\/td>/gi, '\t')
      .replace(/<\/th>/gi, '\t')
      .replace(/<\/tr>/gi, '\n')
      // 列表项
      .replace(/<\/li>/gi, '\n')
      // 移除剩余标签
      .replace(/<[^>]+>/g, '')
      // 解码 HTML 实体
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      // 清理多余空行
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

async function extractDocxImages(buffer: Buffer): Promise<Buffer[]> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const images: Buffer[] = [];

    for (const [path, file] of Object.entries(zip.files)) {
      if (path.startsWith('word/media/') && !file.dir) {
        const ext = path.split('.').pop()?.toLowerCase() || '';
        // 只处理常见图片格式
        if (!['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext)) continue;

        const data = await file.async('nodebuffer');
        // 跳过过小的图片（可能是图标、装饰线）
        if (data.length > 3000) {
          images.push(data);
        }
      }
    }

    // 限制图片数量
    return images.slice(0, 20);
  } catch (err) {
    console.error('[Extract] DOCX image extraction failed:', err);
    return [];
  }
}
