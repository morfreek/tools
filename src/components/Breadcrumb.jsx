import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';
import { useBreadcrumb } from '@/hooks/useBreadcrumb';

export default function Breadcrumb() {
    const items = useBreadcrumb();

    return (
        <div className="d-flex align-items-center">
            <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                        <Link to="/" className="text-decoration-none">
                            <FaHome />
                        </Link>
                    </li>
                    {items.map((item, index) => (
                        <li key={index} className={`breadcrumb-item ${item.isLast ? 'active' : ''}`}>
                            {item.path ? (
                                <Link to={item.path} className="text-decoration-none">
                                    {item.label}
                                </Link>
                            ) : (
                                <span>{item.label}</span>
                            )}
                        </li>
                    ))}
                </ol>
            </nav>
        </div>
    );
}
