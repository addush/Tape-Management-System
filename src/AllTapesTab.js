import React, { useState, useEffect } from 'react';
import { loadTapes, loadLogs} from './storage';
import ExportCSVButton from './ExportCSVButton';

export default function AllTapesTab() {
  const [tapes, setTapes] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    setTapes(loadTapes());
    setLogs(loadLogs());
    
    
  }, []);

  const allTapeRows = [
    [
      'Tape ID',
      'Type',
      'Status',
      'Date Inserted',
      'Hand Over By',
      'Received By',
      'Reused Hand Over By',
      'Reused Received By',
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

  const allLogRows = [
    [
      'Tape ID',
      'Action',
      'Date',
      'Assigned To',
      'Purpose',
      'Hand Over By',
      'Received By',
      'Remarks',
    ],
    ...logs.map(l => [
      l.tapeId,
      l.action,
      l.date,
      l.assignedTo|| '',
      l.purpose || '',
      l.handOverBy || '',
      l.receivedBy || '',
      l.remarks || '',
    ]),
  ];

  return (
    <div>
      <h2>All Tapes Export</h2>
      <ExportCSVButton
        filename="all_tapes.csv"
        rows={allTapeRows}
        label="Export All Tapes CSV"
      />
      <ExportCSVButton
        filename="all_logs.csv"
        rows={allLogRows}
        label="Export All Logs CSV"
      />
    </div>
  );
}
