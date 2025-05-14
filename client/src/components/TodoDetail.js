import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactDOM from 'react-dom';
import { 
  FaEnvelope, 
  FaEdit, 
  FaTrashAlt, 
  FaCheckCircle, 
  FaArrowLeft, 
  FaCalendarAlt,
  FaClipboardCheck,
  FaClock,
  FaTag,
  FaExclamationTriangle,
  FaTimes
} from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ModalPortal = ({ children, show }) => {
  const [portalElement, setPortalElement] = useState(null);

  useEffect(() => {
    const element = document.getElementById('modal-root');
    setPortalElement(element || document.createElement('div'));
  }, []);

  useEffect(() => {
    if (!portalElement) return;

    if (!document.getElementById('modal-root')) {
      portalElement.id = 'modal-root';
      document.body.appendChild(portalElement);
    }

    return () => {
      if (portalElement.parentElement && !document.getElementById('modal-root')) {
        document.body.removeChild(portalElement);
      }
    };
  }, [portalElement]);

  if (!show || !portalElement) return null;
  return ReactDOM.createPortal(children, portalElement);
};

const TodoDetail = ({ todo: propTodo, show = true, onClose, isModal = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [todo, setTodo] = useState(propTodo || null);
  const [isLoading, setIsLoading] = useState(!propTodo);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Если передан пропс todo, используем его
    if (propTodo) {
      setTodo(propTodo);
      setIsLoading(false);
      return;
    }
    
    // Иначе загружаем данные с сервера
    if (id) {
      const fetchTodo = async () => {
        try {
          setIsLoading(true);
          const response = await axios.get(`${API_URL}/todos/${id}`);
          setTodo(response.data);
          setIsLoading(false);
        } catch (err) {
          setError('Failed to load task. It may have been deleted or does not exist.');
          setIsLoading(false);
        }
      };

      fetchTodo();
    }
  }, [id, propTodo]);
  
  const handleBackClick = (e) => {
    if (isModal && onClose) {
      e.preventDefault();
      onClose();
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch(priority?.toLowerCase()) {
      case 'high':
        return 'badge-priority-high';
      case 'medium':
        return 'badge-priority-medium';
      case 'low':
        return 'badge-priority-low';
      default:
        return 'bg-secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <FaExclamationTriangle className="icon" /> {error}
        <div className="mt-3">
          <Link to="/" className="btn btn-primary">
            <FaArrowLeft className="icon" /> Back to Tasks
          </Link>
        </div>
      </div>
    );
  }

  if (!todo) return null;

  const todoDetailContent = (
    <div className={isModal ? "position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" : ""}
         style={isModal ? { zIndex: 1050 } : {}}>
      <div className="card border-0 shadow-sm" style={{ maxWidth: '500px', width: '100%' }}>
        <div className="card-header bg-gradient text-center d-flex justify-content-between align-items-center" style={{ borderBottom: '2px solid rgba(0,0,0,0.05)' }}>
          <div style={{ width: '24px' }}></div>
          <h3 className="mb-0" style={{ fontSize: '1.25rem' }}>Task Details</h3>
          <div style={{ width: '24px' }}></div>
        </div>
        <div className="card-body">
          <div className="text-center mb-2">
            <h5 className="mb-0" style={{ fontSize: '1.25rem' }}>{todo.title}</h5>
            {todo.completed && (
              <span className="badge bg-success">Completed</span>
            )}
            {todo.priority && (
              <span className={`badge ms-2 ${getPriorityBadgeClass(todo.priority)}`}>
                {todo.priority}
              </span>
            )}
          </div>
          <div className="mb-3 d-flex align-items-center justify-content-center">
            <FaClock className="text-dark me-2" />
            <div>
              <strong>Created:</strong> {new Date(todo.createdAt).toLocaleString()}
            </div>
          </div>
          <div className="mb-0">
            <h6 className="card-subtitle mb-2 text-dark">Description</h6>
            <p className="card-text mb-2">{todo.description || 'No description provided.'}</p>
          </div>
          <div className="d-flex justify-content-center mt-2">
            {isModal ? (
              <button className="btn btn-outline-secondary" onClick={onClose}>
                <FaTimes className="icon" /> Close
              </button>
            ) : (
              <Link to="/" className="btn btn-outline-secondary" onClick={handleBackClick}>
                <FaArrowLeft className="icon" /> Back to Tasks
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <ModalPortal show={show}>
        {todoDetailContent}
      </ModalPortal>
    );
  }

  return todoDetailContent;
};

export default TodoDetail; 