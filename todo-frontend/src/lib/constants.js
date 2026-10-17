export const STATUSES = {
  todo: 'To do',
  in_progress: 'In progress',
  on_hold: 'On hold',
  done: 'Done',
};

export const PRIORITIES = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };

export const SORT_OPTIONS = [
  { value: 'due_date', label: 'Due date (soonest)' },
  { value: 'start_date', label: 'Start date' },
  { value: '-priority', label: 'Priority (highest)' },
  { value: 'title', label: 'Title A–Z' },
  { value: '-created_at', label: 'Newest first' },
];
