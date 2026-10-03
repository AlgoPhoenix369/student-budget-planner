import { getClientId } from './clientId';

// Backend address
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

// Sends a request to the backend with the visitor's ID attached, and returns the JSON result
async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Id': getClientId(),
      ...options.headers
    }
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (typeof body.detail === 'string') {
        message = body.detail;
      } else if (Array.isArray(body.detail) && body.detail[0]?.msg) {
        message = body.detail[0].msg;
      }
    } catch {
      // The error response had no JSON body, so keep the generic message
    }
    throw new Error(message);
  }

  return response.status === 204 ? null : response.json();
}

// Months in the app are 0-11 (JavaScript), the API expects 1-12
export const fetchExpensesByMonth = (year, month) =>
  request(`/api/expenses?year=${year}&month=${month + 1}`);

export const createExpense = (data) =>
  request('/api/expenses', { method: 'POST', body: JSON.stringify(data) });

export const updateExpense = (id, data) =>
  request(`/api/expenses/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteExpense = (id) =>
  request(`/api/expenses/${encodeURIComponent(id)}`, { method: 'DELETE' });

export const fetchBudget = async () => {
  const data = await request('/api/budget');
  return data.amount;
};

export const updateBudget = (amount) =>
  request('/api/budget', { method: 'PUT', body: JSON.stringify({ amount: Number(amount) }) });

export const exportBackup = () => request('/api/backup');

export const importBackup = (data) =>
  request('/api/backup/import', { method: 'POST', body: JSON.stringify(data) });