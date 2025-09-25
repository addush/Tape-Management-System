const TAPES_KEY = 'tapes';
const LOGS_KEY = 'movementLogs';

export function loadTapes() {
  const tapes = localStorage.getItem(TAPES_KEY);

  if (!tapes || tapes === 'undefined' || tapes === 'null') {
    // missing or invalid data, return empty array
    return [];
  }

  try {
    return JSON.parse(tapes);
  } catch (e) {
    console.error('Error parsing tapes from localStorage:', e);
    localStorage.removeItem(TAPES_KEY);
    return [];
  }
}

export function saveTapes(tapes) {
  localStorage.setItem(TAPES_KEY, JSON.stringify(tapes));
}

export function loadLogs() {
  const logs = localStorage.getItem(LOGS_KEY);

  if (!logs || logs === 'undefined' || logs === 'null') {
    // missing or invalid data, return empty array
    return [];
  }

  try {
    return JSON.parse(logs);
  } catch (e) {
    console.error('Error parsing logs from localStorage:', e);
    localStorage.removeItem(LOGS_KEY);
    return [];
  }
}

export function saveLogs(logs) {
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}

export function clearTapes() {
  localStorage.removeItem(TAPES_KEY);
}

export function clearLogs() {
  localStorage.removeItem(LOGS_KEY);
}
