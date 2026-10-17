// The one place that decides which backend the UI talks to. Changing the source reloads the page.
import { createHttpApi } from './httpApi.js';
import { mockApi } from './mockApi.js';
import { getSettings } from './config.js';

export const settings = getSettings();
export const activeSource = settings.source;
/** Base URL of the active HTTP source, or null for the in-browser mock. */
export const activeBaseUrl = activeSource === 'mock' ? null : settings.urls[activeSource];

export const tasksApi = activeBaseUrl ? createHttpApi(activeBaseUrl) : mockApi;
export { ApiError } from './errors.js';
export { buildPath } from './query.js';
