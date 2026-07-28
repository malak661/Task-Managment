// "15 Aug 2026" reads better on a card than an ISO timestamp.
export function formatDate(value) {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// A task due earlier today is not late yet, so compare from the start of today.
export function isOverdue(value, status) {
  if (!value || status === 'done') {
    return false;
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return new Date(value) < startOfToday;
}

// input type="date" wants YYYY-MM-DD, the api sends a full ISO timestamp.
export function toDateInputValue(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}
