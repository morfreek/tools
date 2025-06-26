import React, { createContext, useContext, useState } from 'react';
import Confirm from './Confirm';

const ConfirmContext = createContext();

export function ConfirmProvider({ children }) {
    const [confirmConfig, setConfirmConfig] = useState({
        show: false,
        title: '',
        message: '',
        onConfirm: () => {},
        confirmText: '',
        cancelText: '',
        confirmButtonClass: ''
    });

    const showConfirm = (config) => {
        setConfirmConfig({
            show: true,
            ...config
        });
    };

    const handleClose = () => {
        setConfirmConfig(prev => ({ ...prev, show: false }));
    };

    const handleConfirm = async () => {
        if (confirmConfig.onConfirm) {
            await confirmConfig.onConfirm();
        }
        handleClose();
    };

    return (
        <ConfirmContext.Provider value={{ showConfirm }}>
            {children}
            <Confirm
                {...confirmConfig}
                onClose={handleClose}
                onConfirm={handleConfirm}
            />
        </ConfirmContext.Provider>
    );
}

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
};
