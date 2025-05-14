import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaInbox, 
  FaSync, 
  FaEnvelope, 
  FaServer, 
  FaDatabase, 
  FaTimes, 
  FaWifi,
  FaCalendarAlt,
  FaUserCircle,
  FaArrowLeft
} from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const EmailInbox = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [protocol, setProtocol] = useState('imap');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    fetchEmails();
  }, [protocol]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      
      const url = `${API_URL}/email/${protocol}`;
      
      const response = await axios.get(url);
      setEmails(response.data);
      
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const handleSelectEmail = (email) => {
    setSelectedEmail(email);
  };

  const handleCloseEmail = () => {
    setSelectedEmail(null);
  };

  const formatSender = (from) => {
    if (!from) return 'Unknown sender';
    if (typeof from === 'object' && from.text) return from.text;
    return from;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="email-inbox card">
      <div className="d-flex justify-content-between align-items-center mb-0 p-4">
        <h2><FaInbox className="icon" /> Email Inbox</h2>
        <div className="d-flex align-items-center">
          <div className="btn-group protocol-tabs me-3">
            <button 
              className={`btn ${protocol === 'imap' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setProtocol('imap')}
            >
              <FaServer className="icon" /> IMAP
            </button>
            <button 
              className={`btn ${protocol === 'pop3' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setProtocol('pop3')}
            >
              <FaDatabase className="icon" /> POP3
            </button>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={fetchEmails}
            disabled={loading}
          >
            <FaSync className={`icon ${loading ? 'fa-spin' : ''}`} /> {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="card-body pt-0">
        {selectedEmail ? (
          <div className="email-detail card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <button 
                  className="btn btn-outline-secondary me-3 d-flex align-items-center" 
                  onClick={handleCloseEmail}
                >
                  <FaArrowLeft className="icon" /> Back to Inbox
                </button>
                <h5 className="mb-0">{selectedEmail.subject || 'No Subject'}</h5>
              </div>
              <button className="btn btn-sm btn-outline-secondary rounded-circle" onClick={handleCloseEmail}>
                <FaTimes />
              </button>
            </div>
            <div className="card-body">
              <div className="mb-3 d-flex align-items-center">
                <FaUserCircle className="icon me-2 fs-4" />
                <div>
                  <strong>From:</strong> {formatSender(selectedEmail.from) || selectedEmail.header?.from?.[0] || 'Unknown sender'}
                </div>
              </div>
              <div className="mb-3 d-flex align-items-center">
                <FaCalendarAlt className="icon me-2 fs-4" />
                <div>
                  <strong>Date:</strong> {formatDate(selectedEmail.date || selectedEmail.header?.date?.[0])}
                </div>
              </div>
              <hr />
              <div className="email-content">
                {selectedEmail.html ? (
                  <div dangerouslySetInnerHTML={{ __html: selectedEmail.html }} />
                ) : (
                  <pre className="email-text">{selectedEmail.text || selectedEmail.body || 'No content'}</pre>
                )}
              </div>
            </div>
            <div className="card-footer">
              <button 
                className="btn btn-primary" 
                onClick={handleCloseEmail}
              >
                <FaArrowLeft className="icon" /> Return to Inbox
              </button>
            </div>
          </div>
        ) : (
          <div className="email-list list-group">
            {loading ? (
              <div className="d-flex justify-content-center my-5">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : emails.length > 0 ? (
              emails.map((email, index) => (
                <button 
                  key={email.id || email.seqno || index}
                  className="list-group-item list-group-item-action todo-item"
                  onClick={() => handleSelectEmail(email)}
                >
                  <div className="d-flex w-100 justify-content-between">
                    <h5 className="mb-1">
                      <FaEnvelope className="icon" />
                      {email.subject || email.header?.subject?.[0] || 'No Subject'}
                    </h5>
                    <small className="d-flex align-items-center">
                      <FaCalendarAlt className="me-1" />
                      {formatDate(email.date || email.header?.date?.[0])}
                    </small>
                  </div>
                  <p className="mb-1 d-flex align-items-center">
                    <FaUserCircle className="me-2" />
                    From: {formatSender(email.from) || email.header?.from?.[0] || 'Unknown sender'}
                  </p>
                </button>
              ))
            ) : null}
          </div>
        )}
      </div>
      
      <div className="card-footer connection-status">
        <div className={`badge me-2 ${connected ? 'bg-success' : 'bg-danger'}`}>
          <FaWifi className="me-1" /> {connected ? 'Connected' : 'Disconnected'}
        </div>
        <span className="text-muted small">
          {protocol.toUpperCase()} Protocol | Last updated: {new Date().toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};

export default EmailInbox; 