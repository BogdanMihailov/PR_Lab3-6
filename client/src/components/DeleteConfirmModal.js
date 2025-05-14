import React from 'react';
import ReactDOM from 'react-dom';
import { FaExclamationTriangle, FaTrashAlt, FaTimes } from 'react-icons/fa';

const ModalPortal = ({ children, show }) => {
  const [portalElement, setPortalElement] = React.useState(null);

  React.useEffect(() => {
    const element = document.getElementById('modal-root');
    setPortalElement(element || document.createElement('div'));
  }, []);

  React.useEffect(() => {
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

const DeleteConfirmModal = ({ show, onClose, onConfirm, todoTitle }) => {
  if (!show) return null;

  return (
    <ModalPortal show={show}>
      <div className="modal show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content bg-white" style={{ border: 'none', borderRadius: '0.25rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
            <div className="modal-header" style={{ backgroundColor: 'white', borderBottom: '2px solid rgba(0,0,0,0.1)', padding: '0.5rem 1rem' }}>
              <div className="w-100 text-center">
                <h5 className="modal-title" style={{ color: '#000', fontSize: '1.25rem', margin: '0', fontWeight: 'bold' }}>
                  <FaExclamationTriangle className="me-2" style={{ color: "#000" }} />
                  Confirm Deletion
                </h5>
              </div>
            </div>
            <div className="modal-body pb-0">
              <p className="mb-0">
                Are you sure you want to delete the task <strong>"{todoTitle}"</strong>?
                <br />
                This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer border-0 d-flex justify-content-center pt-2" style={{ gap: "1px" }}>
              <button 
                type="button" 
                className="btn btn-outline-secondary" 
                onClick={onClose}
              >
                <FaTimes className="me-2" />
                Cancel
              </button>
              <button 
                type="button" 
                className="btn"
                onClick={onConfirm}
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
                <FaTrashAlt className="me-2" />
                Delete Task
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default DeleteConfirmModal; 