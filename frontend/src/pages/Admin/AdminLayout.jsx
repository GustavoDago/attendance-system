import React from 'react';
import { Outlet, Link } from 'react-router-dom';

const AdminLayout = () => {
    return (
        <div style={styles.container}>
            <div style={styles.sidebar}>
                <h2>Admin Panel</h2>
                <ul style={styles.nav}>
                    <li><Link to="/admin/users" style={styles.link}>Usuarios</Link></li>
                    <li><Link to="/admin/reports" style={styles.link}>Reportes</Link></li>
                    <li><Link to="/" style={styles.link}>Modo Kiosco</Link></li>
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
    },
    sidebar: {
        width: '250px',
        backgroundColor: '#333',
        color: '#fff',
        padding: '20px',
    },
    nav: {
        listStyle: 'none',
        padding: 0,
        marginTop: '20px',
    },
    link: {
        display: 'block',
        color: '#fff',
        textDecoration: 'none',
        padding: '10px 0',
        fontSize: '1.2rem',
    },
    content: {
        flex: 1,
        padding: '20px',
        backgroundColor: '#f5f5f5',
    },
};

export default AdminLayout;
