export type SheetEntry = {
  type: 'spending' | 'receiving';
  occurredAt: string;
  amount: number;
  description: string;
};

export type SheetLogItem = {
  id: string;
  date: string;
  amount: number;
  description?: string;
};

export type SheetLogResponse = {
  total?: number;
  spending?: SheetLogItem[];
  receiving?: SheetLogItem[];
};

const endpoint = import.meta.env.VITE_SHEET_WEBAPP_URL;

export async function logEntry(entry: SheetEntry) {
  if (!endpoint) {
    throw new Error('Thiếu URL webhook Google Sheet (VITE_SHEET_WEBAPP_URL).');
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain'
    },
    body: JSON.stringify(entry)
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  if (!response.ok) {
    const message = isJson 
      ? (await response.json().catch(() => ({}))).error || 'Ghi nhận giao dịch không thành công.'
      : await response.text().catch(() => 'Ghi nhận giao dịch không thành công.');
    throw new Error(message);
  }

  if (!isJson) {
    const text = await response.text();
    if (text.includes('<html>') || text.includes('<!DOCTYPE')) {
      throw new Error('Apps Script trả về lỗi HTML. Kiểm tra lại script và deployment.');
    }
    return {};
  }

  return response.json().catch(() => ({}));
}

export async function deleteEntry(id: string, type: SheetEntry['type']) {
  if (!endpoint) {
    throw new Error('Thiếu URL webhook Google Sheet (VITE_SHEET_WEBAPP_URL).');
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain'
    },
    body: JSON.stringify({ action: 'delete', id, type })
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  if (!response.ok) {
    const message = isJson 
      ? (await response.json().catch(() => ({}))).error || 'Xóa không thành công.'
      : await response.text().catch(() => 'Xóa không thành công.');
    throw new Error(message);
  }

  if (!isJson) {
    const text = await response.text();
    if (text.includes('<html>') || text.includes('<!DOCTYPE')) {
      throw new Error('Apps Script trả về lỗi HTML. Kiểm tra lại script và deployment.');
    }
    return {};
  }

  return response.json().catch(() => ({}));
}

export async function fetchLogsByDate(date: string): Promise<SheetLogResponse> {
  if (!endpoint) {
    throw new Error('Thiếu URL webhook Google Sheet (VITE_SHEET_WEBAPP_URL).');
  }

  const url = new URL(endpoint);
  url.searchParams.set('date', date);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'text/plain' }
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  if (!response.ok) {
    const message = isJson 
      ? (await response.json().catch(() => ({}))).error || 'Không thể lấy log theo ngày.'
      : await response.text().catch(() => 'Không thể lấy log theo ngày.');
    throw new Error(message);
  }

  if (!isJson) {
    const text = await response.text();
    if (text.includes('<html>') || text.includes('<!DOCTYPE')) {
      throw new Error('Apps Script trả về lỗi HTML. Kiểm tra lại script và deployment.');
    }
    throw new Error('Phản hồi không hợp lệ từ server.');
  }

  return response.json();
}
