import React, { useState, useEffect } from 'react';
import { loadTapes, saveTapes, loadLogs, saveLogs, clearTapes, clearLogs } from './storage';
import CryptoJS from 'crypto-js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Convert image URL to base64 (for signature)
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

// Export CSV utility
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

export default function NewReusedTab() {
  const [tapes, setTapes] = useState([]);
  const [movementLogs, setMovementLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTapeHistory, setSelectedTapeHistory] = useState(null);

  // Form data for adding new tape
  const [formData, setFormData] = useState({
    id: '',
    type: '',
    dateInserted: '',
    status: '',
    handOverBy: '',
    receivedBy: '',
  });

  // Form data for reused tapes: supports multi-select
  const [reusedData, setReusedData] = useState({
    selectedIds: [],
    usageHistory: '',
    Date: '',
    handOverByReused: '',
    receivedByReused: '',
  });

  // Load data from localStorage on mount
  useEffect(() => {
    setTapes(loadTapes());
    setMovementLogs(loadLogs());
  }, []);

  // Generate SHA256 signature of tapes data
  function generateSignature(tapesData) {
    const dataStr = JSON.stringify(tapesData);
    return CryptoJS.SHA256(dataStr).toString(CryptoJS.enc.Hex);
  }

  // Generate and save PDF report with embedded signature
  async function generateAndDownloadPdfReport(signature, signaturePngBase64, tapesData) {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Tape Report', 14, 20);
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

    const columns = [
      'Tape ID',
      'Type',
      'Status',
      'Date Inserted',
      'Hand Over By',
      'Received By',
      'Hand Over By (Reused)',
      'Received By (Reused)',
      'Usage History',
      'Date',
    ];
    const rows = tapesData.map(t => [
      t.id,
      t.type,
      t.status,
      t.dateInserted,
      t.handOverBy,
      t.receivedBy,
      t.handOverByReused || '',
      t.receivedByReused || '',
      t.usageHistory,
      t.Date || '',
    ]);

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 55,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [0, 70, 150] },
      theme: 'striped',
      margin: { top: 10, bottom: 10, left: 10, right: 10 },
    });

    doc.save('tapes_report_with_signature.pdf');
  }

  // Wrapper for PDF generation with loading and error handling
  async function insertSignatureAndGeneratePdf(tapesData = tapes) {
    setLoading(true);
    try {
      const signature = generateSignature(tapesData);
      const signaturePngBase64 = await toDataURL('/signature.png');
      await generateAndDownloadPdfReport(signature, signaturePngBase64, tapesData);
      toast.success('PDF report with embedded signature generated');
    } catch (error) {
      toast.error('Error generating signed report: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  const onChangeNew = e => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const addTape = e => {
    e.preventDefault();
    if (!formData.id.trim() || !formData.type || !formData.dateInserted) {
      toast.error('Please fill required fields');
      return;
    }
    if (tapes.some(t => t.id === formData.id.trim())) {
      toast.error('Tape ID already exists');
      return;
    }
    const newTape = {
      id: formData.id.trim(),
      type: formData.type,
      status: formData.status || 'New',
      dateInserted: formData.dateInserted,
      handOverBy: formData.handOverBy.trim(),
      receivedBy: formData.receivedBy.trim(),
      usageHistory: '',
      Date: '',
      isNew: true,
    };

    const updatedTapes = [...tapes, newTape];
    setTapes(updatedTapes);
    saveTapes(updatedTapes);

    const newLogEntry = {
      tapeId: newTape.id,
      action: 'Registered (New)',
      date: newTape.dateInserted,
      userStation: '',
      purpose: '',
      handOverBy: newTape.handOverBy,
      receivedBy: newTape.receivedBy,
      remarks: '',
    };

    const updatedLogs = [...movementLogs, newLogEntry];
    setMovementLogs(updatedLogs);
    saveLogs(updatedLogs);

    setFormData({ id: '', type: '', dateInserted: '', status: '', handOverBy: '', receivedBy: '' });
    toast.success('Tape added successfully');
  };

  const onChangeReused = e => {
    if (e.target.id === 'selectedIds') {
      const selectedOptions = Array.from(e.target.selectedOptions).map(opt => opt.value);
      setReusedData({ ...reusedData, selectedIds: selectedOptions });
    } else {
      setReusedData({ ...reusedData, [e.target.id]: e.target.value });
    }
  };

  const updateReused = e => {
    e.preventDefault();
    if (!reusedData.selectedIds.length) {
      toast.error('Please select at least one tape');
      return;
    }

    const updatedTapes = tapes.map(tape => {
      if (reusedData.selectedIds.includes(tape.id)) {
        const updatedUsage = tape.usageHistory
          ? tape.usageHistory + '\n' + reusedData.usageHistory.trim()
          : reusedData.usageHistory.trim();
        return {
          ...tape,
          usageHistory: updatedUsage,
          Date: reusedData.Date,
          status: 'Reused',
          handOverByReused: reusedData.handOverByReused,
          receivedByReused: reusedData.receivedByReused,
        };
      }
      return tape;
    });

    setTapes(updatedTapes);
    saveTapes(updatedTapes);

    const newDate = new Date().toISOString().split('T')[0];
    const updatedLogs = [...movementLogs];
    reusedData.selectedIds.forEach(tapeId => {
      updatedLogs.push({
        tapeId,
        action: 'Registered (Reused)',
        date: newDate,
        assignedTo: reusedData.handOverByReused || '',
        purpose: reusedData.usageHistory,
        handOverBy: reusedData.handOverByReused,
        receivedBy: reusedData.receivedByReused,
        remarks: '',
      });
    });

    setMovementLogs(updatedLogs);
    saveLogs(updatedLogs);

    setReusedData({ selectedIds: [], usageHistory: '', Date: '', handOverByReused: '', receivedByReused: '' });
    toast.success('Tapes updated successfully');

    insertSignatureAndGeneratePdf(updatedTapes);
  };

  const openHistory = tapeId => setSelectedTapeHistory(tapeId);
  const closeHistory = () => setSelectedTapeHistory(null);

  const deleteAllTapeDataHistory = () => {
    if (window.confirm('Are you sure you want to delete ALL tape data and logs permanently? This action cannot be undone.')) {
      clearTapes();
      clearLogs();
      setTapes([]);
      setMovementLogs([]);
      toast.success('All tape data and logs cleared!');
      closeHistory();
    }
  };

  const handleDownloadReport = () => {
    const signature = generateSignature(tapes);
    const csvRows = [
      ['Signature', signature],
      [],
      [
        'Tape ID',
        'Type',
        'Status',
        'Date Inserted',
        'Hand Over By',
        'Received By',
        'Hand Over By (Reused)',
        'Received By (Reused)',
        'Usage History',
        'Date',
      ],
      ...tapes.map(t => [
        t.id,
        t.type,
        t.status,
        t.dateInserted,
        t.handOverBy,
        t.receivedBy,
        t.handOverByReused || '',
        t.receivedByReused || '',
        t.usageHistory || '',
        t.Date || '',
      ]),
    ];
    exportToCsv('tapes_report.csv', csvRows);
  };

  return (
    <div>
      <ToastContainer />

      {/* Add New Tape Form */}
      <h3>Add New Tape</h3>
      <form onSubmit={addTape}>
        <input id="id" value={formData.id} onChange={onChangeNew} placeholder="Tape ID" required disabled={loading} />
        <select id="type" value={formData.type} onChange={onChangeNew} required disabled={loading}>
          <option value="">Select type</option>
          <option value="EOD">EOD</option>
          <option value="CBS">CBS</option>
          <option value="Signature">Signature</option>
          <option value="ADB">ADB</option>
          <option value="K8S">K8S</option>
        </select>
        <input type="date" id="dateInserted" value={formData.dateInserted} onChange={onChangeNew} required disabled={loading} />
        <select value="new" disabled>
          <option value="new">New</option>
        </select>
        <input id="handOverBy" value={formData.handOverBy} onChange={onChangeNew} placeholder="Hand Over By" disabled={loading} />
        <input id="receivedBy" value={formData.receivedBy} onChange={onChangeNew} placeholder="Received By" disabled={loading} />
        <button type="submit" disabled={loading}>
          Add Tape
        </button>
      </form>

      {/* Register Reused Tape Form */}
      <h3>Register Reused Tape</h3>
      <form onSubmit={updateReused}>
        <select id="selectedIds" value={reusedData.selectedIds} onChange={onChangeReused} required disabled={loading} multiple size={5}>
          {tapes.length === 0 ? (
            <option disabled>No tapes available</option>
          ) : (
            tapes.map(tape => (
              <option key={tape.id} value={tape.id}>
                {tape.id}
              </option>
            ))
          )}
        </select>
        <input id="usageHistory" value={reusedData.usageHistory} onChange={onChangeReused} placeholder="Usage History" required disabled={loading} />
        <input type="date" id="Date" value={reusedData.Date} onChange={onChangeReused} required disabled={loading} />
        <input id="handOverByReused" value={reusedData.handOverByReused} onChange={onChangeReused} placeholder="Hand Over By (Reused)" disabled={loading} />
        <input id="receivedByReused" value={reusedData.receivedByReused} onChange={onChangeReused} placeholder="Received By (Reused)" disabled={loading} />
        <button type="submit" disabled={loading}>
          Update Reused Tape(s)
        </button>
      </form>

      {/* Export & Clear Buttons */}
      <button onClick={handleDownloadReport} disabled={loading} style={{ marginTop: '10px' }}>
        Download CSV Report
      </button>

      <button
        onClick={deleteAllTapeDataHistory}
        disabled={loading}
        style={{
          marginTop: '15px',
          backgroundColor: '#d9534f',
          color: '#fff',
          padding: '8px 12px',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Delete ALL Tape Data & Logs
      </button>

      {/* All tapes table */}
      <h2>All Tapes</h2>
      <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: '10px' }}>
        <thead>
          <tr>
            <th>Tape ID</th>
            <th>Type</th>
            <th>Status</th>
            <th>Date Inserted</th>
            <th>Hand Over By</th>
            <th>Received By</th>
            <th>Hand Over By (Reused)</th>
            <th>Received By (Reused)</th>
            <th>Usage History</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tapes.map(tape => (
            <tr key={tape.id}>
              <td>{tape.id}</td>
              <td>{tape.type}</td>
              <td>{tape.status}</td>
              <td>{tape.dateInserted}</td>
              <td>{tape.handOverBy}</td>
              <td>{tape.receivedBy}</td>
              <td>{tape.handOverByReused || ''}</td>
              <td>{tape.receivedByReused || ''}</td>
              <td>{tape.usageHistory}</td>
              <td>{tape.Date}</td>
              <td>
                <button onClick={() => openHistory(tape.id)} disabled={loading}>
                  View History
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* History Modal */}
      {selectedTapeHistory && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 7,
              padding: 20,
              maxWidth: 720,
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
          >
            <button style={{ float: 'right' }} onClick={closeHistory} disabled={loading}>
              Close
            </button>
            <h3>History for Tape {selectedTapeHistory}</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Tape ID</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                  <th>Assigned To</th>
                  <th>Purpose</th>
                  <th>Hand Over By</th>
                  <th>Received By</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {movementLogs
                  .filter(log => log.tapeId === selectedTapeHistory)
                  .map((log, i) => {
                    const tape = tapes.find(t => t.id === log.tapeId) || {};
                    return (
                      <tr key={i}>
                        <td>{log.tapeId}</td>
                        <td>{tape.type || ''}</td>
                        <td>{tape.status || ''}</td>
                        <td>{log.date}</td>
                        <td>{log.action}</td>
                        <td>{log.assignedTo || log.AssignedTo || ''}</td>
                        <td>{log.purpose}</td>
                        <td>{log.handOverBy}</td>
                        <td>{log.receivedBy}</td>
                        <td>{log.remarks}</td>
                      </tr>
                    );
                  })}
                {movementLogs.filter(log => log.tapeId === selectedTapeHistory).length === 0 && (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center' }}>
                      No history found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
