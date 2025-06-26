import React from 'react';

export default function Confirm({ 
    show, 
    onClose, 
    onConfirm, 
    title = 'Confirmar acción',
    message = '¿Estás seguro de realizar esta acción?',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    confirmButtonClass = 'btn-outline-secondary',
    size = 'sm'
}) {
    return (
        <div 
            className={`modal fade ${show ? 'show d-block' : ''}`} 
            tabIndex="-1" 
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
            <div className={`modal-dialog modal-dialog-centered modal-${size}`}>
                <div className="modal-content">
                    <div className="modal-header pb-1 pt-2">
                        <h5 className="modal-title">{title}</h5>
                        <button 
                            type="button" 
                            className="btn-close" 
                            onClick={onClose}
                        ></button>
                    </div>
                    <div className="modal-body">
                        <p className="mb-0">{message}</p>
                    </div>
                    <div className="modal-footer pt-1 pb-2">
                        <button 
                            type="button" 
                            className={`btn btn-sm ${confirmButtonClass}`}
                            onClick={onConfirm}
                        >
                            {confirmText}
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-sm btn-danger"
                            onClick={onClose}
                        >
                            {cancelText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
