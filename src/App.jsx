import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, matchPath } from 'react-router-dom'; // Import useLocation and matchPath
import Sidebar from './components/Sidebar';
import RequireAuth from './components/RequireAuth';
import Home from './pages/Home';
import JMeterTestGenerator from './pages/JMeterTestGenerator';
import PhpStanViewer from './pages/PhpStanViewer';
import NotFound from './pages/NotFound'; // Import the 404 page component

import Projects from './pages/Projects';
import ProjectDetail from '@/pages/ProjectDetail';
import ProjectReviews from './pages/ProjectReviews';
import ProjectNotes from './pages/ProjectNotes';
import { ToastProvider } from './components/ToastContext'; // Importa el ToastProvider

const basename = import.meta.env.VITE_BASE_URL;

const App = () => {
    return (
        <ToastProvider>
            <Router basename={basename}>{/* si usas subdirectorio */}
                <LocationWrapper />
            </Router>
        </ToastProvider>
    );
};

const LocationWrapper = () => {
    const location = useLocation(); // Get the current location

    // Define all valid routes and their components
    const validRoutes = [
        { path: '/', element: <Home /> },
        { path: '/projects', element: <RequireAuth><Projects /></RequireAuth> },
        { path: '/projects/:id/detail', element: <RequireAuth><ProjectDetail /></RequireAuth> },
        { path: '/projects/:id/review', element: <RequireAuth><ProjectReviews /></RequireAuth> },
        { path: '/projects/:id/notes', element: <RequireAuth><ProjectNotes /></RequireAuth> },
        { path: '/jmeter-test-generator', element: <JMeterTestGenerator /> },
        { path: '/phpstan', element: <PhpStanViewer /> }
    ];

    // Check if the current path matches any valid route
    const isNotFound = !validRoutes.some((route) => matchPath(route.path, location.pathname));

    return (
        <div className="d-flex" style={{ height: '100vh', overflow: 'hidden' }}>
            {!isNotFound && <Sidebar />} {/* Conditionally render Sidebar */}
            <div className="flex-grow-1 overflow-auto" style={{ maxHeight: '100vh' }}>
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
