import React from 'react';
import { Link } from 'react-router-dom';
import { FaProjectDiagram, FaBolt, FaSearch, FaServer } from 'react-icons/fa';

const HERRAMIENTAS = [
    {
        to: '/projects',
        icon: FaProjectDiagram,
        title: 'Proyectos',
        description: 'Proyectos de software con su equipo, revisiones técnicas, notas, archivos y despliegue continuo.',
        pie: 'Requiere acceso',
    },
    {
        to: '/jmeter-test-creator',
        icon: FaBolt,
        title: 'Pruebas JMeter',
        description: 'Arma un plan de pruebas de carga, importa rutas Laravel o un .jmx existente y descarga el resultado.',
        pie: 'Se genera en el navegador',
    },
    {
        to: '/phpstan',
        icon: FaSearch,
        title: 'Visor PHPStan',
        description: 'Revisa un reporte JSON de PHPStan agrupado por archivo, fíltralo y expórtalo a Excel.',
        pie: 'Se genera en el navegador',
    },
    {
        to: '/solicitud-maquina-virtual-upt',
        icon: FaServer,
        title: 'Solicitud de servidores',
        description: 'Completa el formulario de solicitud de máquinas virtuales para UPT y descárgalo en Word.',
        pie: 'Plantilla DOCX',
    },
];

export default function Home() {
    return (
        <>
            <div className="titulo-seccion">
                <h2>Herramientas <span className="sub">{HERRAMIENTAS.length} disponibles</span></h2>
            </div>
            <div className="rejilla">
                {HERRAMIENTAS.map(({ to, icon: Icon, title, description, pie }) => (
                    <Link key={to} to={to} className="tarjeta">
                        <Icon className="icono" size={20} aria-hidden="true" />
                        <h2>{title}</h2>
                        <p>{description}</p>
                        <footer>{pie}</footer>
                    </Link>
                ))}
            </div>
        </>
    );
}
