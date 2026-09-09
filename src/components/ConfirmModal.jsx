import React from 'react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", confirmColor = "primary" }) => {
  if (!isOpen) return null;

  // Map confirmColor string to the correct class
  const btnClass = `btn btn-${confirmColor}`;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="mb-2">{title}</h3>
        <p className="text-muted mb-4" style={{ lineHeight: '1.5' }}>{message}</p>
        
        <div className="flex justify-between gap-3">
          <button
            onClick={onCancel}
            className="btn btn-secondary w-full"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`${btnClass} w-full`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
