import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { storageService, Request } from '../services/storage';
import CreateRequestForm from './CreateRequestForm';
import * as XLSX from 'xlsx';

const Dashboard: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await storageService.getRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return !request.archived;
    if (filter === 'archived') return request.archived;
    return request.status === filter && !request.archived;
  });

  const handleStatusChange = async (id: string, newStatus: Request['status']) => {
    try {
      const updatedRequest = await storageService.updateRequest(id, { status: newStatus });
      if (updatedRequest) {
        setRequests(prevRequests =>
          prevRequests.map(request =>
            request.id === id ? updatedRequest : request
          )
        );
      }
    } catch (error) {
      console.error('Error updating request status:', error);
    }
  };

  const handleRemove = async (id: string) => {
    if (window.confirm('Ви дійсно хочете видалити цю заявку?')) {
      await storageService.removeRequest(id);
      loadRequests();
    }
  };

  const handleExportExcel = () => {
    // Групуємо заявки по місяцях
    const grouped: { [month: string]: any[] } = {};
    requests.forEach(({ createdAt, name, city, requestType }) => {
      // Очікується формат дати DD.MM.YYYY
      const [day, month, year] = createdAt.split('.');
      const sheetName = `${month}.${year}`;
      if (!grouped[sheetName]) grouped[sheetName] = [];
      grouped[sheetName].push({
        "Дата": createdAt,
        "Ім'я": name,
        "Місто": city,
        "Тип заявки": requestType
      });
    });
    const workbook = XLSX.utils.book_new();
    Object.entries(grouped).forEach(([sheetName, data]) => {
      const worksheet = XLSX.utils.json_to_sheet(data);
      // Автоширина колонок
      const cols = Object.keys(data[0] || {}).map(key => ({
        wch: Math.max(
          key.length,
          ...data.map((row: any) => (row[key] ? row[key].toString().length : 0))
        ) + 2
      }));
      worksheet['!cols'] = cols;
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });
    XLSX.writeFile(workbook, 'requests.xlsx');
  };

  const stats = {
    total: requests.length,
    new: requests.filter(r => r.status === 'new').length,
    inProgress: requests.filter(r => r.status === 'in-progress').length,
    completed: requests.filter(r => r.status === 'completed').length
  };

  if (loading) {
    return <div className="loading">Завантаження...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Панель керування заявками</h2>
        <div className="dashboard-actions">
          <button 
            className="create-button"
            onClick={() => setShowCreateForm(true)}
          >
            Створити заявку
          </button>
          <button
            className="create-button"
            style={{ backgroundColor: '#27ae60' }}
            onClick={handleExportExcel}
          >
            Експорт в Excel
          </button>
          <select 
            className="filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Всі заявки</option>
            <option value="new">Нові</option>
            <option value="in-progress">В процесі</option>
            <option value="completed">Завершені</option>
            <option value="archived">Архів</option>
          </select>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Всього заявок</h3>
          <p className="stat-number">{stats.total}</p>
        </div>
        <div className="stat-card">
          <h3>Нові заявки</h3>
          <p className="stat-number">{stats.new}</p>
        </div>
        <div className="stat-card">
          <h3>В процесі</h3>
          <p className="stat-number">{stats.inProgress}</p>
        </div>
        <div className="stat-card">
          <h3>Завершені</h3>
          <p className="stat-number">{stats.completed}</p>
        </div>
      </div>

      <div className="requests-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Ім'я</th>
              <th>Місто</th>
              <th>Тип заявки</th>
              <th>Статус</th>
              <th>Дата створення</th>
              <th>Дії</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={7} className="no-data">Немає даних для відображення</td>
              </tr>
            ) : (
              filteredRequests.map(request => (
                <tr key={request.id}>
                  <td>{request.id}</td>
                  <td>{request.name}</td>
                  <td>{request.city}</td>
                  <td>{request.requestType}</td>
                  <td>
                    <select
                      value={request.status}
                      onChange={(e) => handleStatusChange(request.id, e.target.value as Request['status'])}
                      className="status-select"
                    >
                      <option value="new">Нова</option>
                      <option value="in-progress">В процесі</option>
                      <option value="completed">Завершена</option>
                    </select>
                  </td>
                  <td>{request.createdAt}</td>
                  <td>
                    <button className="action-button" onClick={() => setSelectedRequest(request)}>
                      Переглянути
                    </button>
                    <button className="action-button" style={{marginLeft: 8, backgroundColor: '#e74c3c'}} onClick={() => handleRemove(request.id)}>
                      Видалити
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreateForm && (
        <div className="modal-overlay">
          <CreateRequestForm
            onRequestCreated={loadRequests}
            onClose={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {selectedRequest && (
        <div className="modal-overlay">
          <div className="create-request-form">
            <div className="form-header">
              <h3>Деталі заявки</h3>
              <button className="close-button" onClick={() => setSelectedRequest(null)}>×</button>
            </div>
            <div className="form-group"><b>ID:</b> {selectedRequest.id}</div>
            <div className="form-group"><b>Ім'я:</b> {selectedRequest.name}</div>
            <div className="form-group"><b>Місто:</b> {selectedRequest.city}</div>
            <div className="form-group"><b>Тип заявки:</b> {selectedRequest.requestType}</div>
            <div className="form-group"><b>Статус:</b> {selectedRequest.status}</div>
            <div className="form-group"><b>Дата створення:</b> {selectedRequest.createdAt}</div>
            <div className="form-actions">
              <button className="cancel-button" onClick={() => setSelectedRequest(null)}>Закрити</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 