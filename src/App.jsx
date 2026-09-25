import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, matchPath } from 'react-router-dom';
import Cabecera from '@c/layout/Cabecera';
import RequireAuth from '@c/RequireAuth';
import { ToastProvider } from '@c/ToastContext';
import { DialogProvider } from '@c/DialogProvider';
import { SessionProvider } from '@c/SessionContext';
import Home from '@/pages/Home';
import PhpStanViewer from '@/pages/PhpStanViewer';
import ServersRequestPage from '@/pages/ServersRequestPage';
import NotFound from '@/pages/NotFound';
import Projects from '@/pages/Projects';
import ProjectDetail from '@/pages/ProjectDetail';
import ProjectReviews from '@/pages/ProjectReviews';
import ProjectNotes from '@/pages/ProjectNotes';
import ProjectFiles from '@/pages/ProjectFiles';
import ProjectContinuousDeployment from '@/pages/ProjectContinuousDeployment';
import JMeterTestCreator from '@/pages/JMeterTestCreator';
import Accounts from '@/pages/Accounts';
import { HERRAMIENTAS } from '@/config/tools';
import { recordVisit } from '@u/recent';

const basename = import.meta.env.VITE_BASE_URL;

const ROUTES = [
    { path: '/', element: <Home /> },
    { path: '/projects', element: <RequireAuth><Projects /></RequireAuth> },
    { path: '/projects/:id/detail', element: <RequireAuth><ProjectDetail /></RequireAuth> },
    { path: '/projects/:id/review', element: <RequireAuth><ProjectReviews /></RequireAuth> },
    { path: '/projects/:id/notes', element: <RequireAuth><ProjectNotes /></RequireAuth> },
    { path: '/projects/:id/files', element: <RequireAuth><ProjectFiles /></RequireAuth> },
    { path: '/projects/:id/continuous-deployment', element: <RequireAuth><ProjectContinuousDeployment /></RequireAuth> },
    { path: '/cuentas', element: <RequireAuth admin><Accounts /></RequireAuth> },
    { path: '/jmeter-test-creator', element: <JMeterTestCreator /> },
    { path: '/phpstan', element: <PhpStanViewer /> },
    { path: '/solicitud-maquina-virtual-upt', element: <ServersRequestPage /> },
];

const Layout = () => {
    const location = useLocation();
    const isNotFound = !ROUTES.some((route) => matchPath(route.path, location.pathname));

    // Accesos recientes del Inicio: las herramientas autónomas; los proyectos los registra ProjectHeader
    useEffect(() => {
        const tool = HERRAMIENTAS.find((h) => h.to === location.pathname && h.to !== '/projects');
        if (tool) recordVisit({ key: `herramienta:${tool.to}`, type: 'herramienta', to: tool.to, label: tool.title });
    }, [location.pathname]);

    return (
        <>
            {!isNotFound && <Cabecera />}
            <main className="contenido">
                <Routes>
                    {ROUTES.map(({ path, element }) => (
                        <Route key={path} path={path} element={element} />
                    ))}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </main>
        </>
    );
};

const App = () => (
    <SessionProvider>
        <ToastProvider>
            <DialogProvider>
                <Router basename={basename}>
                    <Layout />
                </Router>
            </DialogProvider>
        </ToastProvider>
    </SessionProvider>
);

export default App;
