export type SheetEntry = {
  type: 'spending';
  occurredAt: string;
  amount: number;
  description: string;
  status: 'spent' | 'requested' | 'claimed';
};

export type VatCollectedEntry = {
  type: 'vatCollected';
  occurredAt: string;
  amount: number;
};

export type VatLogItem = {
  id: string;
  date: string;
  amount: number;
};

export type SheetLogItem = {
  id: string;
  date: string;
  amount: number;
  description?: string;
  status?: 'spent' | 'requested' | 'claimed';
};

export type SheetLogResponse = {
  total?: number;
  spending?: SheetLogItem[];
  vat?: VatLogItem[];
};

const endpoint = import.meta.env.VITE_SHEET_WEBAPP_URL;

// Helper function to handle API responses
async function handleApiResponse(response: Response, defaultError: string): Promise<any> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  if (!response.ok) {
    const message = isJson 
      ? (await response.json().catch(() => ({}))).error || defaultError
      : await response.text().catch(() => defaultError);
    throw new Error(message);
  }

  if (!isJson) {
    const text = await response.text();
    if (text.includes('<html>') || text.includes('<!DOCTYPE')) {
      throw new Error('Apps Script returned HTML error. Check script and deployment.');
    }
    return {};
  }

  return response.json().catch(() => ({}));
}

export async function logEntry(entry: SheetEntry) {
  if (!endpoint) {
    throw new Error('Missing Google Sheet webhook URL (VITE_SHEET_WEBAPP_URL).');
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain'
    },
    body: JSON.stringify(entry)
  });

  return handleApiResponse(response, 'Failed to log transaction.');
}

export async function logVatCollected(entry: VatCollectedEntry) {
  if (!endpoint) {
    throw new Error('Missing Google Sheet webhook URL (VITE_SHEET_WEBAPP_URL).');
  }

  const payload = { ...entry };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain'
    },
    body: JSON.stringify(payload)
  });

  return handleApiResponse(response, 'Failed to log VAT collected record.');
}

export async function fetchVatCollected(limit: number = 50): Promise<VatLogItem[]> {
  if (!endpoint) {
    throw new Error('Missing Google Sheet webhook URL (VITE_SHEET_WEBAPP_URL).');
  }

  const url = new URL(endpoint);
  url.searchParams.set('vatCollected', 'true');
  url.searchParams.set('limit', String(limit));

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'text/plain' }
  });

  const data = await handleGetApiResponseWithTextCheck(response, 'Failed to fetch VAT collected records.');
  return Array.isArray(data.vat) ? data.vat : [];
}

export async function deleteEntry(id: string, type: "spending" | "vatCollected") {
  if (!endpoint) {
    throw new Error('Missing Google Sheet webhook URL (VITE_SHEET_WEBAPP_URL).');
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain'
    },
    body: JSON.stringify({ action: 'delete', id, type })
  });

  return handleApiResponse(response, 'Failed to delete entry.');
}

export async function updateEntryStatus(id: string, type: SheetEntry['type'], status: 'spent' | 'requested' | 'claimed') {
  if (!endpoint) {
    throw new Error('Missing Google Sheet webhook URL (VITE_SHEET_WEBAPP_URL).');
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain'
    },
    body: JSON.stringify({ action: 'updateStatus', id, type, status })
  });

  return handleApiResponse(response, 'Failed to update status.');
}

// Helper function to handle GET API responses with JSON parsing
async function handleGetApiResponse(response: Response, defaultError: string): Promise<any> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  if (!response.ok) {
    const message = isJson 
      ? (await response.json().catch(() => ({}))).error || defaultError
      : await response.text().catch(() => defaultError);
    throw new Error(message);
  }

  if (!isJson) {
    const text = await response.text();
    if (text.includes('<html>') || text.includes('<!DOCTYPE')) {
      throw new Error('Apps Script returned HTML error. Check script and deployment.');
    }
    throw new Error('Invalid response from server.');
  }

  return response.json();
}

export async function fetchTotal(): Promise<number> {
  if (!endpoint) {
    throw new Error('Missing Google Sheet webhook URL (VITE_SHEET_WEBAPP_URL).');
  }

  const url = new URL(endpoint);
  url.searchParams.set('total', 'true');

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'text/plain' }
  });

  const data = await handleGetApiResponse(response, 'Failed to fetch total.');
  return typeof data.total === 'number' ? data.total : 0;
}

export type OverallTotals = {
  totalPaid: number;
  totalClaimed: number;
  remaining: number;
};

export type MonthlyTotals = {
  totalPaid: number;
  totalClaimed: number;
  remaining: number;
};

export type AvailableMonth = {
  monthYear: string; // Format: "Jan / 2024"
  month: number; // 0-11
  year: number;
};

export async function fetchOverallTotals(): Promise<OverallTotals> {
  if (!endpoint) {
    throw new Error('Missing Google Sheet webhook URL (VITE_SHEET_WEBAPP_URL).');
  }

  const url = new URL(endpoint);
  url.searchParams.set('overallTotals', 'true');

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'text/plain' }
  });

  const data = await handleGetApiResponse(response, 'Failed to fetch overall totals.');
  return {
    totalPaid: typeof data.totalPaid === 'number' ? data.totalPaid : 0,
    totalClaimed: typeof data.totalClaimed === 'number' ? data.totalClaimed : 0,
    remaining: typeof data.remaining === 'number' ? data.remaining : 0,
  };
}

// Helper function to handle GET responses that may return HTML errors
async function handleGetApiResponseWithTextCheck(response: Response, defaultError: string): Promise<any> {
  // Read response as text first to check if it's HTML
  const text = await response.text().catch(() => '');
  
  // Check if response is HTML error page
  if (text.includes('<html>') || text.includes('<!DOCTYPE') || text.includes('Lỗi')) {
    throw new Error('Apps Script returned HTML error. Ensure deployment is set to "Who has access: Anyone" and script has no errors.');
  }

  if (!response.ok) {
    try {
      const json = JSON.parse(text);
      throw new Error(json.error || defaultError);
    } catch {
      throw new Error(text || defaultError);
    }
  }

  // Try to parse as JSON
  try {
    const json = JSON.parse(text);
    return json;
  } catch (e) {
    throw new Error('Invalid JSON response from server: ' + text.substring(0, 100));
  }
}

export async function fetchLogsByDateRange(dateFrom: string, dateTo: string): Promise<SheetLogResponse> {
  if (!endpoint) {
    throw new Error('Missing Google Sheet webhook URL (VITE_SHEET_WEBAPP_URL).');
  }

  const url = new URL(endpoint);
  url.searchParams.set('dateFrom', dateFrom);
  url.searchParams.set('dateTo', dateTo);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'text/plain' }
  });

  return handleGetApiResponseWithTextCheck(response, 'Failed to fetch logs by date range.');
}

export async function fetchRecentItems(limit: number = 10): Promise<SheetLogResponse> {
  if (!endpoint) {
    throw new Error('Missing Google Sheet webhook URL (VITE_SHEET_WEBAPP_URL).');
  }

  const url = new URL(endpoint);
  url.searchParams.set('recent', 'true');
  url.searchParams.set('limit', String(limit));

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'text/plain' }
  });

  return handleGetApiResponseWithTextCheck(response, 'Failed to fetch recent items.');
}

export async function fetchAvailableMonths(): Promise<AvailableMonth[]> {
  if (!endpoint) {
    throw new Error('Missing Google Sheet webhook URL (VITE_SHEET_WEBAPP_URL).');
  }

  const url = new URL(endpoint);
  url.searchParams.set('availableMonths', 'true');

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'text/plain' }
  });

  const data = await handleGetApiResponseWithTextCheck(response, 'Failed to fetch available months.');
  
  if (Array.isArray(data.months)) {
    return data.months;
  } else if (Array.isArray(data)) {
    // Handle case where API returns array directly
    return data;
  }
  return [];
}

export async function fetchMonthlyTotals(monthYear: string): Promise<MonthlyTotals> {
  if (!endpoint) {
    throw new Error('Missing Google Sheet webhook URL (VITE_SHEET_WEBAPP_URL).');
  }

  const url = new URL(endpoint);
  url.searchParams.set('monthlyTotals', 'true');
  url.searchParams.set('monthYear', monthYear);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'text/plain' }
  });

  const data = await handleGetApiResponseWithTextCheck(response, 'Failed to fetch monthly totals.');
  return {
    totalPaid: typeof data.totalPaid === 'number' ? data.totalPaid : 0,
    totalClaimed: typeof data.totalClaimed === 'number' ? data.totalClaimed : 0,
    remaining: typeof data.remaining === 'number' ? data.remaining : 0,
  };
}
