const CLIENT_ID_KEY = 'student_budget_client_id';

// Used only if the browser blocks localStorage (e.g some private modes)
let memoryId = null;

// Builds a random ID that matches the backend's allowed format
function generateId() {
  if (window.crypto?.randomUUID) {
    return `c_${window.crypto.randomUUID().replace(/-/g, '')}`;
  }
  return `c_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}${Math.random().toString(36).slice(2, 12)}`;
}

// Returns browser's anonymous ID, creating and saving one on first use
export function getClientId() {
  try {
    let id = localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id = generateId();
      localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  } catch {
    if (!memoryId) memoryId = generateId();
    return memoryId;
  }
}