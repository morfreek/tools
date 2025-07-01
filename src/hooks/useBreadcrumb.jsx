import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

const routeConfig = {
    'projects': 'Proyectos',
    'detail': 'Detalle del Proyecto',
    'review': 'Revisión Técnica',
    'notes': 'Notas',
    'files': 'Archivos'
};

const validPages = ['detail', 'review', 'notes', 'files'];

export const useBreadcrumb = () => {
    const location = useLocation();

    const breadcrumbItems = useMemo(() => {
        const pathParts = location.pathname.split('/').filter(Boolean);
        
        if (pathParts.length !== 3 || 
            pathParts[0] !== 'projects' || 
            isNaN(pathParts[1]) || 
            !validPages.includes(pathParts[2])) {
            return [{
                path: '/projects',
                label: 'Proyectos',
                isLast: true
            }];
        }

        return [
            {
                path: '/projects',
                label: 'Proyectos',
                isLast: false
            },
            {
                path: pathParts[2] !== 'detail' ? `/projects/${pathParts[1]}/${validPages[0]}` : null,
                label: routeConfig['detail'],
                isLast: pathParts[2] === 'detail'
            },
            ...(pathParts[2] !== 'detail' ? [{
                path: null,
                label: routeConfig[pathParts[2]],
                isLast: true
            }] : [])
        ];
    }, [location.pathname]);

    return breadcrumbItems;
};
