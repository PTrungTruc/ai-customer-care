import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

export async function loadFileContent(buffer: Buffer, type: string): Promise<string> {
  try {
    let rawText = "";

    // 1. Xử lý PDF (Đã sửa lỗi bị dấu cách)
    if (type === 'application/pdf' || type.endsWith('.pdf')) {
      // Dùng chế độ mặc định của pdf-parse (Nó tự động tính toán khoảng cách để ghép chữ)
      const data = await pdf(buffer); 
      rawText = data.text;
    } 
    // 2. Xử lý Word (.docx)
    else if (
      type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      type.endsWith('.docx')
    ) {
      const result = await mammoth.extractRawText({ buffer: buffer });
      rawText = result.value || "";
    } 
    // 3. Xử lý Excel
    else if (type.includes('spreadsheet') || type.endsWith('.xlsx')) {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      workbook.SheetNames.forEach(sheet => {
        const row = XLSX.utils.sheet_to_csv(workbook.Sheets[sheet]);
        rawText += row + '\n';
      });
    }
    // 4. File Text
    else {
      rawText = buffer.toString('utf-8');
    }

    return cleanText(rawText);

  } catch (error) {
    console.error("Lỗi đọc file:", error);
    return "";
  }
}

// HÀM DỌN RÁC THÔNG MINH
function cleanText(text: string): string {
  if (!text) return "";

  return text
    // Xóa các trang số kiểu "1 | 5", "Trang 1" thường xuất hiện ở header/footer PDF
    .replace(/\d+\s*\|\s*\d+/g, '') 
    .replace(/Trang\s+\d+/gi, '')
    
    // Xóa dấu chấm thừa (.......) hay gạch (_____) thường dùng trong form
    .replace(/\.{3,}/g, '')
    .replace(/_{3,}/g, '')

    // QUAN TRỌNG: Gộp nhiều dòng trống thành 1 dòng (giữ cấu trúc đoạn văn)
    .replace(/\n\s*\n/g, '\n\n')
    
    // Gộp nhiều khoảng trắng thành 1 (fix lỗi dính chữ hoặc giãn chữ quá đà)
    .replace(/[ \t]+/g, ' ')
    
    .trim();
}