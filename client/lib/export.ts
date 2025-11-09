import html2canvas from "html2canvas";

export interface ExportData {
  metrics: Array<{
    month: string;
    co2_reduction: number;
    actions_completed: number;
    participants: number;
  }>;
  regional: Array<{
    region: string;
    co2_reduction: number;
    impact_percentage: number;
    communities: number;
  }>;
  actionTypes: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
  totalImpact: {
    co2_reduction: number;
    participants: number;
    communities: number;
  };
}

export async function exportAsCSV(
  data: ExportData,
  fileName: string = "climate-report",
) {
  // Metrics CSV
  const metricsCSV =
    "Month,CO2 Reduction (kg),Actions Completed,Participants\n" +
    data.metrics
      .map(
        (m) =>
          `${m.month},${m.co2_reduction},${m.actions_completed},${m.participants}`,
      )
      .join("\n");

  // Regional CSV
  const regionalCSV =
    "Region,CO2 Reduction (kg),Impact Percentage,Communities\n" +
    data.regional
      .map(
        (r) =>
          `${r.region},${r.co2_reduction},${r.impact_percentage}%,${r.communities}`,
      )
      .join("\n");

  // Action Types CSV
  const actionTypesCSV =
    "Action Type,Value (kg),Percentage\n" +
    data.actionTypes
      .map((a) => `${a.name},${a.value},${a.percentage}%`)
      .join("\n");

  // Impact Summary CSV
  const impactCSV =
    "Metric,Value\n" +
    `Total CO2 Reduction,${data.totalImpact.co2_reduction}\n` +
    `Total Participants,${data.totalImpact.participants}\n` +
    `Total Communities,${data.totalImpact.communities}`;

  // Combine all CSVs
  const fullCSV = `Climate Impact Report\nGenerated: ${new Date().toLocaleDateString()}\n\nIMPACT SUMMARY\n${impactCSV}\n\nMONTHLY METRICS\n${metricsCSV}\n\nREGIONAL DATA\n${regionalCSV}\n\nACTION TYPES\n${actionTypesCSV}`;

  const blob = new Blob([fullCSV], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${fileName}-${new Date().getTime()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportAsXLSX(
  data: ExportData,
  fileName: string = "climate-report",
) {
  // Simple XLSX generation using native method
  // For production, consider using a library like xlsx or exceljs
  const html = `
    <table>
      <tr><th colspan="4">CLIMATE IMPACT REPORT</th></tr>
      <tr><th colspan="4">Generated: ${new Date().toLocaleDateString()}</th></tr>
      <tr><td></td></tr>
      <tr><th colspan="4">IMPACT SUMMARY</th></tr>
      <tr><th>Metric</th><th>Value</th></tr>
      <tr><td>Total CO2 Reduction</td><td>${data.totalImpact.co2_reduction}</td></tr>
      <tr><td>Total Participants</td><td>${data.totalImpact.participants}</td></tr>
      <tr><td>Total Communities</td><td>${data.totalImpact.communities}</td></tr>
      <tr><td></td></tr>
      <tr><th colspan="4">MONTHLY METRICS</th></tr>
      <tr><th>Month</th><th>CO2 Reduction (kg)</th><th>Actions Completed</th><th>Participants</th></tr>
      ${data.metrics.map((m) => `<tr><td>${m.month}</td><td>${m.co2_reduction}</td><td>${m.actions_completed}</td><td>${m.participants}</td></tr>`).join("")}
      <tr><td></td></tr>
      <tr><th colspan="4">REGIONAL DATA</th></tr>
      <tr><th>Region</th><th>CO2 Reduction (kg)</th><th>Impact %</th><th>Communities</th></tr>
      ${data.regional.map((r) => `<tr><td>${r.region}</td><td>${r.co2_reduction}</td><td>${r.impact_percentage}%</td><td>${r.communities}</td></tr>`).join("")}
      <tr><td></td></tr>
      <tr><th colspan="4">ACTION TYPES</th></tr>
      <tr><th>Action Type</th><th>Value (kg)</th><th>Percentage</th></tr>
      ${data.actionTypes.map((a) => `<tr><td>${a.name}</td><td>${a.value}</td><td>${a.percentage}%</td></tr>`).join("")}
    </table>
  `;

  const blob = new Blob([html], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${fileName}-${new Date().getTime()}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportAsPDF(
  data: ExportData,
  fileName: string = "climate-report",
) {
  // Simple PDF generation - for production use a proper PDF library like pdfkit or jspdf
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #10b981; }
        h2 { color: #3b82f6; border-bottom: 2px solid #3b82f6; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #10b981; color: white; }
        .metric-card { background-color: #f0fdf4; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .value { font-size: 24px; font-weight: bold; color: #10b981; }
      </style>
    </head>
    <body>
      <h1>Climate Impact Report</h1>
      <p>Generated: ${new Date().toLocaleDateString()}</p>
      
      <h2>Impact Summary</h2>
      <div class="metric-card">
        <p><strong>Total CO2 Reduction:</strong> <span class="value">${data.totalImpact.co2_reduction.toLocaleString()} kg</span></p>
        <p><strong>Total Participants:</strong> <span class="value">${data.totalImpact.participants.toLocaleString()}</span></p>
        <p><strong>Total Communities:</strong> <span class="value">${data.totalImpact.communities.toLocaleString()}</span></p>
      </div>
      
      <h2>Monthly Metrics</h2>
      <table>
        <tr>
          <th>Month</th>
          <th>CO2 Reduction (kg)</th>
          <th>Actions Completed</th>
          <th>Participants</th>
        </tr>
        ${data.metrics.map((m) => `<tr><td>${m.month}</td><td>${m.co2_reduction.toLocaleString()}</td><td>${m.actions_completed}</td><td>${m.participants}</td></tr>`).join("")}
      </table>
      
      <h2>Regional Data</h2>
      <table>
        <tr>
          <th>Region</th>
          <th>CO2 Reduction (kg)</th>
          <th>Impact %</th>
          <th>Communities</th>
        </tr>
        ${data.regional.map((r) => `<tr><td>${r.region}</td><td>${r.co2_reduction.toLocaleString()}</td><td>${r.impact_percentage}%</td><td>${r.communities}</td></tr>`).join("")}
      </table>
      
      <h2>Action Types</h2>
      <table>
        <tr>
          <th>Action Type</th>
          <th>Value (kg)</th>
          <th>Percentage</th>
        </tr>
        ${data.actionTypes.map((a) => `<tr><td>${a.name}</td><td>${a.value.toLocaleString()}</td><td>${a.percentage}%</td></tr>`).join("")}
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${fileName}-${new Date().getTime()}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportAsImage(
  elementId: string,
  fileName: string = "climate-report",
) {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id ${elementId} not found`);
  }

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: "#ffffff",
      scale: 2,
    });

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${fileName}-${new Date().getTime()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error exporting as image:", error);
    throw new Error("Failed to export as image");
  }
}
