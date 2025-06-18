import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import RequireAuth from './components/RequireAuth';
import Home from './pages/Home';
import JMeterTestGenerator from './pages/JMeterTestGenerator';
import PhpStanViewer from './pages/PhpStanViewer';

import Projects from './pages/Projects';
import ProjectDetail from '@/pages/ProjectDetail';
import ProjectReviews from './pages/ProjectReviews';
import ProjectNotes from './pages/ProjectNotes';

const basename = import.meta.env.VITE_BASE_URL;
const App = () => {
    return (
        <Router basename={basename}>{/* si usas subdirectorio */}
            <div className="d-flex" style={{ height: '100vh', overflow: 'hidden' }}>
                <Sidebar />
                <div className="flex-grow-1 overflow-auto" style={{ maxHeight: '100vh' }}>
                    {/* <ShowLocation /> */}
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/projects" element={
                            <RequireAuth>
                                <Projects />
                            </RequireAuth>
                        } />
                        <Route path="/projects/:id/detail" element={
                            <RequireAuth>
                                <ProjectDetail />
                            </RequireAuth>
                        } />
                        <Route path="/projects/:id/review" element={
                            <RequireAuth>
                                <ProjectReviews />
                            </RequireAuth>
                        } />
                        <Route path="/projects/:id/notes" element={
                            <RequireAuth>
                                <ProjectNotes />
                            </RequireAuth>
                        } />
                        <Route path="/jmeter-test-generator" element={<JMeterTestGenerator />} />
                        <Route path="/phpstan" element={<PhpStanViewer />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
};

export default App;
