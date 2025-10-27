import React, { useState } from 'react';
import { Tabs, Tab, Card, Button } from 'react-bootstrap';
import { FaCog, FaUsers, FaGlobe, FaDatabase, FaClock, FaChartLine } from 'react-icons/fa';
import GeneralTab from './tabs/GeneralTab';
import ThreadsTab from './tabs/ThreadsTab';
import RequestsTab from './tabs/RequestsTab';
import CsvDataTab from './tabs/CsvDataTab';
import TimersTab from './tabs/TimersTab';
import ListenersTab from './tabs/ListenersTab';

const TabNavigation = ({ 
    value, 
    onChange, 
    requests, 
    onRequestAdd, 
    onRequestDelete, 
    onRequestDuplicate, 
    onRequestChange,
    onRequestClearAll,
    onOpenPreview,
    onLoadJmx
}) => {
    const [activeKey, setActiveKey] = useState('general');

    return (
        <Card className="mb-4">
            <Card.Header 
                className="py-3 d-flex justify-content-between align-items-center"
                style={{ 
                    position: 'sticky', 
                    top: 0, 
                    zIndex: 1020,
                    backgroundColor: '#f8f9fa',
                    borderBottom: '1px solid #dee2e6',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
            >
                <h5 className="mb-0">Configuración Completa del Plan JMeter</h5>
                <div className="d-flex gap-2">
                    <Button 
                        size="sm" 
                        variant="outline-secondary" 
                        onClick={() => document.getElementById('jmx-file-input').click()}
                    >
                        Cargar .jmx
                    </Button>
                    <input
                        id="jmx-file-input"
                        type="file"
                        accept=".jmx"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                            const file = e.target.files[0];
                            if (file && onLoadJmx) {
                                onLoadJmx(file);
                            }
                            e.target.value = ''; // Reset input
                        }}
                    />
                    <Button size="sm" variant="primary" onClick={onOpenPreview}>
                        Previsualizar .jmx
                    </Button>
                </div>
            </Card.Header>
            
            <div 
                style={{ 
                    position: 'sticky', 
                    top: '64px', 
                    zIndex: 1010,
                    backgroundColor: '#ffffff',
                    borderBottom: '1px solid #f0f0f0',
                    // marginBottom: '16px'
                }}
                className='border-bottom-0 mb-2 '
            >
                <Tabs
                    activeKey={activeKey}
                    onSelect={(k) => setActiveKey(k)}
                    className="custom-tabs pt-3 px-2"
                    fill
                >
                    <Tab 
                        eventKey="general" 
                        title={
                            <span className="d-flex align-items-center gap-2 px-2 py-1">
                                <FaCog className="tab-icon" />
                                <span className="d-none d-lg-inline tab-text">General</span>
                                <span className="d-none d-md-inline d-lg-none tab-text-short">Gen</span>
                            </span>
                        }
                    />
                    
                    <Tab 
                        eventKey="threads" 
                        title={
                            <span className="d-flex align-items-center gap-2 px-2 py-1">
                                <FaUsers className="tab-icon" />
                                <span className="d-none d-lg-inline tab-text">Hilos</span>
                                <span className="d-none d-md-inline d-lg-none tab-text-short">Hilo</span>
                            </span>
                        }
                    />
                    
                    <Tab 
                        eventKey="requests" 
                        title={
                            <span className="d-flex align-items-center gap-2 px-2 py-1">
                                <FaGlobe className="tab-icon" />
                                <span className="d-none d-lg-inline tab-text">Peticiones HTTP</span>
                                <span className="d-none d-md-inline d-lg-none tab-text-short">HTTP</span>
                            </span>
                        }
                    />
                    
                    <Tab 
                        eventKey="csvdata" 
                        title={
                            <span className="d-flex align-items-center gap-2 px-2 py-1">
                                <FaDatabase className="tab-icon" />
                                <span className="d-none d-lg-inline tab-text">Datos CSV</span>
                                <span className="d-none d-md-inline d-lg-none tab-text-short">CSV</span>
                            </span>
                        }
                    />
                    
                    <Tab 
                        eventKey="timers" 
                        title={
                            <span className="d-flex align-items-center gap-2 px-2 py-1">
                                <FaClock className="tab-icon" />
                                <span className="d-none d-lg-inline tab-text">Temporizadores</span>
                                <span className="d-none d-md-inline d-lg-none tab-text-short">Timer</span>
                            </span>
                        }
                    />
                    
                    <Tab 
                        eventKey="listeners" 
                        title={
                            <span className="d-flex align-items-center gap-2 px-2 py-1">
                                <FaChartLine className="tab-icon" />
                                <span className="d-none d-lg-inline tab-text">Listeners</span>
                                <span className="d-none d-md-inline d-lg-none tab-text-short">List</span>
                            </span>
                        }
                    />
                </Tabs>
                
                <style>{`
                    .custom-tabs .nav-tabs {
                        border-bottom: 1px solid #f0f0f0;
                        background: #ffffff;
                        padding: 0;
                        margin: 0 20px;
                    }
                    
                    .custom-tabs .nav-tabs .nav-link {
                        border: none;
                        border-bottom: 2px solid transparent;
                        border-radius: 0;
                        margin: 0;
                        padding: 12px 16px;
                        background: transparent;
                        color: #8e8e93;
                        font-weight: 400;
                        font-size: 0.95em;
                        transition: all 0.2s ease;
                        position: relative;
                        min-height: auto;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        letter-spacing: 0.2px;
                    }
                    
                    .custom-tabs .nav-tabs .nav-link:hover {
                        background: rgba(0, 123, 255, 0.02);
                        color: #495057;
                        border-bottom-color: #dee2e6;
                    }
                    
                    .custom-tabs .nav-tabs .nav-link.active {
                        background: transparent;
                        border-bottom-color: #007bff;
                        color: #007bff;
                        font-weight: 500;
                    }
                    
                    .tab-icon {
                        font-size: 1em;
                        transition: all 0.2s ease;
                        opacity: 0.7;
                    }
                    
                    .custom-tabs .nav-tabs .nav-link:hover .tab-icon {
                        opacity: 0.9;
                    }
                    
                    .custom-tabs .nav-tabs .nav-link.active .tab-icon {
                        opacity: 1;
                    }
                    
                    .tab-text, .tab-text-short {
                        font-size: inherit;
                        font-weight: inherit;
                        letter-spacing: inherit;
                        margin-left: 8px;
                    }
                    
                    .custom-tabs .tab-content {
                        background: #ffffff;
                        border: none;
                        padding: 32px 20px;
                    }
                    
                    @media (max-width: 992px) {
                        .custom-tabs .nav-tabs {
                            margin: 0 16px;
                        }
                        
                        .custom-tabs .nav-tabs .nav-link {
                            padding: 10px 14px;
                            font-size: 0.9em;
                        }
                        
                        .custom-tabs .tab-content {
                            padding: 24px 16px;
                        }
                    }
                    
                    @media (max-width: 768px) {
                        .custom-tabs .nav-tabs {
                            margin: 0 12px;
                        }
                        
                        .custom-tabs .nav-tabs .nav-link {
                            padding: 8px 12px;
                        }
                        
                        .tab-text {
                            margin-left: 6px;
                        }
                    }
                    
                    @media (max-width: 576px) {
                        .custom-tabs .nav-tabs {
                            margin: 0 8px;
                        }
                        
                        .custom-tabs .nav-tabs .nav-link {
                            padding: 6px 8px;
                            font-size: 0.85em;
                        }
                        
                        .tab-text, .tab-text-short {
                            margin-left: 4px;
                        }
                        
                        .custom-tabs .tab-content {
                            padding: 20px 8px;
                        }
                    }
                `}</style>
            </div>

            <Card.Body>
                <div className="tab-content">
                    {activeKey === 'general' && (
                        <GeneralTab value={value} onChange={onChange} />
                    )}
                    
                    {activeKey === 'threads' && (
                        <ThreadsTab value={value} onChange={onChange} />
                    )}
                    
                    {activeKey === 'requests' && (
                        <RequestsTab 
                            requests={requests}
                            onAdd={onRequestAdd}
                            onDelete={onRequestDelete}
                            onDuplicate={onRequestDuplicate}
                            onChange={onRequestChange}
                            onClearAll={onRequestClearAll}
                        />
                    )}
                    
                    {activeKey === 'csvdata' && (
                        <CsvDataTab value={value} onChange={onChange} />
                    )}
                    
                    {activeKey === 'timers' && (
                        <TimersTab value={value} onChange={onChange} />
                    )}
                    
                    {activeKey === 'listeners' && (
                        <ListenersTab value={value} onChange={onChange} />
                    )}
                </div>
            </Card.Body>
        </Card>
    );
};

export default TabNavigation;
