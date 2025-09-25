import React, { useState, useEffect } from 'react';
import { loadTapes, loadLogs, saveLogs, saveTapes, clearTapes, clearLogs } from './storage';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CryptoJS from 'crypto-js';

// Convert image URL to base64 for embedding signature in PDF
function toDataURL(url) {
  return fetch(url)
    .then(resp => resp.blob())
    .then(blob =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }),
    );
}

// Export CSV helper
function exportToCsv(filename, rows) {
  const processRow = row =>
    row.map(item => `"${item ? item.toString().replace(/"/g, '""') : ''}"`).join(',');
  const csvContent = rows.map(processRow).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function TakeOutStoreTab() {
  // State for tapes and logs
  const [tapes, setTapes] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form state for Take Out tapes (multi-select)
  const [takeOutData, setTakeOutData] = useState({
    selectedIds: [],
    assignedTo: '',
    purpose: '',
    backupDate: '',
    handOverBy: '',
    receivedBy: '',
  });

  // Load tapes and logs from localStorage initially
  useEffect(() => {
    setTapes(loadTapes());
    setLogs(loadLogs());
  }, []);

  // Generate SHA256 signature string from tapes data (for PDF signature)
  function generateSignature(tapesData) {
    const dataStr = JSON.stringify(tapesData);
    return CryptoJS.SHA256(dataStr).toString(CryptoJS.enc.Hex);
  }

  // Generate & download PDF embed signature image bottom-right with complete logs data
  async function generateAndDownloadLogPdfReport(signature, signaturePngBase64, logsData) {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Checked Out Tape Logs Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Signature: ${signature}`, 14, 28);

    if (signaturePngBase64) {
      let imgData = signaturePngBase64;
      if (!imgData.startsWith('data:image/png;base64,')) {
        imgData = 'data:image/png;base64,' + imgData;
      }
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const imgWidth = 40;
      const imgHeight = 40;
      const margin = 10;
      const x = pageWidth - imgWidth - margin;
      const y = pageHeight - imgHeight - margin;

      doc.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
    }
    const tableColumns = ['Tape ID', 'Action', 'Date', 'Assigned To', 'Purpose', 'Hand Over By', 'Received By'];
    const tableRows = logsData.map(log => [
      log.tapeId || '',
      log.action || '',
      log.date || '',
      log.assignedTo || log.AssignedTo || '',
      log.purpose || '',
      log.handOverBy || '',
      log.receivedBy || '',
    ]);

    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: 55,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [0, 70, 150] },
      theme: 'striped',
      margin: { top: 10, bottom: 10, left: 10, right: 10 },
    });

    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 10);
    const filename = `takeout_tape_logs_report_${formattedDate}_with_signature.pdf`;
    doc.save(filename);
  }

  // Generate report with signature, using latest logs passed explicitly
  async function insertSignatureAndGenerateLogPdf(logsData = logs) {
    setLoading(true);
    try {
      const signature = generateSignature(tapes);
      const signaturePngBase64 = await toDataURL('/signature.png');

      // Filter only takeout logs here to ensure PDF has only those
      const filteredLogs = logsData.filter(log => log.action === 'Checked Out');

      await generateAndDownloadLogPdfReport(signature, signaturePngBase64, filteredLogs);

      toast.success('Take Out Log PDF report with embedded signature generated');
    } catch (error) {
      toast.error('Error generating signed log report: ' + (error.message || error));
    } finally {
      setLoading(false);
    }
  }

  const takeOutLogs = logs.filter(log => log.action === 'Checked Out');

  // Handle form input changes for Take Out, handling multi-select
  const onTakeOutChange = e => {
    if (e.target.id === 'selectedIds') {
      const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
      setTakeOutData(prev => ({ ...prev, selectedIds: selected }));
    } else {
      setTakeOutData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    }
  };

  const checkoutTapes = async e => {
    e.preventDefault();

    if (takeOutData.selectedIds.length === 0) {
      toast.error('Select at least one tape to take out');
      return;
    }
    if (!takeOutData.assignedTo.trim() || !takeOutData.purpose.trim() || !takeOutData.backupDate) {
      toast.error('Assigned To, Purpose, and Backup Date are required');
      return;
    }

    setLoading(true);

    try {
      const now = new Date().toISOString().slice(0, 10);
      const newLogs = [];

      // Update tapes: status changes to assignedTo's name for selected tapes
      const updatedTapes = tapes.map(tape => {
        if (takeOutData.selectedIds.includes(tape.id)) {
          return {
            ...tape,
            status: takeOutData.assignedTo.trim(), // status shows assigned person
            assignedTo: takeOutData.assignedTo.trim(), // store assigned person
          };
        }
        return tape;
      });

      setTapes(updatedTapes);
      saveTapes(updatedTapes);

      for (const tapeId of takeOutData.selectedIds) {
        const logEntry = {
          tapeId,
          action: 'Checked Out',
          date: now,
          assignedTo: takeOutData.assignedTo.trim(),
          purpose: takeOutData.purpose.trim(),
          handOverBy: takeOutData.handOverBy.trim(),
          receivedBy: takeOutData.receivedBy.trim(),
          status: 'Checked Out',
        };
        newLogs.push(logEntry);
      }

      setLogs([...logs, ...newLogs]);
      saveLogs([...logs, ...newLogs]);

      setTakeOutData({
        selectedIds: [],
        assignedTo: '',
        purpose: '',
        backupDate: '',
        handOverBy: '',
        receivedBy: '',
      });

      await insertSignatureAndGenerateLogPdf([...logs, ...newLogs]);

      toast.success('Tape(s) checked out successfully');
    } catch (error) {
      toast.error('Error checking out tapes: ' + (error.message || error));
    } finally {
      setLoading(false);
    }
  };

  // Delete all data confirmation and reset
  const deleteAllTapeDataHistory = () => {
    if (
      window.confirm(
        'Are you sure you want to delete ALL tape data and logs permanently? This action cannot be undone.'
      )
    ) {
      clearTapes();
      clearLogs();
      setTapes([]);
      setLogs([]);
      toast.success('All tape data and logs cleared!');
    }
  };

  // Export logs to CSV
  const handleDownloadLogReport = () => {
    if (takeOutLogs.length === 0) {
      toast.warn('No Take Out logs to export');
      return;
    }

    const csvHeader = [
      'Tape ID',
      'Action',
      'Date',
      'Assigned To',
      'Purpose',
      'Hand Over By',
      'Received By',
    ];

    const csvRows = [
      csvHeader,
      ...logs.map(log => [
        log.tapeId || '',
        log.action || '',
        log.date || '',
        log.assignedTo || log.AssignedTo || '',
        log.purpose || '',
        log.handOverBy || '',
        log.receivedBy || '',
      ]),
    ];

    exportToCsv('tape_logs_report.csv', csvRows);
  };

  return (
    <div>
      <ToastContainer />

      <h3>Take Out Tapes</h3>
      <form onSubmit={checkoutTapes}>
        <select
          id="selectedIds"
          multiple
          size={5}
          value={takeOutData.selectedIds}
          onChange={onTakeOutChange}
          disabled={loading}
          required
        >
          {tapes.length === 0 ? (
            <option disabled>No tapes available</option>
          ) : (
            tapes.map(tape => (
              <option key={tape.id} value={tape.id}>
                {tape.id} ({tape.status || 'Unknown'})
              </option>
            ))
          )}
        </select>

        <input
          id="assignedTo"
          type="text"
          placeholder="Assigned To"
          value={takeOutData.assignedTo}
          onChange={onTakeOutChange}
          disabled={loading}
          required
        />

        <input
          id="purpose"
          type="text"
          placeholder="Purpose"
          value={takeOutData.purpose}
          onChange={onTakeOutChange}
          disabled={loading}
          required
        />

        <input
          id="backupDate"
          type="date"
          value={takeOutData.backupDate}
          onChange={onTakeOutChange}
          disabled={loading}
          required
        />

        <input
          id="handOverBy"
          type="text"
          placeholder="Hand Over By"
          value={takeOutData.handOverBy}
          onChange={onTakeOutChange}
          disabled={loading}
        />

        <input
          id="receivedBy"
          type="text"
          placeholder="Received By"
          value={takeOutData.receivedBy}
          onChange={onTakeOutChange}
          disabled={loading}
        />

        <button type="submit" disabled={loading}>
          Take Out Tapes
        </button>
      </form>

      <button onClick={handleDownloadLogReport} disabled={loading} style={{ marginTop: '10px' }}>
        Export Logs to CSV
      </button>

      <button
        onClick={deleteAllTapeDataHistory}
        disabled={loading}
        style={{ backgroundColor: '#d9534f', color: 'white', padding: 6, border: 'none', cursor: 'pointer' }}
      >
        Delete ALL Tape Data & Logs
      </button>

      <h2>Recent Logs</h2>
      <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: '10px' }}>
        <thead>
          <tr>
            <th>Tape ID</th>
            <th>Action</th>
            <th>Date</th>
            <th>Assigned To</th>
            <th>Purpose</th>
            <th>Hand Over By</th>
            <th>Received By</th>
          </tr>
        </thead>
        <tbody>
          {takeOutLogs.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center' }}>
                No Take Out logs found
              </td>
            </tr>
          ) : (
            takeOutLogs.map((log, idx) => (
              <tr key={idx}>
                <td>{log.tapeId}</td>
                <td>{log.action}</td>
                <td>{log.date}</td>
                <td>{log.assignedTo || log.AssignedTo || ''}</td>
                <td>{log.purpose || ''}</td>
                <td>{log.handOverBy || ''}</td>
                <td>{log.receivedBy || ''}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
