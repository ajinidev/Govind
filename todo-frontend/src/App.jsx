import { useCallback, useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { TasksContext } from './hooks.js';
import Layout from './components/Layout.jsx';
import {
  AllPage, DayPage, DuePage, OverduePage, RangePage, StatusPage, TodayPage,
} from './pages/index.jsx';

export default function App() {
  const [revision, setRevision] = useState(0);
  const [form, setForm] = useState(undefined); // undefined = closed | null = new | task = edit
  const bump = useCallback(() => setRevision((r) => r + 1), []);
  const ctx = useMemo(() => ({ revision, bump, form, openForm: setForm, closeForm: () => setForm(undefined) }), [revision, bump, form]);

  return (
    <TasksContext.Provider value={ctx}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/today" replace />} />
          <Route path="/today" element={<TodayPage />} />
          <Route path="/all" element={<AllPage />} />
          <Route path="/due" element={<DuePage />} />
          <Route path="/overdue" element={<OverduePage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/range" element={<RangePage />} />
          <Route path="/day" element={<DayPage />} />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Route>
      </Routes>
    </TasksContext.Provider>
  );
}
