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
            <Card.Header className="py-3 d-flex flex-wrap gap-2 justify-content-between align-items-center">
                <h2 className="h6 mb-0 fw-semibold">Configuración del plan JMeter</h2>
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
            
            <div className="px-3 pt-3">
                <Tabs
                    activeKey={activeKey}
                    onSelect={(k) => setActiveKey(k)}
                    className="pestanas-plan"
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
                
            </div>

            <Card.Body>
                <div>
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
