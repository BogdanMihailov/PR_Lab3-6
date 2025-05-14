import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import CreateTaskModal from './CreateTaskModal';
import EmailModal from './EmailModal';
import EmailInbox from './EmailInbox';
import TodoDetail from './TodoDetail';
import DeleteConfirmModal from './DeleteConfirmModal';
import { 
  FaEnvelope, 
  FaEdit, 
  FaTrashAlt, 
  FaEye, 
  FaClipboardCheck, 
  FaInbox, 
  FaPlusCircle, 
  FaTimes,
  FaCalendarAlt,
  FaClock,
  FaTag
} from 'react-icons/fa';
import { useSocket } from '../context/SocketContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TodoList = () => {
  const [todos, setTodos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedTaskForEmail, setSelectedTaskForEmail] = useState(null);
  const [activeTab, setActiveTab] = useState('tasks');
  const { socket, connected } = useSocket();
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState(null);

  useEffect(() => {
    fetchTodos();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('todoCreated', (newTodo) => {
      setTodos(prevTodos => [newTodo, ...prevTodos]);
    });

    socket.on('todoUpdated', (updatedTodo) => {
      setTodos(prevTodos => 
        prevTodos.map(todo => 
          todo._id === updatedTodo._id ? updatedTodo : todo
        )
      );
    });

    socket.on('todoDeleted', (data) => {
      setTodos(prevTodos => 
        prevTodos.filter(todo => todo._id !== data.id)
      );
    });

    return () => {
      socket.off('todoCreated');
      socket.off('todoUpdated');
      socket.off('todoDeleted');
    };
  }, [socket]);

  const fetchTodos = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/todos`);
      setTodos(response.data);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (todo) => {
    setTodoToDelete(todo);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setTodoToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!todoToDelete) return;
    
    try {
      await axios.delete(`${API_URL}/todos/${todoToDelete._id}`);
      setTodos(todos.filter(todo => todo._id !== todoToDelete._id));
      setShowDeleteModal(false);
      setTodoToDelete(null);
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const handleToggleComplete = async (todo) => {
    try {
      const updatedTodo = { ...todo, completed: !todo.completed };
      const response = await axios.put(`${API_URL}/todos/${todo._id}`, updatedTodo);
      setTodos(todos.map(t => t._id === todo._id ? response.data : t));
    } catch (error) {
    }
  };

  const handleEdit = (todo) => {
    setEditingTodo(todo);
    setShowForm(true);
  };

  const handleSave = async (formData) => {
    try {
      if (editingTodo) {
        const response = await axios.put(`${API_URL}/todos/${editingTodo._id}`, formData);
        setTodos(todos.map(t => t._id === editingTodo._id ? response.data : t));
      } else {
        const response = await axios.post(`${API_URL}/todos`, formData);
        setTodos([response.data, ...todos]);
      }
      setShowForm(false);
      setEditingTodo(null);
    } catch (error) {
    }
  };

  const handleSendEmail = (todo) => {
    setSelectedTaskForEmail(todo);
    setShowEmailModal(true);
  };

  const handleCloseEmailModal = () => {
    setShowEmailModal(false);
    setSelectedTaskForEmail(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTodo(null);
  };

  const handleViewTask = (todo) => {
    setSelectedTodo(todo);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedTodo(null);
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

  if (isLoading && activeTab === 'tasks') {
    return (
      <div className="d-flex justify-content-center mt-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'tasks' ? 'active' : ''}`} 
            onClick={() => setActiveTab('tasks')}
          >
            <FaClipboardCheck className="icon" /> Tasks
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'email' ? 'active' : ''}`} 
            onClick={() => setActiveTab('email')}
          >
            <FaInbox className="icon" /> Email Inbox
          </button>
        </li>
      </ul>

      {activeTab === 'tasks' ? (
        <div className="card p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2><FaClipboardCheck className="icon" /> My Tasks</h2>
            <button 
              className="btn btn-primary" 
              onClick={() => {
                setEditingTodo(null);
                setShowForm(!showForm);
              }}
            >
              <FaPlusCircle className="icon" /> Add New Task
            </button>
          </div>

          {showForm && (
            <CreateTaskModal
              show={showForm}
              onClose={handleCloseForm}
              onSave={handleSave}
              todo={editingTodo}
            />
          )}

          {todos.length === 0 ? (
            <div className="alert alert-info text-center mb-0">
              No tasks found. Add a new task to get started!
            </div>
          ) : (
            <div className="list-group">
              {todos.map(todo => (
                <div key={todo._id} className="list-group-item list-group-item-action todo-item">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <div className="todo-item-header">
                        <div className="form-check">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            checked={todo.completed} 
                            onChange={() => handleToggleComplete(todo)}
                          />
                          <span 
                            className={todo.completed ? 'todo-completed' : ''}
                            onClick={() => handleToggleComplete(todo)}
                          >
                            {todo.title}
                          </span>
                        </div>
                        {todo.priority && (
                          <span className={`badge ${getPriorityBadgeClass(todo.priority)}`}>
                            {todo.priority}
                          </span>
                        )}
                      </div>
                      
                      <p className="mb-1 text-muted">{todo.description}</p>
                      
                      <div className="todo-metadata">
                        {todo.dueDate && (
                          <span>
                            <FaCalendarAlt className="icon" />
                            {new Date(todo.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        <span>
                          <FaClock className="icon" />
                          {new Date(todo.createdAt).toLocaleDateString()}
                        </span>
                        {todo.category && (
                          <span>
                            <FaTag className="icon" />
                            {todo.category}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="btn-group">
                      <button 
                        className="btn btn-view btn-action" 
                        onClick={() => handleViewTask(todo)}
                      >
                        <FaEye />
                      </button>
                      <button 
                        className="btn btn-secondary btn-action" 
                        onClick={() => handleEdit(todo)}
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="btn btn-danger btn-action" 
                        onClick={() => handleDeleteClick(todo)}
                      >
                        <FaTrashAlt />
                      </button>
                      <button 
                        className="btn btn-email btn-action" 
                        onClick={() => handleSendEmail(todo)}
                      >
                        <FaEnvelope />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showEmailModal && (
            <EmailModal 
              show={showEmailModal}
              handleClose={handleCloseEmailModal} 
              todo={selectedTaskForEmail} 
            />
          )}

          {showDetailModal && selectedTodo && (
            <TodoDetail 
              todo={selectedTodo}
              show={showDetailModal}
              onClose={handleCloseDetailModal}
              isModal={true}
            />
          )}

          {showDeleteModal && todoToDelete && (
            <DeleteConfirmModal 
              show={showDeleteModal}
              onClose={handleCloseDeleteModal}
              onConfirm={handleConfirmDelete}
              todoTitle={todoToDelete.title}
            />
          )}
        </div>
      ) : (
        <EmailInbox />
      )}
    </div>
  );
};

export default TodoList; 