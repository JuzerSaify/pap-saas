export function getInwardPreviewHtml(
  vNo: string,
  vDate: string,
  vAccount: string,
  vNarration: string,
  vItems: any[],
  origin: string
): string {
  const totalQtyVal = vItems.reduce((sum, item) => sum + item.quantity, 0)
  const totalCostVal = vItems.reduce((sum, item) => sum + item.costAmount, 0)

  return `
    <html>
      <head>
        <title>Preview</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #09090b;
            background: #ffffff;
          }
          .header-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #ffffff;
            color: #09090b;
            padding: 8px 16px;
            border-bottom: 1px solid #e4e4e7;
            user-select: none;
          }
          .app-title {
            display: flex;
            align-items: center;
            font-weight: 800;
            font-size: 11px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .app-icon {
            width: 16px;
            height: 16px;
            border-radius: 4px;
            margin-right: 8px;
          }
          .btn-group {
            display: flex;
            gap: 6px;
          }
          .btn {
            background: #09090b;
            color: #fff;
            border: none;
            padding: 5px 12px;
            font-size: 10px;
            font-weight: bold;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.15s ease;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .btn:hover {
            background: #27272a;
          }
          .btn-close {
            background: #e11d48;
            color: #fff;
            border: none;
            padding: 5px 10px;
            font-size: 10px;
            font-weight: bold;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.15s ease;
            margin-left: 8px;
            text-transform: uppercase;
          }
          .btn-close:hover {
            background: #be123c;
          }
          .doc-container {
            max-width: 100%;
            margin: 0;
            background: transparent;
            border: none;
            padding: 30px;
            box-shadow: none;
          }
          .doc-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
          }
          .company-name {
            font-size: 18px;
            font-weight: 800;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .company-sub {
            font-size: 10px;
            color: #71717a;
          }
          .voucher-info {
            text-align: right;
          }
          .voucher-no {
            font-size: 14px;
            font-weight: bold;
            color: #09090b;
          }
          .voucher-date {
            font-size: 11px;
            color: #71717a;
            margin-top: 2px;
          }
          .meta-grid {
            display: grid;
            grid-template-cols: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 25px;
            font-size: 11px;
          }
          .meta-card {
            background: #fafafa;
            padding: 12px;
            border: 1px solid #e4e4e7;
            border-radius: 6px;
          }
          .meta-label {
            font-size: 9px;
            text-transform: uppercase;
            color: #71717a;
            font-weight: 800;
            margin-bottom: 4px;
            letter-spacing: 0.5px;
          }
          .meta-val {
            font-weight: 600;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 11px;
          }
          th, td {
            border-bottom: 1px solid #e4e4e7;
            padding: 10px;
            text-align: left;
          }
          th {
            background: #fafafa;
            font-weight: 800;
            color: #71717a;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 0.5px;
          }
          .text-right {
            text-align: right;
          }
          .text-center {
            text-align: center;
          }
          .badge {
            display: inline-block;
            padding: 2px 6px;
            font-weight: bold;
            font-size: 9px;
            border-radius: 4px;
            border: 1px solid;
          }
          .badge-fresh {
            color: #16a34a;
            background: #f0fdf4;
            border-color: #bbf7d0;
          }
          .badge-damage {
            color: #dc2626;
            background: #fef2f2;
            border-color: #fecaca;
          }
          tfoot {
            font-weight: bold;
            background: #fafafa;
            border-top: 2px solid #e4e4e7;
          }
          .total-label {
            font-size: 9px;
            text-transform: uppercase;
            color: #71717a;
          }
          .total-val {
            font-size: 12px;
            color: #16a34a;
          }
          @media print {
            .header-bar {
              display: none;
            }
            body {
              background: #fff;
              padding: 0;
            }
            .doc-container {
              border: none;
              box-shadow: none;
              padding: 0;
              margin: 0;
              max-width: 100%;
            }
          }
        </style>
      </head>
      <body>
        <div class="header-bar" style="-webkit-app-region: drag;">
          <div class="app-title">
            <img class="app-icon" src="${origin}/favicon.png" />
            <span>Preview</span>
          </div>
          <div class="btn-group" style="-webkit-app-region: no-drag;">
            <button class="btn btn-primary" onclick="window.print()">Print</button>
            <button class="btn" onclick="window.print()">PDF</button>
            <button class="btn" onclick="exportToExcel()">Excel</button>
            <button class="btn-close" onclick="window.close()">✕</button>
          </div>
        </div>

        <div class="doc-container">
          <div class="doc-header">
            <div>
              <div class="company-name">PAPSoft ERP</div>
              <div class="company-sub">Paper Packaging Mill Management System</div>
            </div>
            <div class="voucher-info">
              <div class="voucher-no">${vNo}</div>
              <div class="voucher-date">Date: ${vDate}</div>
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-card">
              <div class="meta-label">Received From (Account)</div>
              <div class="meta-val">${vAccount}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Narration / Remarks</div>
              <div class="meta-val">${vNarration}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Item Name</th>
                <th>Lot No</th>
                <th>Condition</th>
                <th>Location</th>
                <th>Size (WxL)</th>
                <th>GSM</th>
                <th>Pcs/Items</th>
                <th>UOM</th>
                <th class="text-right">Quantity</th>
                <th class="text-right">Rate</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${vItems.map(item => `
                <tr>
                  <td style="font-weight: 600; color: #71717a;">${item.itemCode}</td>
                  <td style="font-weight: 600;">${item.productName}</td>
                  <td>${item.lotNo}</td>
                  <td>
                    <span class="badge ${item.condition === 'Fresh' ? 'badge-fresh' : 'badge-damage'}">
                      ${item.condition}
                    </span>
                  </td>
                  <td>${item.location || '-'}</td>
                  <td>${item.width} x ${item.length}</td>
                  <td>${item.gsm}</td>
                  <td>${item.noOfItem}</td>
                  <td style="text-transform: uppercase; font-weight: bold;">${item.uom}</td>
                  <td class="text-right" style="font-weight: bold;">${item.quantity.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                  <td class="text-right" style="color: #71717a;">${item.costRate.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                  <td class="text-right" style="font-weight: bold; color: #16a34a;">PKR ${item.costAmount.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="9" class="total-label">Total Inward Details</td>
                <td class="text-right" style="font-weight: bold;">${totalQtyVal.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                <td></td>
                <td class="text-right total-val">PKR ${totalCostVal.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <script>
          function exportToExcel() {
            const rows = [
              ["Item Code", "Item Name", "Lot No", "Condition", "Location", "Width", "Length", "GSM", "Items/Pcs", "UOM", "Quantity", "Rate", "Amount"],
              ${vItems.map(item => `[
                "${item.itemCode}",
                "${item.productName}",
                "${item.lotNo}",
                "${item.condition}",
                "${item.location || '-'}",
                "${item.width}",
                "${item.length}",
                "${item.gsm}",
                "${item.noOfItem}",
                "${item.uom}",
                "${item.quantity}",
                "${item.costRate}",
                "${item.costAmount}"
              ]`).join(',\n')}
            ];
            let csvContent = "data:text/csv;charset=utf-8," 
              + rows.map(e => e.map(val => '"' + String(val).replace(/"/g, '""') + '"').join(",")).join("\\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "${vNo}.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        </script>
      </body>
    </html>
  `
}

export function getTransferPreviewHtml(
  vNo: string,
  vDate: string,
  vNarration: string,
  vItems: any[],
  origin: string
): string {
  const totalQtyVal = vItems.reduce((sum, item) => sum + item.quantity, 0)
  const totalCostVal = vItems.reduce((sum, item) => sum + item.costAmount, 0)

  return `
    <html>
      <head>
        <title>Preview</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #09090b;
            background: #ffffff;
          }
          .header-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #ffffff;
            color: #09090b;
            padding: 8px 16px;
            border-bottom: 1px solid #e4e4e7;
            user-select: none;
          }
          .app-title {
            display: flex;
            align-items: center;
            font-weight: 800;
            font-size: 11px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .app-icon {
            width: 16px;
            height: 16px;
            border-radius: 4px;
            margin-right: 8px;
          }
          .btn-group {
            display: flex;
            gap: 6px;
          }
          .btn {
            background: #09090b;
            color: #fff;
            border: none;
            padding: 5px 12px;
            font-size: 10px;
            font-weight: bold;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.15s ease;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .btn:hover {
            background: #27272a;
          }
          .btn-close {
            background: #e11d48;
            color: #fff;
            border: none;
            padding: 5px 10px;
            font-size: 10px;
            font-weight: bold;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.15s ease;
            margin-left: 8px;
            text-transform: uppercase;
          }
          .btn-close:hover {
            background: #be123c;
          }
          .doc-container {
            max-width: 100%;
            margin: 0;
            background: transparent;
            border: none;
            padding: 30px;
            box-shadow: none;
          }
          .doc-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
          }
          .company-name {
            font-size: 18px;
            font-weight: 800;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .company-sub {
            font-size: 10px;
            color: #71717a;
          }
          .voucher-info {
            text-align: right;
          }
          .voucher-no {
            font-size: 14px;
            font-weight: bold;
            color: #09090b;
          }
          .voucher-date {
            font-size: 11px;
            color: #71717a;
            margin-top: 2px;
          }
          .meta-grid {
            display: grid;
            grid-template-cols: 1fr;
            gap: 12px;
            margin-bottom: 25px;
            font-size: 11px;
          }
          .meta-card {
            background: #fafafa;
            padding: 12px;
            border: 1px solid #e4e4e7;
            border-radius: 6px;
          }
          .meta-label {
            font-size: 9px;
            text-transform: uppercase;
            color: #71717a;
            font-weight: 800;
            margin-bottom: 4px;
            letter-spacing: 0.5px;
          }
          .meta-val {
            font-weight: 600;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 11px;
          }
          th, td {
            border-bottom: 1px solid #e4e4e7;
            padding: 10px;
            text-align: left;
          }
          th {
            background: #fafafa;
            font-weight: 800;
            color: #71717a;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 0.5px;
          }
          .text-right {
            text-align: right;
          }
          .text-center {
            text-align: center;
          }
          tfoot {
            font-weight: bold;
            background: #fafafa;
            border-top: 2px solid #e4e4e7;
          }
          .total-label {
            font-size: 9px;
            text-transform: uppercase;
            color: #71717a;
          }
          .total-val {
            font-size: 12px;
            color: #16a34a;
          }
          @media print {
            .header-bar {
              display: none;
            }
            body {
              background: #fff;
              padding: 0;
            }
            .doc-container {
              border: none;
              box-shadow: none;
              padding: 0;
              margin: 0;
              max-width: 100%;
            }
          }
        </style>
      </head>
      <body>
        <div class="header-bar" style="-webkit-app-region: drag;">
          <div class="app-title">
            <img class="app-icon" src="${origin}/favicon.png" />
            <span>Preview</span>
          </div>
          <div class="btn-group" style="-webkit-app-region: no-drag;">
            <button class="btn btn-primary" onclick="window.print()">Print</button>
            <button class="btn" onclick="window.print()">PDF</button>
            <button class="btn" onclick="exportToExcel()">Excel</button>
            <button class="btn-close" onclick="window.close()">✕</button>
          </div>
        </div>

        <div class="doc-container">
          <div class="doc-header">
            <div>
              <div class="company-name">PAPSoft ERP</div>
              <div class="company-sub">Paper Packaging Mill Management System</div>
            </div>
            <div class="voucher-info">
              <div class="voucher-no">${vNo}</div>
              <div class="voucher-date">Date: ${vDate}</div>
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-card">
              <div class="meta-label">Narration / Remarks</div>
              <div class="meta-val">${vNarration}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>New Item Code</th>
                <th>Source Item Code</th>
                <th>Item Name</th>
                <th>Lot No</th>
                <th>From Location</th>
                <th>To Location</th>
                <th>Size (WxL)</th>
                <th>GSM</th>
                <th>UOM</th>
                <th class="text-right">Quantity</th>
                <th class="text-right">Rate</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${vItems.map(item => `
                <tr>
                  <td style="font-weight: 600; color: #71717a;">${item.itemCode}</td>
                  <td style="color: #71717a;">${item.sourceItemCode}</td>
                  <td style="font-weight: 600;">${item.productName}</td>
                  <td>${item.lotNo}</td>
                  <td style="text-transform: uppercase;">${item.fromLocation}</td>
                  <td style="font-weight: 600; text-transform: uppercase;">${item.location}</td>
                  <td>${item.width} x ${item.length}</td>
                  <td>${item.gsm}</td>
                  <td style="text-transform: uppercase; font-weight: bold;">${item.uom}</td>
                  <td class="text-right" style="font-weight: bold;">${item.quantity.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                  <td class="text-right" style="color: #71717a;">${item.costRate.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                  <td class="text-right" style="font-weight: bold; color: #16a34a;">PKR ${item.costAmount.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="9" class="total-label">Total Transfer Details</td>
                <td class="text-right" style="font-weight: bold;">${totalQtyVal.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                <td></td>
                <td class="text-right total-val">PKR ${totalCostVal.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <script>
          function exportToExcel() {
            const rows = [
              ["New Item Code", "Source Item Code", "Item Name", "Lot No", "From Location", "To Location", "Width", "Length", "GSM", "UOM", "Quantity", "Rate", "Amount"],
              ${vItems.map(item => `[
                "${item.itemCode}",
                "${item.sourceItemCode}",
                "${item.productName}",
                "${item.lotNo}",
                "${item.fromLocation}",
                "${item.location}",
                "${item.width}",
                "${item.length}",
                "${item.gsm}",
                "${item.uom}",
                "${item.quantity}",
                "${item.costRate}",
                "${item.costAmount}"
              ]`).join(',\n')}
            ];
            let csvContent = "data:text/csv;charset=utf-8," 
              + rows.map(e => e.map(val => '"' + String(val).replace(/"/g, '""') + '"').join(",")).join("\\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "${vNo}.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        </script>
      </body>
    </html>
  `
}

export function getStockSearchHtml(origin: string): string {
  return `
    <html>
      <head>
        <title>Stock Search</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #09090b;
            background: #ffffff;
            font-size: 12px;
          }
          .header-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #ffffff;
            color: #09090b;
            padding: 10px 16px;
            border-bottom: 1px solid #e4e4e7;
            user-select: none;
          }
          .app-title {
            display: flex;
            align-items: center;
            font-weight: 800;
            font-size: 11px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .app-icon {
            width: 16px;
            height: 16px;
            border-radius: 4px;
            margin-right: 8px;
          }
          .win-controls {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .btn {
            background: #09090b;
            color: #ffffff;
            border: none;
            padding: 6px 14px;
            font-size: 10px;
            font-weight: bold;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.15s ease;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: none; /* Only show when item selected */
          }
          .btn:hover {
            background: #27272a;
          }
          .btn-close-win {
            background: #e11d48;
            color: #fff;
            border: none;
            padding: 6px 12px;
            font-size: 10px;
            font-weight: bold;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.15s ease;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .btn-close-win:hover {
            background: #be123c;
          }
          .filter-panel {
            background: #fff;
            border-bottom: 1px solid #e4e4e7;
            padding: 10px 16px;
            display: flex;
            flex-direction: row;
            gap: 10px;
            width: 100%;
            box-sizing: border-box;
          }
          .filter-panel > div {
            flex: 1;
            min-width: 0;
          }
          .filter-panel label {
            display: block;
            font-size: 8px;
            font-weight: 800;
            color: #71717a;
            text-transform: uppercase;
            margin-bottom: 3px;
            letter-spacing: 0.5px;
          }
          .filter-panel input {
            width: 100%;
            height: 28px;
            border: 1px solid #e4e4e7;
            border-radius: 4px;
            padding: 0 8px;
            font-size: 11px;
            box-sizing: border-box;
            outline: none;
          }
          .filter-panel input:focus {
            border-color: #09090b;
          }
          .table-container {
            padding: 16px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            background: #fff;
            border: 1px solid #e4e4e7;
            border-radius: 8px;
            font-size: 11px;
          }
          th, td {
            border-bottom: 1px solid #e4e4e7;
            padding: 8px 10px;
            text-align: left;
          }
          th {
            background: #fafafa;
            font-weight: 800;
            color: #71717a;
            text-transform: uppercase;
            font-size: 9px;
          }
          tr:hover {
            background: #fafafa;
          }
          .text-right {
            text-align: right;
          }
          .checkbox-cell {
            text-align: center;
            width: 50px;
          }
        </style>
      </head>
      <body>
        <div class="header-bar" style="-webkit-app-region: drag;">
          <div class="app-title">
            <img class="app-icon" src="${origin}/favicon.png" />
            <span>Stock Search</span>
          </div>
          <div class="win-controls" style="-webkit-app-region: no-drag;">
            <button id="applyBtn" class="btn" onclick="applySelection()">Apply</button>
            <button class="btn-close-win" onclick="window.close()">✕</button>
          </div>
        </div>

        <!-- EXACTLY ORDERED FILTER PANELS -->
        <div class="filter-panel">
          <div>
            <label>Account Name</label>
            <input type="text" id="fAccount" onkeyup="filterStock()" placeholder="Filter..." />
          </div>
          <div>
            <label>Item Name</label>
            <input type="text" id="fItemName" onkeyup="filterStock()" placeholder="Filter..." />
          </div>
          <div>
            <label>Width</label>
            <input type="text" id="fWidth" onkeyup="filterStock()" placeholder="Filter..." />
          </div>
          <div>
            <label>Length</label>
            <input type="text" id="fLength" onkeyup="filterStock()" placeholder="Filter..." />
          </div>
          <div>
            <label>GSM</label>
            <input type="text" id="fGSM" onkeyup="filterStock()" placeholder="Filter..." />
          </div>
          <div>
            <label>Qty</label>
            <input type="text" id="fQty" onkeyup="filterStock()" placeholder="Filter..." />
          </div>
          <div>
            <label>Location</label>
            <input type="text" id="fLocation" onkeyup="filterStock()" placeholder="Filter..." />
          </div>
        </div>

        <div class="table-container">
          <table id="stockTable">
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Account</th>
                <th>Item Name</th>
                <th>Lot No</th>
                <th>Condition</th>
                <th>Size (WxL)</th>
                <th>GSM</th>
                <th>Pcs</th>
                <th>UOM</th>
                <th>Location</th>
                <th class="text-right">Available Qty</th>
                <th class="checkbox-cell">Select</th>
              </tr>
            </thead>
            <tbody id="stockBody">
              <!-- Populated dynamically -->
            </tbody>
          </table>
        </div>

        <script>
          let selectedItem = null;
          const availableItems = window.opener.getAvailableStockList();

          function loadTable() {
            const body = document.getElementById('stockBody');
            body.innerHTML = '';

            if (availableItems.length === 0) {
              body.innerHTML = '<tr><td colspan="12" style="text-align: center; padding: 20px; color: #71717a;">No available stock matching balances</td></tr>';
              return;
            }

            availableItems.forEach((item, index) => {
              const tr = document.createElement('tr');
              tr.id = 'row_' + index;
              tr.innerHTML = \`
                <td style="font-weight: 600; color: #71717a;">\${item.itemCode}</td>
                <td style="font-weight: 500;">\${item.accountName}</td>
                <td style="font-weight: 600;">\${item.productName}</td>
                <td>\${item.lotNo}</td>
                <td>\${item.condition}</td>
                <td>\${item.width} x \${item.length}</td>
                <td>\${item.gsm}</td>
                <td>\${item.noOfItem}</td>
                <td style="text-transform: uppercase;">\${item.uom}</td>
                <td style="font-weight: 600; text-transform: uppercase;">\${item.location}</td>
                <td class="text-right" style="font-weight: bold; color: #16a34a;">\${item.quantity.toLocaleString('en-PK', { maximumFractionDigits: 0 })}</td>
                <td class="checkbox-cell">
                  <input type="checkbox" id="chk_\${index}" onclick="selectRow(\${index})" />
                </td>
              \`;
              body.appendChild(tr);
            });
          }

          function selectRow(index) {
            const applyBtn = document.getElementById('applyBtn');
            
            // Uncheck other rows
            availableItems.forEach((item, i) => {
              if (i !== index) {
                const chk = document.getElementById('chk_' + i);
                if (chk) chk.checked = false;
              }
            });

            const targetChk = document.getElementById('chk_' + index);
            if (targetChk && targetChk.checked) {
              selectedItem = availableItems[index];
              applyBtn.style.display = 'block';
            } else {
              selectedItem = null;
              applyBtn.style.display = 'none';
            }
          }

          function filterStock() {
            const fAccount = document.getElementById('fAccount').value.toLowerCase();
            const fItem = document.getElementById('fItemName').value.toLowerCase();
            const fWidth = document.getElementById('fWidth').value.toLowerCase();
            const fLength = document.getElementById('fLength').value.toLowerCase();
            const fGSM = document.getElementById('fGSM').value.toLowerCase();
            const fQty = document.getElementById('fQty').value.toLowerCase();
            const fLoc = document.getElementById('fLocation').value.toLowerCase();

            availableItems.forEach((item, idx) => {
              const row = document.getElementById('row_' + idx);
              if (!row) return;

              const matchAccount = item.accountName.toLowerCase().includes(fAccount);
              const matchItem = item.productName.toLowerCase().includes(fItem);
              const matchWidth = item.width.toLowerCase().includes(fWidth);
              const matchLength = item.length.toLowerCase().includes(fLength);
              const matchGSM = item.gsm.toLowerCase().includes(fGSM);
              const matchQty = String(item.quantity).includes(fQty);
              const matchLoc = item.location.toLowerCase().includes(fLoc);

              if (matchAccount && matchItem && matchWidth && matchLength && matchGSM && matchQty && matchLoc) {
                row.style.display = '';
              } else {
                row.style.display = 'none';
                // Uncheck if hidden
                const chk = document.getElementById('chk_' + idx);
                if (chk && chk.checked) {
                  chk.checked = false;
                  selectedItem = null;
                  document.getElementById('applyBtn').style.display = 'none';
                }
              }
            });
          }

          function applySelection() {
            if (selectedItem) {
              window.opener.onSelectStock(selectedItem);
              window.close();
            }
          }

          loadTable();
        </script>
      </body>
    </html>
  `
}

// ─────────────────────────────────────────────────────────────────────────────
// Invoice Preview
// ─────────────────────────────────────────────────────────────────────────────

export function getInvoicePreviewHtml(
  vNo: string,
  vDate: string,
  vAccount: string,
  vNarration: string,
  vItems: any[],
  origin: string
): string {
  const totalQty = vItems.reduce((s, it) => s + it.quantity, 0)
  const totalSale = vItems.reduce((s, it) => s + it.saleAmount, 0)

  return `
    <html>
      <head>
        <title>Invoice Preview</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin:0; padding:0; color:#09090b; background:#fff; }
          .header-bar { display:flex; align-items:center; justify-content:space-between; background:#fff; padding:8px 16px; border-bottom:1px solid #e4e4e7; user-select:none; }
          .app-title { display:flex; align-items:center; font-weight:800; font-size:11px; letter-spacing:0.5px; text-transform:uppercase; }
          .app-icon { width:16px; height:16px; border-radius:4px; margin-right:8px; }
          .btn-group { display:flex; gap:6px; }
          .btn { background:#09090b; color:#fff; border:none; padding:5px 12px; font-size:10px; font-weight:bold; border-radius:4px; cursor:pointer; transition:background 0.15s; text-transform:uppercase; letter-spacing:0.5px; }
          .btn:hover { background:#27272a; }
          .btn-close { background:#e11d48; color:#fff; border:none; padding:5px 10px; font-size:10px; font-weight:bold; border-radius:4px; cursor:pointer; margin-left:8px; text-transform:uppercase; }
          .btn-close:hover { background:#be123c; }
          .doc { max-width:100%; margin:0; background:transparent; padding:30px; }
          .doc-header { display:flex; justify-content:space-between; margin-bottom:20px; }
          .company-name { font-size:18px; font-weight:800; letter-spacing:0.5px; margin-bottom:4px; }
          .company-sub { font-size:10px; color:#71717a; }
          .voucher-no { font-size:14px; font-weight:bold; }
          .voucher-date { font-size:11px; color:#71717a; margin-top:2px; }
          .meta-grid { display:flex; gap:12px; margin-bottom:25px; font-size:11px; flex-wrap:wrap; }
          .meta-card { background:#fafafa; padding:12px; border:1px solid #e4e4e7; border-radius:6px; flex:1; min-width:140px; }
          .meta-label { font-size:9px; text-transform:uppercase; color:#71717a; font-weight:800; margin-bottom:4px; letter-spacing:0.5px; }
          .meta-val { font-weight:600; }
          table { width:100%; border-collapse:collapse; margin-top:15px; font-size:11px; }
          th, td { border-bottom:1px solid #e4e4e7; padding:10px; text-align:left; }
          th { background:#fafafa; font-weight:800; color:#71717a; text-transform:uppercase; font-size:9px; letter-spacing:0.5px; }
          .text-right { text-align:right; }
          tfoot { font-weight:bold; background:#fafafa; border-top:2px solid #e4e4e7; }
          .total-val { font-size:12px; color:#16a34a; }
          @media print { .header-bar { display:none; } .doc { padding:0; } }
        </style>
      </head>
      <body>
        <div class="header-bar" style="-webkit-app-region:drag;">
          <div class="app-title">
            <img class="app-icon" src="${origin}/favicon.png" />
            <span>Invoice</span>
          </div>
          <div class="btn-group" style="-webkit-app-region:no-drag;">
            <button class="btn" onclick="window.print()">Print</button>
            <button class="btn" onclick="window.print()">PDF</button>
            <button class="btn" onclick="exportToExcel()">Excel</button>
            <button class="btn-close" onclick="window.close()">✕</button>
          </div>
        </div>

        <div class="doc">
          <div class="doc-header">
            <div>
              <div class="company-name">PAPSoft ERP</div>
              <div class="company-sub">Paper Packaging Mill Management System</div>
            </div>
            <div style="text-align:right;">
              <div class="voucher-no">${vNo}</div>
              <div class="voucher-date">Date: ${vDate}</div>
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-card">
              <div class="meta-label">Customer / Account</div>
              <div class="meta-val">${vAccount}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Narration</div>
              <div class="meta-val">${vNarration}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Account</th>
                <th>Item Name</th>
                <th>Location</th>
                <th>Size (WxL)</th>
                <th>GSM</th>
                <th>UOM</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Cost Rate</th>
                <th class="text-right">Sale Rate</th>
                <th class="text-right">Sale Amount</th>
              </tr>
            </thead>
            <tbody>
              ${vItems.map(it => `
                <tr>
                  <td style="font-weight:600;color:#71717a;">${it.itemCode}</td>
                  <td style="color:#71717a;">${it.accountName}</td>
                  <td style="font-weight:600;">${it.productName}</td>
                  <td style="text-transform:uppercase;">${it.location}</td>
                  <td>${it.width} x ${it.length}</td>
                  <td>${it.gsm}</td>
                  <td style="text-transform:uppercase;font-weight:bold;">${it.uom}</td>
                  <td class="text-right" style="font-weight:bold;">${it.quantity.toLocaleString('en-PK',{maximumFractionDigits:0})}</td>
                  <td class="text-right" style="color:#71717a;">${it.costRate.toLocaleString('en-PK',{maximumFractionDigits:0})}</td>
                  <td class="text-right" style="font-weight:bold;">${it.saleRate.toLocaleString('en-PK',{maximumFractionDigits:0})}</td>
                  <td class="text-right" style="font-weight:bold;color:#16a34a;">PKR ${it.saleAmount.toLocaleString('en-PK',{maximumFractionDigits:0})}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="7" style="font-size:9px;text-transform:uppercase;color:#71717a;">Invoice Total</td>
                <td class="text-right">${totalQty.toLocaleString('en-PK',{maximumFractionDigits:0})}</td>
                <td></td>
                <td></td>
                <td class="text-right total-val">PKR ${totalSale.toLocaleString('en-PK',{maximumFractionDigits:0})}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <script>
          function exportToExcel() {
            const rows = [
              ["Item Code","Account","Item Name","Location","Width","Length","GSM","UOM","Qty","Cost Rate","Sale Rate","Sale Amount"],
              ${vItems.map(it => `[
                "${it.itemCode}","${it.accountName}","${it.productName}","${it.location}",
                "${it.width}","${it.length}","${it.gsm}","${it.uom}",
                "${it.quantity}","${it.costRate}","${it.saleRate}","${it.saleAmount}"
              ]`).join(',\n')}
            ];
            let csv = "data:text/csv;charset=utf-8," + rows.map(r => r.map(v => '"' + String(v).replace(/"/g,'""') + '"').join(",")).join("\\n");
            const a = document.createElement("a");
            a.setAttribute("href", encodeURI(csv));
            a.setAttribute("download", "${vNo}.csv");
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
          }
        </script>
      </body>
    </html>
  `
}

// ─────────────────────────────────────────────────────────────────────────────
// Delivery Order Preview
// ─────────────────────────────────────────────────────────────────────────────

export function getDoPreviewHtml(
  vNo: string,
  vDate: string,
  vInvoiceNo: string,
  vAccount: string,
  vVehicle: string,
  vNarration: string,
  vItems: any[],
  origin: string,
  showAccountName?: boolean
): string {
  const totalQty = vItems.reduce((s, it) => s + it.quantity, 0)

  return `
    <html>
      <head>
        <title>Delivery Order Preview</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin:0; padding:0; color:#09090b; background:#fff; }
          .header-bar { display:flex; align-items:center; justify-content:space-between; background:#fff; padding:8px 16px; border-bottom:1px solid #e4e4e7; user-select:none; }
          .app-title { display:flex; align-items:center; font-weight:800; font-size:11px; letter-spacing:0.5px; text-transform:uppercase; }
          .app-icon { width:16px; height:16px; border-radius:4px; margin-right:8px; }
          .btn-group { display:flex; gap:6px; }
          .btn { background:#09090b; color:#fff; border:none; padding:5px 12px; font-size:10px; font-weight:bold; border-radius:4px; cursor:pointer; transition:background 0.15s; text-transform:uppercase; letter-spacing:0.5px; }
          .btn:hover { background:#27272a; }
          .btn-close { background:#e11d48; color:#fff; border:none; padding:5px 10px; font-size:10px; font-weight:bold; border-radius:4px; cursor:pointer; margin-left:8px; text-transform:uppercase; }
          .btn-close:hover { background:#be123c; }
          .doc { max-width:100%; margin:0; background:transparent; padding:30px; }
          .doc-header { display:flex; justify-content:space-between; margin-bottom:20px; }
          .company-name { font-size:18px; font-weight:800; letter-spacing:0.5px; margin-bottom:4px; }
          .company-sub { font-size:10px; color:#71717a; }
          .voucher-no { font-size:14px; font-weight:bold; }
          .voucher-date { font-size:11px; color:#71717a; margin-top:2px; }
          .meta-grid { display:flex; gap:12px; margin-bottom:25px; font-size:11px; flex-wrap:wrap; }
          .meta-card { background:#fafafa; padding:12px; border:1px solid #e4e4e7; border-radius:6px; flex:1; min-width:140px; }
          .meta-label { font-size:9px; text-transform:uppercase; color:#71717a; font-weight:800; margin-bottom:4px; letter-spacing:0.5px; }
          .meta-val { font-weight:600; }
          table { width:100%; border-collapse:collapse; margin-top:15px; font-size:11px; }
          th, td { border-bottom:1px solid #e4e4e7; padding:10px; text-align:left; }
          th { background:#fafafa; font-weight:800; color:#71717a; text-transform:uppercase; font-size:9px; letter-spacing:0.5px; }
          .text-right { text-align:right; }
          tfoot { font-weight:bold; background:#fafafa; border-top:2px solid #e4e4e7; }
          .total-val { font-size:12px; color:#16a34a; }
          @media print { .header-bar { display:none; } .doc { padding:0; } }
        </style>
      </head>
      <body>
        <div class="header-bar" style="-webkit-app-region:drag;">
          <div class="app-title">
            <img class="app-icon" src="${origin}/favicon.png" />
            <span>Delivery Order</span>
          </div>
          <div class="btn-group" style="-webkit-app-region:no-drag;">
            <button class="btn" onclick="window.print()">Print</button>
            <button class="btn" onclick="window.print()">PDF</button>
            <button class="btn" onclick="exportToExcel()">Excel</button>
            <button class="btn-close" onclick="window.close()">✕</button>
          </div>
        </div>

        <div class="doc">
          <div class="doc-header">
            <div>
              <div class="company-name">PAPSoft ERP</div>
              <div class="company-sub">Paper Packaging Mill Management System</div>
            </div>
            <div style="text-align:right;">
              <div class="voucher-no">${vNo}</div>
              <div class="voucher-date">Date: ${vDate}</div>
            </div>
          </div>

          <div class="meta-grid">
            ${showAccountName !== false ? `
            <div class="meta-card">
              <div class="meta-label">Customer Name</div>
              <div class="meta-val">${vAccount}</div>
            </div>
            ` : ''}
            <div class="meta-card">
              <div class="meta-label">Invoice Ref</div>
              <div class="meta-val">${vInvoiceNo}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Vehicle Details / Truck No</div>
              <div class="meta-val">${vVehicle}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Narration</div>
              <div class="meta-val">${vNarration}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Item Name</th>
                <th>Lot No</th>
                <th>Condition</th>
                <th>Location</th>
                <th>Size (WxL)</th>
                <th>GSM</th>
                <th>UOM</th>
                <th class="text-right">Delivered Qty</th>
              </tr>
            </thead>
            <tbody>
              ${vItems.map(it => `
                <tr>
                  <td style="font-weight:600;color:#71717a;">${it.itemCode}</td>
                  <td style="font-weight:600;">${it.productName}</td>
                  <td>${it.lotNo}</td>
                  <td>${it.condition}</td>
                  <td style="text-transform:uppercase;">${it.location}</td>
                  <td>${it.width} x ${it.length}</td>
                  <td>${it.gsm}</td>
                  <td style="text-transform:uppercase;font-weight:bold;">${it.uom}</td>
                  <td class="text-right" style="font-weight:bold;">${it.quantity.toLocaleString('en-PK',{maximumFractionDigits:0})}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="8" style="font-size:9px;text-transform:uppercase;color:#71717a;">Total Delivered Qty</td>
                <td class="text-right total-val">${totalQty.toLocaleString('en-PK',{maximumFractionDigits:0})}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <script>
          function exportToExcel() {
            const rows = [
              ["Item Code","Item Name","Lot No","Condition","Location","Width","Length","GSM","UOM","Delivered Qty"],
              ${vItems.map(it => `[
                "${it.itemCode}","${it.productName}","${it.lotNo}","${it.condition}","${it.location}",
                "${it.width}","${it.length}","${it.gsm}","${it.uom}","${it.quantity}"
              ]`).join(',\n')}
            ];
            let csv = "data:text/csv;charset=utf-8," + rows.map(r => r.map(v => '"' + String(v).replace(/"/g,'""') + '"').join(",")).join("\\n");
            const a = document.createElement("a");
            a.setAttribute("href", encodeURI(csv));
            a.setAttribute("download", "${vNo}.csv");
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
          }
        </script>
      </body>
    </html>
  `
}

export function getAddaPreviewHtml(
  vNo: string,
  vDate: string,
  vDoNo: string,
  vVehicle: string,
  vTransporter: string,
  vDestination: string,
  vTotalPackets: number,
  vTotalWeight: number,
  vItems: any[],
  origin: string,
  vCartage?: number
): string {
  return `
    <html>
      <head>
        <title>Adda Booking Dispatch Preview</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin:0; padding:0; color:#09090b; background:#fff; }
          .header-bar { display:flex; align-items:center; justify-content:space-between; background:#fff; padding:8px 16px; border-bottom:1px solid #e4e4e7; user-select:none; }
          .app-title { display:flex; align-items:center; font-weight:800; font-size:11px; letter-spacing:0.5px; text-transform:uppercase; }
          .app-icon { width:16px; height:16px; border-radius:4px; margin-right:8px; }
          .btn-group { display:flex; gap:6px; }
          .btn { background:#09090b; color:#fff; border:none; padding:5px 12px; font-size:10px; font-weight:bold; border-radius:4px; cursor:pointer; transition:background 0.15s; text-transform:uppercase; letter-spacing:0.5px; }
          .btn:hover { background:#27272a; }
          .btn-close { background:#e11d48; color:#fff; border:none; padding:5px 10px; font-size:10px; font-weight:bold; border-radius:4px; cursor:pointer; margin-left:8px; text-transform:uppercase; }
          .btn-close:hover { background:#be123c; }
          .doc { max-width:100%; margin:0; background:transparent; padding:30px; }
          .doc-header { display:flex; justify-content:space-between; margin-bottom:20px; }
          .company-name { font-size:18px; font-weight:800; letter-spacing:0.5px; margin-bottom:4px; }
          .company-sub { font-size:10px; color:#71717a; }
          .voucher-no { font-size:14px; font-weight:bold; }
          .voucher-date { font-size:11px; color:#71717a; margin-top:2px; }
          .meta-grid { display:flex; gap:12px; margin-bottom:25px; font-size:11px; flex-wrap:wrap; }
          .meta-card { background:#fafafa; padding:12px; border:1px solid #e4e4e7; border-radius:6px; flex:1; min-width:140px; }
          .meta-label { font-size:9px; text-transform:uppercase; color:#71717a; font-weight:800; margin-bottom:4px; letter-spacing:0.5px; }
          .meta-val { font-weight:600; }
          table { width:100%; border-collapse:collapse; margin-top:15px; font-size:11px; }
          th, td { border-bottom:1px solid #e4e4e7; padding:10px; text-align:left; }
          th { background:#fafafa; font-weight:800; color:#71717a; text-transform:uppercase; font-size:9px; letter-spacing:0.5px; }
          .text-right { text-align:right; }
          tfoot { font-weight:bold; background:#fafafa; border-top:2px solid #e4e4e7; }
          .total-val { font-size:12px; color:#16a34a; }
          @media print { .header-bar { display:none; } .doc { padding:0; } }
        </style>
      </head>
      <body>
        <div class="header-bar" style="-webkit-app-region:drag;">
          <div class="app-title">
            <img class="app-icon" src="${origin}/favicon.png" />
            <span>Adda Booking Dispatch</span>
          </div>
          <div class="btn-group" style="-webkit-app-region:no-drag;">
            <button class="btn" onclick="window.print()">Print</button>
            <button class="btn" onclick="window.print()">PDF</button>
            <button class="btn" onclick="exportToExcel()">Excel</button>
            <button class="btn-close" onclick="window.close()">✕</button>
          </div>
        </div>

        <div class="doc">
          <div class="doc-header">
            <div>
              <div class="company-name">PAPSoft ERP</div>
              <div class="company-sub">Paper Packaging Mill Management System</div>
            </div>
            <div style="text-align:right;">
              <div class="voucher-no">${vNo}</div>
              <div class="voucher-date">Date: ${vDate}</div>
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-card">
              <div class="meta-label">Vehicle Details / Truck No</div>
              <div class="meta-val">${vVehicle}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Transporter</div>
              <div class="meta-val">${vTransporter}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Destination Hub</div>
              <div class="meta-val">${vDestination}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Linked DO Ref</div>
              <div class="meta-val">${vDoNo}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Cartage Fee</div>
              <div class="meta-val">${vCartage ? `PKR ${vCartage.toLocaleString('en-PK')}` : 'PKR 0'}</div>
            </div>
          </div>

          ${vItems && vItems.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Item Name</th>
                <th>Lot No</th>
                <th>Condition</th>
                <th>Location</th>
                <th>Size (WxL)</th>
                <th>GSM</th>
                <th>UOM</th>
                <th class="text-right">Qty (Pkts)</th>
                <th class="text-right">Calculated Wt (kg)</th>
              </tr>
            </thead>
            <tbody>
              ${vItems.map(it => `
                <tr>
                  <td style="font-weight:600;color:#71717a;">${it.itemCode}</td>
                  <td style="font-weight:600;">${it.productName}</td>
                  <td>${it.lotNo}</td>
                  <td>${it.condition}</td>
                  <td style="text-transform:uppercase;">${it.location}</td>
                  <td>${it.width} x ${it.length}</td>
                  <td>${it.gsm}</td>
                  <td style="text-transform:uppercase;font-weight:bold;">${it.uom}</td>
                  <td class="text-right" style="font-weight:bold;">${it.quantity.toLocaleString('en-PK',{maximumFractionDigits:0})}</td>
                  <td class="text-right" style="font-weight:bold;color:#16a34a;">${it.calculatedWeight.toLocaleString('en-PK',{minimumFractionDigits:2,maximumFractionDigits:2})} kg</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="8" style="font-size:9px;text-transform:uppercase;color:#71717a;">Total dispatch cargo</td>
                <td class="text-right" style="font-weight:bold;">${vTotalPackets.toLocaleString('en-PK',{maximumFractionDigits:0})}</td>
                <td class="text-right total-val">${vTotalWeight.toLocaleString('en-PK',{minimumFractionDigits:2,maximumFractionDigits:2})} kg</td>
              </tr>
            </tfoot>
          </table>
          ` : `
          <div style="padding:40px; text-align:center; border:1px dashed #e4e4e7; border-radius:8px; color:#71717a; font-style:italic; font-size:12px; margin-top:20px;">
            Manual entry dispatch slip. No cargo items loaded.
            <div style="font-weight:bold; font-size:16px; color:#09090b; margin-top:10px; font-style:normal;">
              Total Packets: ${vTotalPackets.toLocaleString('en-PK')} | Total Weight: ${vTotalWeight.toLocaleString('en-PK')} kg
            </div>
          </div>
          `}
        </div>

        <script>
          function exportToExcel() {
            const rows = [
              ["Item Code","Item Name","Lot No","Condition","Location","Width","Length","GSM","UOM","Qty (Pkts)","Calculated Wt (kg)"],
              ${(vItems || []).map(it => `[
                "${it.itemCode}","${it.productName}","${it.lotNo}","${it.condition}","${it.location}",
                "${it.width}","${it.length}","${it.gsm}","${it.uom}","${it.quantity}","${it.calculatedWeight}"
              ]`).join(',\n')}
            ];
            let csv = "data:text/csv;charset=utf-8," + rows.map(r => r.map(v => '"' + String(v).replace(/"/g,'""') + '"').join(",")).join("\\n");
            const a = document.createElement("a");
            a.setAttribute("href", encodeURI(csv));
            a.setAttribute("download", "${vNo}.csv");
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
          }
        </script>
      </body>
    </html>
  `
}




