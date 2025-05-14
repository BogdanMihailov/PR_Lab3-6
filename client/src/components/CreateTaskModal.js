import React from 'react';
import ReactDOM from 'react-dom';
import TodoForm from './TodoForm';
import { FaTimes, FaSave } from 'react-icons/fa';

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

const CreateTaskModal = ({ show = true, onClose, onSave, todo }) => {
  if (!show) return null;

  return (
    <ModalPortal show={show}>
      <div className="modal-content">
        <div className="modal-body">
          <TodoForm 
            onSave={(formData) => {
              onSave(formData);
              onClose();
            }} 
            todo={todo} 
            onCancel={onClose}
          />
        </div>
      </div>
    </ModalPortal>
  );
};

export default CreateTaskModal; 