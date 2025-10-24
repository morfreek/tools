import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, matchPath } from 'react-router-dom'; // Import useLocation and matchPath
import Sidebar from '@/components/Sidebar';
import RequireAuth from '@/components/RequireAuth';
import Home from '@/pages/Home';
import JMeterTestGenerator from '@/pages/JMeterTestGenerator';
import PhpStanViewer from '@/pages/PhpStanViewer';
import ServersRequestPage from '@/pages/ServersRequestPage'; // Import ServersRequestPage
import NotFound from '@/pages/NotFound'; // Import the 404 page component

import Projects from '@/pages/Projects';
import ProjectDetail from '@/pages/ProjectDetail';
import ProjectReviews from '@/pages/ProjectReviews';
import ProjectNotes from '@/pages/ProjectNotes';
import ProjectFiles from '@/pages/ProjectFiles'; // Import ProjectFiles
import ProjectContinuousDeployment from '@/pages/ProjectContinuousDeployment'; // Import ProjectContinuousDeployment
import { ToastProvider } from '@/components/ToastContext'; // Importa el ToastProvider
import { ConfirmProvider } from '@/components/ConfirmContext'; // Import ConfirmProvider
import JMeterTestCreator from '@/pages/JMeterTestCreator'; // NUEVO: import de la nueva página

const basename = import.meta.env.VITE_BASE_URL;

// Hook personalizado para detectar el ancho de la ventana
const useWindowWidth = () => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowWidth;
};

const App = () => {
    return (
        <ToastProvider>
            <ConfirmProvider>
                <Router basename={basename}>{/* si usas subdirectorio */}
                    <LocationWrapper />
                </Router>
            </ConfirmProvider>
        </ToastProvider>
    );
};

const LocationWrapper = () => {
    const location = useLocation();
    const windowWidth = useWindowWidth();
    const [manualCollapsed, setManualCollapsed] = useState(() => {
        return localStorage.getItem('sidebar-collapsed') === 'true';
    });
    
    // Definir el breakpoint donde el sidebar se colapsa (768px para tablets)
    const SIDEBAR_COLLAPSE_BREAKPOINT = 768;
    const isAutoCollapsed = windowWidth < SIDEBAR_COLLAPSE_BREAKPOINT;
    
    // El sidebar está colapsado si es automático O manual
    const isCollapsed = isAutoCollapsed || manualCollapsed;

    // Callback para manejar el cambio de estado del sidebar
    const handleSidebarToggle = (collapsed) => {
        setManualCollapsed(collapsed);
        localStorage.setItem('sidebar-collapsed', collapsed);
    };

    // Define all valid routes and their components
    const validRoutes = [
        { path: '/', element: <Home /> },
        { path: '/projects', element: <RequireAuth><Projects /></RequireAuth> },
        { path: '/projects/:id/detail', element: <RequireAuth><ProjectDetail /></RequireAuth> },
        { path: '/projects/:id/review', element: <RequireAuth><ProjectReviews /></RequireAuth> },
        { path: '/projects/:id/notes', element: <RequireAuth><ProjectNotes /></RequireAuth> },
        { path: '/projects/:id/files', element: <RequireAuth><ProjectFiles /></RequireAuth> }, // Add ProjectFiles route
        { path: '/projects/:id/continuous-deployment', element: <RequireAuth><ProjectContinuousDeployment /></RequireAuth> }, // Add ProjectContinuousDeployment route
        { path: '/jmeter-test-generator', element: <JMeterTestGenerator /> },
        { path: '/jmeter-test-creator', element: <JMeterTestCreator /> }, // NUEVO: ruta para la nueva página
        { path: '/phpstan', element: <PhpStanViewer /> },
        { path: '/solicitud-maquina-virtual-upt', element: <ServersRequestPage /> } // Add ServersRequestPage route
    ];

    // Check if the current path matches any valid route
    const isNotFound = !validRoutes.some((route) => matchPath(route.path, location.pathname));

    return (
        <div className="d-flex" style={{ height: '100vh', overflow: 'hidden' }}>
            {!isNotFound && (
                <div 
                    style={{ 
                        width: isCollapsed ? '60px' : '250px', 
                        minWidth: isCollapsed ? '60px' : '250px',
                        flexShrink: 0,
                        transition: 'width 0.3s ease'
                    }}
                >
                    <Sidebar 
                        collapsed={isCollapsed} 
                        autoCollapsed={isAutoCollapsed}
                        onToggle={handleSidebarToggle}
                    />
                </div>
            )}
            <div 
                className="flex-grow-1 overflow-auto" 
                style={{ 
                    height: '100vh',
                    minWidth: 0, // Importante: permite que el contenido se encoja
                    transition: 'all 0.3s ease'
                }}
            >
                <Routes>
                    {validRoutes.map(({ path, element }) => (
                        <Route key={path} path={path} element={element} />
                    ))}
                    <Route path="*" element={<NotFound />} /> {/* 404 route */}
                </Routes>
            </div>
        </div>
    );
};

export default App;
