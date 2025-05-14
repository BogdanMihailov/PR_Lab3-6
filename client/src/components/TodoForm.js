import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaCalendarAlt, FaTag, FaExclamationTriangle } from 'react-icons/fa';

const TodoForm = ({ onSave, todo, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    completed: false,
    priority: 'medium',
    dueDate: '',
    category: ''
  });

  useEffect(() => {
    if (todo) {
      setFormData({
        title: todo.title || '',
        description: todo.description || '',
        completed: todo.completed || false,
        priority: todo.priority || 'medium',
        dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '',
        category: todo.category || ''
      });
    }
  }, [todo]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Title is required');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-gradient text-center">
        <h5 className="card-title mb-0">{todo ? 'Edit Task' : 'Create New Task'}</h5>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="title" className="form-label fw-bold">Title</label>
            <input
              type="text"
              className="form-control"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter task title"
              required
            />
          </div>
          
          <div className="mb-3">
            <label htmlFor="description" className="form-label fw-bold">Description</label>
            <textarea
              className="form-control"
              id="description"
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter task description"
            ></textarea>
          </div>
          
          <div className="row mb-3">
            <div className="col-md-6">
              <label htmlFor="priority" className="form-label d-flex align-items-center fw-bold">
                <FaExclamationTriangle className="icon" /> Priority
              </label>
              <select
                className="form-select"
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div className="col-md-6">
              <label htmlFor="dueDate" className="form-label d-flex align-items-center fw-bold">
                <FaCalendarAlt className="icon" /> Due Date
              </label>
              <input
                type="date"
                className="form-control"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                style={{ height: 'calc(1.5em + 0.75rem + 2px)' }}
              />
            </div>
          </div>
          
          <div className="mb-4 form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="completed"
              name="completed"
              checked={formData.completed}
              onChange={handleChange}
            />
            <label className="form-check-label" htmlFor="completed">Completed</label>
          </div>
          
          <div className="d-flex justify-content-center">
            <button type="button" className="btn btn-outline-secondary me-2" onClick={onCancel}>
              <FaTimes className="icon" /> Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <FaSave className="icon" /> {todo ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TodoForm; 