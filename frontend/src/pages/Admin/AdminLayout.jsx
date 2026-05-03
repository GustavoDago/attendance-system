import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

const AdminLayout = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const location = useLocation();

    const menuItems = [
        { path: '/admin', label: 'Dashboard', icon: '📊' },
        { path: '/admin/attendance/manual', label: 'Carga Manual', icon: '📝' },
        { path: '/admin/students', label: 'Estudiantes', icon: '👥' },
        { path: '/admin/users', label: 'Usuarios', icon: '👤' },
        { path: '/admin/reports', label: 'Reportes', icon: '📈' },
        { path: '/admin/reports/subjects', label: 'Reporte Materias', icon: '📚' },
        { path: '/', label: 'Modo Kiosco', icon: '🏪' },
    ];

    return (
        <div style={styles.container}>
            <div style={{
                ...styles.sidebar,
                width: isCollapsed ? '70px' : '260px',
            }}>
                <div style={styles.header}>
                    {!isCollapsed && <h2 style={styles.title}>Admin Panel</h2>}
                    <button 
                        onClick={() => setIsCollapsed(!isCollapsed)} 
                        style={styles.toggleBtn}
                        title={isCollapsed ? "Expandir" : "Colapsar"}
                    >
                        {isCollapsed ? '→' : '←'}
                    </button>
                </div>
                
                <ul style={styles.nav}>
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <li key={item.path} style={styles.navItem}>
                                <Link 
                                    to={item.path} 
                                    style={{
                                        ...styles.link,
                                        backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                                        padding: isCollapsed ? '12px 0' : '12px 15px',
                                    }}
                                >
                                    <span style={styles.icon}>{item.icon}</span>
                                    {!isCollapsed && <span style={styles.label}>{item.label}</span>}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
            <div style={styles.content}>
                <Outlet />
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        minHeight: '100vh',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    },
    sidebar: {
        backgroundColor: '#1e1e2d',
        color: '#a2a3b7',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '4px 0 10px rgba(0,0,0,0.1)',
    },
    header: {
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: '64px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
    },
    title: {
        fontSize: '1.1rem',
        fontWeight: '700',
        color: '#fff',
        margin: 0,
        whiteSpace: 'nowrap',
    },
    toggleBtn: {
        background: 'rgba(255,255,255,0.05)',
        border: 'none',
        color: '#fff',
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.2rem',
        transition: 'background 0.2s',
        flexShrink: 0,
    },
    nav: {
        listStyle: 'none',
        padding: '15px 10px',
        margin: 0,
        flex: 1,
    },
    navItem: {
        marginBottom: '4px',
    },
    link: {
        display: 'flex',
        alignItems: 'center',
        color: '#a2a3b7',
        textDecoration: 'none',
        borderRadius: '10px',
        fontSize: '0.95rem',
        fontWeight: '500',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
    },
    icon: {
        fontSize: '1.2rem',
        width: '30px',
        display: 'flex',
        justifyContent: 'center',
        marginRight: '12px',
        flexShrink: 0,
    },
    label: {
        opacity: 1,
        transition: 'opacity 0.2s',
    },
    content: {
        flex: 1,
        padding: '30px',
        backgroundColor: '#f8f9fa',
        overflowY: 'auto',
    },
};

export default AdminLayout;
