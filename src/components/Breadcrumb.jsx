import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';
import { Breadcrumb as BSBreadcrumb } from 'react-bootstrap';
import { useBreadcrumb } from '@/hooks/useBreadcrumb';

export default function Breadcrumb() {
    const items = useBreadcrumb();

    return (
        <div className="d-flex align-items-center">
            <BSBreadcrumb>
                <BSBreadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>
                    <FaHome />
                </BSBreadcrumb.Item>
                {items.map((item, index) => (
                    <BSBreadcrumb.Item
                        key={index}
                        active={item.isLast}
                        linkAs={item.path ? Link : undefined}
                        linkProps={item.path ? { to: item.path } : undefined}
                    >
                        {item.label}
                    </BSBreadcrumb.Item>

                ))}
            </BSBreadcrumb>
        </div>
    );
}
