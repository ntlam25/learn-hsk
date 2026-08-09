import { useEffect, useState } from 'react';
import api from '../../api/client';
import MoodSwitcher from '../../components/MoodSwitcher';

export default function SettingsPage() {
  const [mood, setMood] = useState(null);

  useEffect(() => {
    api.get('/settings').then((res) => setMood(res.data.mood)).catch(() => {});
  }, []);

  return (
    <main className="page admin-dashboard-page">
      <div className="admin-header">
        <h1>Cài đặt hệ thống</h1>
      </div>

      <fieldset>
        <legend>Giao diện</legend>
        {mood == null ? <div className="page-loading">Đang tải…</div> : <MoodSwitcher mood={mood} onChanged={setMood} />}
      </fieldset>
    </main>
  );
}
