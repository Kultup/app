import React, { useState } from 'react';
import { storageService } from '../services/storage';
import './CreateRequestForm.css';

interface CreateRequestFormProps {
  onRequestCreated: () => void;
  onClose: () => void;
}

const CreateRequestForm: React.FC<CreateRequestFormProps> = ({ onRequestCreated, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    requestType: '',
    status: 'new' as const
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await storageService.addRequest(formData);
      onRequestCreated();
      onClose();
    } catch (error) {
      console.error('Error creating request:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="create-request-form">
      <div className="form-header">
        <h3>Створити нову заявку</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Ім'я:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="city">Місто:</label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="requestType">Тип заявки:</label>
          <select
            id="requestType"
            name="requestType"
            value={formData.requestType}
            onChange={handleChange}
            required
          >
            <option value="">Виберіть тип заявки</option>
            <option value="Загальне питання">Загальне питання</option>
            <option value="Технічна підтримка">Технічна підтримка</option>
            <option value="Скарга">Скарга</option>
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-button">Створити</button>
          <button type="button" className="cancel-button" onClick={onClose}>Скасувати</button>
        </div>
      </form>
    </div>
  );
};

export default CreateRequestForm; 