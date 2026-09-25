import { FaProjectDiagram, FaBolt, FaSearch, FaServer } from 'react-icons/fa';

// Herramientas de la app: las usan el Inicio y los accesos recientes
export const HERRAMIENTAS = [
    {
        to: '/projects',
        icon: FaProjectDiagram,
        title: 'Proyectos',
        description: 'Equipo, revisiones técnicas, notas, archivos y despliegue continuo.',
    },
    {
        to: '/jmeter-test-creator',
        icon: FaBolt,
        title: 'Pruebas JMeter',
        description: 'Plan de carga desde cero, rutas Laravel o un .jmx existente.',
    },
    {
        to: '/phpstan',
        icon: FaSearch,
        title: 'Visor PHPStan',
        description: 'Reporte JSON agrupado por archivo, filtrable y exportable a Excel.',
    },
    {
        to: '/solicitud-maquina-virtual-upt',
        icon: FaServer,
        title: 'Solicitud de servidores',
        description: 'Formulario de máquinas virtuales UPT, descargable en Word.',
    },
];
