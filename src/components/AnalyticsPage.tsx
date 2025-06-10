import React, { useState, useEffect } from 'react';
import { storageService, Request } from '../services/storage';

const getMonthString = (date: Date) => `${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;

const AnalyticsPage: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [month, setMonth] = useState(getMonthString(new Date()));
  const [mode, setMode] = useState<'month' | 'period'>('month');
  const [archivePage, setArchivePage] = useState(1);
  const archivePageSize = 10;

  useEffect(() => {
    storageService.getRequests().then(setRequests);
  }, []);

  // Фільтрація за місяцем
  const filteredByMonth = requests.filter(r => {
    if (!r.createdAt) return false;
    const [day, m, y] = r.createdAt.split('.');
    return `${m}.${y}` === month;
  });

  // Фільтрація за періодом
  const filteredByPeriod = requests.filter(r => {
    if (!r.createdAt || !from || !to) return false;
    const [day, m, y] = r.createdAt.split('.');
    const d = new Date(+y, +m - 1, +day);
    return d >= new Date(from) && d <= new Date(to);
  });

  const stats = (arr: Request[]) => ({
    total: arr.length,
    new: arr.filter(r => r.status === 'new').length,
    inProgress: arr.filter(r => r.status === 'in-progress').length,
    completed: arr.filter(r => r.status === 'completed').length,
    archived: arr.filter(r => r.archived).length
  });

  const statsLabels: Record<string, string> = {
    total: 'Всього',
    new: 'Нові',
    inProgress: 'В процесі',
    completed: 'Завершені',
    archived: 'Архівовані'
  };

  const archivedRequests = (mode === 'month' ? filteredByMonth : filteredByPeriod).filter(r => r.archived);
  const archivePageCount = Math.ceil(archivedRequests.length / archivePageSize);
  const pagedArchived = archivedRequests.slice((archivePage - 1) * archivePageSize, archivePage * archivePageSize);

  return (
    <div style={{maxWidth: 600, margin: '2rem auto', background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px #0001'}}>
      <h2>Аналітика заявок</h2>
      <div style={{marginBottom: 24}}>
        <label>
          <input type="radio" checked={mode === 'month'} onChange={() => setMode('month')} /> За місяць
        </label>
        <label style={{marginLeft: 16}}>
          <input type="radio" checked={mode === 'period'} onChange={() => setMode('period')} /> За період
        </label>
      </div>
      {mode === 'month' ? (
        <div style={{marginBottom: 24}}>
          <label>Місяць: </label>
          <input type="month" value={month.split('.').reverse().join('-')} onChange={e => {
            const [y, m] = e.target.value.split('-');
            setMonth(`${m}.${y}`);
          }} />
        </div>
      ) : (
        <div style={{marginBottom: 24}}>
          <label>З: </label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
          <label style={{marginLeft: 8}}>По: </label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} />
        </div>
      )}
      <div style={{marginTop: 24}}>
        <h3>Статистика</h3>
        <ul>
          {Object.entries(stats(mode === 'month' ? filteredByMonth : filteredByPeriod)).map(([k, v]) => (
            <li key={k}><b>{statsLabels[k] || k}:</b> {v}</li>
          ))}
        </ul>
      </div>
      {archivedRequests.length > 0 && (
        <div style={{marginTop: 32}}>
          <h3>Архівовані заявки</h3>
          <table style={{width: '100%', borderCollapse: 'collapse', background: '#fafafa'}}>
            <thead>
              <tr>
                <th style={{borderBottom: '1px solid #eee', padding: 8}}>Дата</th>
                <th style={{borderBottom: '1px solid #eee', padding: 8}}>Ім'я</th>
                <th style={{borderBottom: '1px solid #eee', padding: 8}}>Місто</th>
                <th style={{borderBottom: '1px solid #eee', padding: 8}}>Тип заявки</th>
                <th style={{borderBottom: '1px solid #eee', padding: 8}}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {pagedArchived.map(r => (
                <tr key={r.id}>
                  <td style={{padding: 8}}>{r.createdAt}</td>
                  <td style={{padding: 8}}>{r.name}</td>
                  <td style={{padding: 8}}>{r.city}</td>
                  <td style={{padding: 8}}>{r.requestType}</td>
                  <td style={{padding: 8}}>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 16, gap: 8}}>
            <button onClick={() => setArchivePage(p => Math.max(1, p - 1))} disabled={archivePage === 1}>Назад</button>
            <span>Сторінка {archivePage} з {archivePageCount}</span>
            <button onClick={() => setArchivePage(p => Math.min(archivePageCount, p + 1))} disabled={archivePage === archivePageCount}>Вперед</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage; 