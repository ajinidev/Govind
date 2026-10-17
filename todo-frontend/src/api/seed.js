import { addDays, today } from '../lib/dates.js';

/** Dummy data, generated relative to today so every page always has something to show. */
export function buildSeed() {
  const t = today();
  const now = new Date().toISOString();
  const rows = [
    ['Welcome to TaskFlow', 'Click a task to edit it, or tick the checkbox to complete it.', 0, 0, 'medium', 'todo', 'Demo'],
    ['Submit expense report', 'Attach all receipts from the Berlin trip.', -5, -2, 'high', 'in_progress', 'Work'],
    ['Fix login redirect bug', 'Users land on a blank page after SSO.', -3, -1, 'urgent', 'in_progress', 'Work'],
    ['Pay electricity bill', null, -8, -4, 'medium', 'todo', 'Home'],
    ['Prepare quarterly review', 'Slides, metrics and roadmap.', -1, 3, 'urgent', 'in_progress', 'Work'],
    ['Team stand-up notes', 'Write up and share with the team.', 0, 0, 'low', 'todo', 'Work'],
    ['Book dentist appointment', null, 0, 2, 'medium', 'todo', 'Personal'],
    ['Plan weekend trip', 'Book hotel and trains.', 1, 4, 'low', 'todo', 'Personal'],
    ['Write API documentation', 'Document all /tasks endpoints.', 1, 6, 'high', 'todo', 'Work'],
    ['Renew passport', 'Needs photos and the old passport.', null, 20, 'medium', 'on_hold', 'Personal'],
    ['Refactor billing module', 'Waiting on product decision.', -6, 9, 'high', 'on_hold', 'Work'],
    ['Buy groceries', null, -3, -3, 'low', 'done', 'Home'],
    ['Send invoice to client', null, -7, -6, 'high', 'done', 'Work'],
    ['Read "Designing Data-Intensive Applications"', 'Chapters 5–7.', -10, 14, 'low', 'in_progress', 'Learning'],
    ['Learn SQL joins', 'Practice INNER, LEFT, and self joins.', 2, 5, 'medium', 'todo', 'Learning'],
    ['Team offsite planning', 'Venue, agenda, catering.', 7, 21, 'medium', 'todo', 'Work'],
    ['Call mom', null, null, 0, 'medium', 'todo', 'Personal'],
    ['Backup laptop', null, -2, 1, 'low', 'todo', 'Home'],
  ];
  const date = (offset) => (offset === null ? null : addDays(t, offset));
  return rows.map(([title, description, s, d, priority, status, category], i) => ({
    id: `seed-${i + 1}`,
    title,
    description,
    start_date: date(s),
    due_date: date(d),
    priority,
    status,
    category,
    created_at: now,
    updated_at: now,
  }));
}
