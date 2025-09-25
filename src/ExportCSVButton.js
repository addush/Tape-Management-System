import React from 'react';

function exportToCsv(filename, rows) {
  const processRow = row =>
    row
      .map(item => `"${item ? item.toString().replace(/"/g, '""') : ''}"`)
      .join(',');

  const csvContent = rows.map(processRow).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function ExportCSVButton({ filename, rows, label = 'Export CSV' }) {
  return (
    <button onClick={() => exportToCsv(filename, rows)}>
      {label}
    </button>
  );
}
