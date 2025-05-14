import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { FaPaperPlane, FaTimes } from 'react-icons/fa';

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

const EmailModal = ({ show = true, handleClose, onClose, todo }) => {
  const closeModal = handleClose || onClose;
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (todo) {
      setSubject(`Task: ${todo.title}`);
      let msgContent = `Task Details:\n\nTitle: ${todo.title}\n`;
      if (todo.description) msgContent += `Description: ${todo.description}\n`;
      if (todo.dueDate) msgContent += `Due Date: ${new Date(todo.dueDate).toLocaleDateString()}\n`;
      if (todo.priority) msgContent += `Priority: ${todo.priority}\n`;
      if (todo.category) msgContent += `Category: ${todo.category}\n`;
      
      msgContent += `\nStatus: ${todo.completed ? 'Completed' : 'Pending'}\n`;
      msgContent += `\nThis task was shared from my Todo App.`;
      
      setMessage(msgContent);
    }
  }, [todo]);

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (!subject.trim()) {
      setError('Subject is required');
      return;
    }
    
    if (!message.trim()) {
      setError('Message is required');
      return;
    }
    
    setError(null);
    setIsLoading(true);
    
    try {
      const res = await axios.post(`${API_URL}/email/send`, {
        to: email,
        subject,
        text: message,
        todoId: todo?._id
      });
      
      setSuccess(true);
      setIsLoading(false);
      
      setTimeout(() => {
        setSuccess(false);
        closeModal();
      }, 2000);
    } catch (err) {
      setIsLoading(false);
      setError(err.response?.data?.message || 'Failed to send email. Please try again.');
    }
  };

  if (!show) return null;

  return (
    <ModalPortal show={show}>
      <div className="modal show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content bg-white" style={{ border: 'none', borderRadius: '0.25rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
            <div className="modal-header" style={{ backgroundColor: 'white', borderBottom: '2px solid rgba(0,0,0,0.1)', padding: '0.5rem 1rem' }}>
              <div className="w-100 text-center">
                <h5 className="modal-title" style={{ color: '#000', fontSize: '1.25rem', margin: '0', fontWeight: 'bold' }}>
                  <FaPaperPlane className="me-2" style={{ color: "#000" }} />
                  Share Task via Email
                </h5>
              </div>
            </div>
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger">
                  <FaTimes className="me-2" />
                  {error}
                </div>
              )}
              
              {success && (
                <div className="alert alert-success">
                  Email sent successfully!
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label fw-bold">Recipient Email</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="subject" className="form-label fw-bold">Subject</label>
                  <input
                    type="text"
                    className="form-control"
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="message" className="form-label fw-bold">Message</label>
                  <textarea
                    className="form-control"
                    id="message"
                    rows="6"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  ></textarea>
                </div>
                
                <div className="d-flex justify-content-center mt-4">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary me-1" 
                    onClick={closeModal}
                  >
                    <FaTimes className="me-2" />
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn ms-1"
                    disabled={isLoading}
                    style={{
                      background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                      color: 'white',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 8px 15px rgba(34, 197, 94, 0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.3)';
                    }}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Sending...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane className="me-2" />
                        Send Email
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default EmailModal; 