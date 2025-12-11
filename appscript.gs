// ===== Config =====

const SHEET_ID = '19mW4uE0jLgrNGNq6GKmA3sZFuWs_dSdA-sN4oRnoBUg';

const OVERALL_SHEET = 'Overall';

const PAYMENT_SHEET = 'Payments';

// ===== Helpers =====

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheets_() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    return {
      overall: ss.getSheetByName(OVERALL_SHEET),
      payment: ss.getSheetByName(PAYMENT_SHEET)
    };
  } catch (e) {
    throw new Error('Cannot open sheet: ' + e.toString());
  }
}

function ensureHeaders_(sheet, headers) {
  const headerRow = sheet.getRange(1, 1, 1, headers.length);
  const existingHeaders = headerRow.getValues()[0];
  const needsUpdate = existingHeaders.some((h, i) => String(h).trim() !== headers[i]);
  
  if (needsUpdate || existingHeaders[0] === '') {
    headerRow.setValues([headers]);
    headerRow.setFontWeight('bold');
  }
}

function ensurePaymentSheet_(paymentSheet) {
  const headers = ['ID', 'Date', 'Category', 'How much', 'Status', 'Created Date'];
  ensureHeaders_(paymentSheet, headers);
}

function ensureOverallSheet_(overallSheet) {
  const headers = ['Month / Year', 'Total Payment By Month', 'Total Claimed Payment', 'Remaining'];
  ensureHeaders_(overallSheet, headers);
}

function toDDMMYYYY_(v) {
  try {
    if (Object.prototype.toString.call(v) === '[object Date]') {
      const day = String(v.getDate()).padStart(2, '0');
      const month = String(v.getMonth() + 1).padStart(2, '0');
      const year = v.getFullYear();
      return day + '/' + month + '/' + year;
    }
    const str = String(v || '');
    if (str.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parts = str.split('-');
      return parts[2] + '/' + parts[1] + '/' + parts[0];
    }
    return str;
  } catch (e) {
    return String(v || '');
  }
}

function getMonthYearKey_(date) {
  const d = date instanceof Date ? date : new Date(date);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return month + ' / ' + year;
}

function dateInRange_(dateValue, dateFrom, dateTo) {
  if (!dateFrom && !dateTo) return true;
  try {
    const dateObj = dateValue instanceof Date ? dateValue : new Date(dateValue);
    const fromObj = dateFrom ? new Date(dateFrom) : null;
    const toObj = dateTo ? new Date(dateTo) : null;
    
    if (fromObj && dateObj < fromObj) return false;
    if (toObj) {
      const toEnd = new Date(toObj);
      toEnd.setHours(23, 59, 59, 999);
      if (dateObj > toEnd) return false;
    }
    return true;
  } catch (e) {
    return true;
  }
}

function isRowEmpty_(row) {
  if (!row[0] || String(row[0]).trim() === '') return true;
  // For date, check if it's a Date object or a non-empty string
  const hasDate = row[1] && (row[1] instanceof Date || String(row[1]).trim() !== '');
  const hasCategory = row[2] && String(row[2]).trim() !== '';
  const hasAmount = row[3] && Number(row[3]) !== 0;
  return !hasDate && !hasCategory && !hasAmount;
}

function updateOverallSheet_(overallSheet, paymentSheet) {
  try {
    // Get all payment data
    const paymentData = paymentSheet.getDataRange().getValues().slice(1); // Skip header
    console.log('Total payment rows:', paymentData.length);
    
    // Group by month/year
    const monthData = {};
    let processedCount = 0;
    let skippedCount = 0;
    let emptyRowCount = 0;
    
    paymentData.forEach((row, index) => {
      // Log every row for first 5 rows
      if (index < 5) {
        console.log('Processing row', index + 2, ':', {
          id: row[0],
          date: row[1],
          dateType: typeof row[1],
          isDate: row[1] instanceof Date,
          category: row[2],
          amount: row[3],
          status: row[4],
          isEmpty: isRowEmpty_(row)
        });
      }
      
      if (isRowEmpty_(row)) {
        emptyRowCount++;
        if (index < 5) console.log('Row', index + 2, 'is empty - skipping');
        skippedCount++;
        return;
      }
      
      const dateValue = row[1]; // Date column
      const amount = Number(row[3]) || 0; // How much column
      const status = String(row[4] || 'spent').toLowerCase(); // Status column
      
      // Log first few rows for debugging
      if (index < 5) {
        console.log('Row', index + 2, 'extracted - dateValue:', dateValue, 'type:', typeof dateValue, 'isDate:', dateValue instanceof Date, 'amount:', amount, 'status:', status);
      }
      
      if (!dateValue) {
        if (index < 5) console.log('Skipping row', index + 2, '- no date value');
        skippedCount++;
        return;
      }
      
      if (amount === 0) {
        if (index < 5) console.log('Skipping row', index + 2, '- amount is 0');
        skippedCount++;
        return;
      }
      
      // Try to parse date - handle both Date objects and string formats
      let dateObj = null;
      
      // Handle Date objects (most common case from Google Sheets)
      if (dateValue instanceof Date) {
        dateObj = dateValue;
      } 
      // Handle serial date numbers
      else if (typeof dateValue === 'number') {
        dateObj = new Date((dateValue - 25569) * 86400 * 1000);
      } 
      // Handle strings
      else {
        const dateStr = String(dateValue).trim();
        if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
          // Parse dd/MM/yyyy
          const parts = dateStr.split('/');
          dateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
          // Parse yyyy-MM-dd format
          dateObj = new Date(dateStr);
        } else {
          // Try standard date parsing
          dateObj = new Date(dateValue);
        }
      }
      
      // Validate date
      if (!dateObj || isNaN(dateObj.getTime())) {
        skippedCount++;
        return;
      }
      
      // Get month/year key
      const monthYear = getMonthYearKey_(dateObj);
      
      // Initialize month data if needed
      if (!monthData[monthYear]) {
        monthData[monthYear] = {
          total: 0,
          claimed: 0,
          remaining: 0
        };
      }
      
      // Update totals
      monthData[monthYear].total += amount;
      
      if (status === 'claimed') {
        monthData[monthYear].claimed += amount;
      } else {
        monthData[monthYear].remaining += amount;
      }
      
      processedCount++;
    });
    
    // Filter out months with no data (total = 0)
    const monthsWithData = Object.keys(monthData).filter(monthYear => monthData[monthYear].total > 0);
    
    // Sort months (newest first)
    const sortedMonths = monthsWithData.sort((a, b) => {
      // Parse month/year for comparison
      const parseMonthYear = (str) => {
        const parts = str.split(' / ');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames.indexOf(parts[0]);
        const year = parseInt(parts[1]);
        return new Date(year, month);
      };
      return parseMonthYear(b).getTime() - parseMonthYear(a).getTime();
    });
    
    // Clear existing data (keep header)
    const lastRow = overallSheet.getLastRow();
    if (lastRow > 1) {
      overallSheet.deleteRows(2, lastRow - 1);
    }
    
    // Write data to Overall sheet (only months with data)
    if (sortedMonths.length > 0) {
      const rows = sortedMonths.map(monthYear => [
        monthYear,
        monthData[monthYear].total,
        monthData[monthYear].claimed,
        monthData[monthYear].remaining
      ]);
      
      const range = overallSheet.getRange(2, 1, rows.length, 4);
      range.setValues(rows);
      
      // Format month/year column as TEXT to prevent Google Sheets from converting it to a date
      overallSheet.getRange(2, 1, rows.length, 1).setNumberFormat('@');
      
      // Format numbers
      overallSheet.getRange(2, 2, rows.length, 3).setNumberFormat('#,##0');
    }
  } catch (e) {
    console.error('Error in updateOverallSheet_:', e);
    throw e;
  }
}

function calculateTotalRemaining_() {
  const { overall } = getSheets_();
  ensureOverallSheet_(overall);
  
  const data = overall.getDataRange().getValues().slice(1); // Skip header
  let total = 0;
  
  data.forEach(row => {
    if (row[3] !== undefined && row[3] !== null && row[3] !== '') {
      total += Number(row[3]) || 0; // Remaining column (D)
    }
  });
  
  return total;
}

function calculateOverallTotals_() {
  const { overall } = getSheets_();
  ensureOverallSheet_(overall);
  
  const data = overall.getDataRange().getValues().slice(1); // Skip header
  let totalPaid = 0;
  let totalClaimed = 0;
  let remaining = 0;
  
  data.forEach(row => {
    // Column B: Total Payment By Month
    if (row[1] !== undefined && row[1] !== null && row[1] !== '') {
      totalPaid += Number(row[1]) || 0;
    }
    // Column C: Total Claimed Payment
    if (row[2] !== undefined && row[2] !== null && row[2] !== '') {
      totalClaimed += Number(row[2]) || 0;
    }
    // Column D: Remaining
    if (row[3] !== undefined && row[3] !== null && row[3] !== '') {
      remaining += Number(row[3]) || 0;
    }
  });
  
  return {
    totalPaid: totalPaid,
    totalClaimed: totalClaimed,
    remaining: remaining
  };
}

function getAvailableMonths_() {
  try {
    const { overall, payment } = getSheets_();
    ensureOverallSheet_(overall);
    ensurePaymentSheet_(payment);
    
    // Check if payment sheet has data
    const paymentData = payment.getDataRange().getValues().slice(1);
    console.log('Payment sheet rows:', paymentData.length);
    
    // Update overall sheet to ensure it has the latest data
    updateOverallSheet_(overall, payment);
    
    // Read the Overall sheet data
    const lastRow = overall.getLastRow();
    console.log('Overall sheet last row:', lastRow);
    
    if (lastRow <= 1) {
      console.log('Overall sheet is empty (only header)');
      return [];
    }
    
    const data = overall.getRange(2, 1, lastRow - 1, 4).getValues(); // Get all data rows
    console.log('Overall sheet data rows:', data.length);
    console.log('First few rows:', data.slice(0, 3));
    
    const months = [];
    
    data.forEach((row, index) => {
      let monthYear = row[0];
      
      // Handle Date objects - convert back to "Month / Year" format
      if (monthYear instanceof Date) {
        monthYear = getMonthYearKey_(monthYear);
      } else {
        monthYear = String(monthYear || '').trim();
      }
      
      if (monthYear && monthYear !== '' && monthYear !== 'Month / Year') {
        // Parse "Jan / 2024" format
        const parts = monthYear.split(' / ');
        if (parts.length === 2) {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const month = monthNames.indexOf(parts[0]);
          const year = parseInt(parts[1]);
          if (month >= 0 && !isNaN(year)) {
            months.push({
              monthYear: monthYear,
              month: month,
              year: year
            });
          } else {
            console.log('Invalid month/year format:', monthYear, 'month:', month, 'year:', year);
          }
        } else {
          console.log('Month/year doesn\'t have 2 parts:', monthYear);
        }
      }
    });
    
    console.log('Parsed months:', months.length);
    
    // Sort by year and month (newest first)
    months.sort((a, b) => {
      if (b.year !== a.year) {
        return b.year - a.year;
      }
      return b.month - a.month;
    });
    
    return months;
  } catch (e) {
    // Return empty array on error, but log it
    console.error('Error in getAvailableMonths_:', e.toString());
    return [];
  }
}

function getMonthlyTotals_(monthYear) {
  const { overall, payment } = getSheets_();
  ensureOverallSheet_(overall);
  ensurePaymentSheet_(payment);
  
  // Update overall sheet to ensure it has the latest data
  updateOverallSheet_(overall, payment);
  
  const data = overall.getDataRange().getValues().slice(1); // Skip header
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowMonthYear = String(row[0] || '').trim();
    if (rowMonthYear === monthYear) {
      return {
        totalPaid: Number(row[1]) || 0,
        totalClaimed: Number(row[2]) || 0,
        remaining: Number(row[3]) || 0
      };
    }
  }
  
  // Return zeros if month not found
  return {
    totalPaid: 0,
    totalClaimed: 0,
    remaining: 0
  };
}

// ===== POST (create + delete) =====

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    const { action, type, occurredAt, amount, description = '', id, status } = body;
    const { overall, payment } = getSheets_();

    ensurePaymentSheet_(payment);
    ensureOverallSheet_(overall);

    if (action === 'delete') {
      if (!id || !type) {
        return jsonOutput({ ok: false, error: 'Missing id or type' });
      }

      if (type === 'spending') {
        const dataRange = payment.getDataRange();
        const values = dataRange.getValues();
        
        // Find the row to delete (skip header row, start from index 1)
        for (let i = 1; i < values.length; i++) {
          if (String(values[i][0]) === id) {
            // deleteRow automatically shifts all rows below up
            payment.deleteRow(i + 1); // +1 because deleteRow uses 1-based indexing
            
            // Update overall sheet
            updateOverallSheet_(overall, payment);
            
            return jsonOutput({ ok: true, deleted: id });
          }
        }
        return jsonOutput({ ok: false, error: 'Record not found for deletion' });
      } else {
        return jsonOutput({ ok: false, error: 'Invalid type. Only spending is supported.' });
      }
    }

    if (action === 'updateStatus') {
      if (!id || !type || !status) {
        return jsonOutput({ ok: false, error: 'Missing id, type, or status' });
      }

      if (type === 'spending') {
        const dataRange = payment.getDataRange();
        const values = dataRange.getValues();
        
        // Find the row to update (skip header row, start from index 1)
        // Payment: A=ID, B=Date, C=Category, D=How much, E=Status, F=Created Date
        for (let i = 1; i < values.length; i++) {
          if (String(values[i][0]) === id) {
            // Update status in column E (index 4)
            payment.getRange(i + 1, 5).setValue(status);
            
            // Update overall sheet
            updateOverallSheet_(overall, payment);
            
            return jsonOutput({ ok: true, updated: id, status: status });
          }
        }
        return jsonOutput({ ok: false, error: 'Record not found for update' });
      } else {
        return jsonOutput({ ok: false, error: 'Invalid type. Only spending is supported.' });
      }
    }

    // create
    if (!type || !occurredAt || amount === undefined) {
      return jsonOutput({ ok: false, error: 'Missing required data' });
    }

    const uuid = Utilities.getUuid();
    const now = new Date(); // Creation timestamp
    const paymentStatus = status || 'spent';
    
    if (type === 'spending') {
      // Payment: A=ID, B=Date, C=Category, D=How much, E=Status, F=Created Date
      payment.appendRow([uuid, new Date(occurredAt), description, Number(amount), paymentStatus, now]);
      const row = payment.getLastRow();
      payment.getRange(row, 2).setNumberFormat('dd/MM/yyyy'); // Format date
      payment.getRange(row, 4).setNumberFormat('#,##0'); // Format amount
      payment.getRange(row, 6).setNumberFormat('dd/MM/yyyy HH:mm:ss'); // Format created date
      
      // Update overall sheet
      updateOverallSheet_(overall, payment);
    } else {
      return jsonOutput({ ok: false, error: 'Invalid type. Only spending is supported.' });
    }

    return jsonOutput({ ok: true, id: uuid });
  } catch (e) {
    return jsonOutput({ ok: false, error: 'Error: ' + e.toString() });
  }
}

// ===== GET (with total-only support, recent items, and empty row filtering) =====

function doGet(e) {
  try {
    // Check if only total is requested
    if (e.parameter.total === 'true' || e.parameter.total === '1') {
      const totalVal = calculateTotalRemaining_();
      return jsonOutput({ total: totalVal });
    }

    // Check if overall totals are requested
    if (e.parameter.overallTotals === 'true' || e.parameter.overallTotals === '1') {
      const totals = calculateOverallTotals_();
      return jsonOutput(totals);
    }

    // Check if available months are requested
    if (e.parameter.availableMonths === 'true' || e.parameter.availableMonths === '1') {
      try {
        const { payment } = getSheets_();
        const paymentData = payment.getDataRange().getValues().slice(1);
        const nonEmptyRows = paymentData.filter(row => !isRowEmpty_(row));
        
        // Get sample row data for debugging
        let sampleRow = null;
        if (nonEmptyRows.length > 0) {
          const firstRow = nonEmptyRows[0];
          sampleRow = {
            dateValue: firstRow[1],
            dateType: typeof firstRow[1],
            dateString: String(firstRow[1]),
            amount: firstRow[3],
            status: firstRow[4]
          };
        }
        
        const months = getAvailableMonths_();
        console.log('Returning months:', months.length, 'months');
        
        // Also return debug info if no months found
        if (months.length === 0) {
          return jsonOutput({ 
            months: months,
            debug: {
              paymentRows: paymentData.length,
              nonEmptyRows: nonEmptyRows.length,
              sampleRow: sampleRow,
              message: 'No months found. Check Apps Script execution logs for details.'
            }
          });
        }
        return jsonOutput({ months: months });
      } catch (err) {
        return jsonOutput({ 
          months: [],
          error: err.toString()
        });
      }
    }

    // Check if monthly totals are requested
    if (e.parameter.monthlyTotals === 'true' || e.parameter.monthlyTotals === '1') {
      const monthYear = (e.parameter.monthYear || '').trim();
      if (!monthYear) {
        return jsonOutput({ ok: false, error: 'Missing monthYear parameter' });
      }
      const totals = getMonthlyTotals_(monthYear);
      return jsonOutput(totals);
    }

    // Check if recent items are requested (by creation date)
    if (e.parameter.recent === 'true' || e.parameter.recent === '1') {
      const limit = parseInt(e.parameter.limit || '10', 10);
      const { payment } = getSheets_();
      ensurePaymentSheet_(payment);
      
      const totalVal = calculateTotalRemaining_();
      const paymentData = payment.getDataRange().getValues().slice(1);
      
      // Payment: A=ID, B=Date, C=Category, D=How much, E=Status, F=Created Date
      const spendingRows = paymentData
        .filter(r => !isRowEmpty_(r))
        .map((r) => {
          const dateValue = r[1]; // Transaction date
          const createdAtValue = r[5] || r[1]; // Created Date (fallback to transaction date for old rows)
          return {
            id: String(r[0] || ''),
            date: toDDMMYYYY_(dateValue),
            description: String(r[2] || ''),
            amount: Number(r[3] || 0),
            status: String(r[4] || 'spent'), // Status field, default to 'spent' for old rows
            _createdAt: createdAtValue instanceof Date ? createdAtValue : new Date(createdAtValue)
          };
        })
        .sort((a, b) => {
          return b._createdAt.getTime() - a._createdAt.getTime();
        })
        .slice(0, limit)
        .map(({ _createdAt, ...rest }) => rest);

      return jsonOutput({
        total: totalVal,
        spending: spendingRows
      });
    }

    // Otherwise, return logs with date range filtering (by creation date)
    const dateFrom = (e.parameter.dateFrom || '').trim();
    const dateTo = (e.parameter.dateTo || '').trim();
    const { payment } = getSheets_();
    ensurePaymentSheet_(payment);
    
    const totalVal = calculateTotalRemaining_();
    const paymentData = payment.getDataRange().getValues().slice(1);
    
    // Payment: A=ID, B=Date, C=Category, D=How much, E=Status, F=Created Date
    const spendingRows = paymentData
      .filter(r => !isRowEmpty_(r))
      .map((r) => {
        const dateValue = r[1]; // Transaction date (for display)
        const createdAtValue = r[5] || r[1]; // Created Date (fallback to transaction date for old rows)
        return {
          id: String(r[0] || ''),
          date: toDDMMYYYY_(dateValue),
          description: String(r[2] || ''),
          amount: Number(r[3] || 0),
          status: String(r[4] || 'spent'), // Status field, default to 'spent' for old rows
          _createdAt: createdAtValue instanceof Date ? createdAtValue : new Date(createdAtValue)
        };
      })
      .filter(r => dateInRange_(r._createdAt, dateFrom, dateTo))
      .map(({ _createdAt, ...rest }) => rest);

    return jsonOutput({
      total: totalVal,
      spending: spendingRows
    });
  } catch (e) {
    return jsonOutput({ ok: false, error: 'Error: ' + e.toString() });
  }
}

// Keep frontend requests simple (Content-Type: text/plain, no extra headers/credentials).
