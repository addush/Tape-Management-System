import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable'; // optional for better tables styling

export default function TapeTable({ columns, data }) {
  // Generate PDF report for tapes/logs
  const generatePdfReport = () => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Tape Report', 14, 20);

    // Prepare header labels array (e.g., ['Tape ID', 'Type', ...])
    const head = [columns.map(col => col.label)];

    // Prepare body rows - array of arrays, each row matching columns order
    const body = data.map(row => columns.map(col => row[col.key] || ''));

    // Use jspdf-autotable to auto generate table
    autoTable(doc, {
      head,
      body,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 70, 150] },
      theme: 'striped',
      margin: { left: 10, right: 10 },
    });

    doc.save('tapes_report.pdf');
  };

  return (
    <div>
      {/* Your existing table */}
      <button onClick={generatePdfReport} style={{ marginBottom: '10px' }}>
        Download PDF Report
      </button>

      <table>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center' }}>
                No records
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={i}>
                {columns.map(col => (
                  <td key={col.key}>{row[col.key] || ''}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
