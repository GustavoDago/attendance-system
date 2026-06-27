import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchUsers = React.useCallback(async () => {
        try {
            const response = await axios.get('/api/users');
            return response.data;
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Error al cargar usuarios');
            return null;
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        const loadData = async () => {
            setLoading(true);
            const data = await fetchUsers();
            if (isMounted) {
                if (data) setUsers(data);
                setLoading(false);
            }
        };
        loadData();
        return () => {
            isMounted = false;
        };
    }, [fetchUsers]);

    const handleDelete = async (id, name) => {
        if (window.confirm(`¿Está seguro de que desea eliminar al usuario ${name}?`)) {
            try {
                await axios.delete(`/api/users/${id}`);
                setUsers(prev => prev.filter(user => user.id !== id));
                toast.success('Usuario eliminado');
            } catch (error) {
                console.error('Error deleting user:', error);
                toast.error('No se pudo eliminar el usuario.');
            }
        }
    };

    const getRoleBadgeStyle = (role) => {
        switch (role) {
            case 'ADMIN': return styles.badgeAdmin;
            case 'PRECEPTOR': return styles.badgePreceptor;
            case 'TEACHER': return styles.badgeTeacher;
            default: return styles.badgeDefault;
        }
    };

    return (
        <div style={styles.pageContainer}>
            <div style={styles.header}>
                <div style={styles.titleSection}>
                    <h1 style={styles.title}>Gestión de Usuarios</h1>
                    <p style={styles.subtitle}>{users.length} usuarios registrados en el sistema</p>
                </div>
                <button style={styles.addButton} onClick={() => navigate('/admin/users/add')}>
                    <span style={{ marginRight: '8px' }}>👤+</span> Agregar Usuario
                </button>
            </div>
            
            <div style={styles.card}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>ID</th>
                            <th style={styles.th}>Nombre Completo</th>
                            <th style={styles.th}>DNI</th>
                            <th style={styles.th}>Usuario (Login)</th>
                            <th style={styles.th}>Rol</th>
                            <th style={{ ...styles.th, textAlign: 'center' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={styles.tdCenter}>Cargando...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan="6" style={styles.tdCenter}>No se encontraron usuarios</td></tr>
                        ) : (
                            users.map(user => (
                                <tr key={user.id} style={styles.tr}>
                                <td style={styles.td}>{user.id}</td>
                                <td style={styles.td}>
                                    <div style={styles.nameContainer}>
                                        <div style={styles.avatar}>
                                            {(user.firstName?.[0] || '?')}{(user.lastName?.[0] || '?')}
                                        </div>
                                        <div>
                                            <div style={styles.fullName}>{user.firstName} {user.lastName}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={styles.td}>{user.dni}</td>
                                <td style={styles.td}>
                                    <code style={styles.username}>{user.username || user.dni}</code>
                                </td>
                                <td style={styles.td}>
                                    <span style={{ ...styles.badge, ...getRoleBadgeStyle(user.role) }}>
                                        {user.role}
                                    </span>
                                </td>
                                <td style={{ ...styles.td, textAlign: 'center' }}>
                                    <div style={styles.actions}>
                                        <Link
                                            to={`/admin/qr/${user.id}`}
                                            target="_blank"
                                            style={styles.qrButton}
                                            title="Imprimir QR"
                                            aria-label={`Imprimir QR de ${user.firstName} ${user.lastName}`}
                                        >
                                            <span aria-hidden="true">🖨️</span> QR
                                        </Link>
                                        <button 
                                            onClick={() => handleDelete(user.id, `${user.firstName} ${user.lastName}`)}
                                            style={styles.deleteButton}
                                            title="Eliminar Usuario"
                                            aria-label={`Eliminar usuario ${user.firstName} ${user.lastName}`}
                                        >
                                            <span aria-hidden="true">🗑️</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const styles = {
    pageContainer: {
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
    },
    titleSection: {
        display: 'flex',
        flexDirection: 'column',
    },
    title: {
        fontSize: '1.8rem',
        fontWeight: '700',
        color: '#1e1e2d',
        margin: 0,
    },
    subtitle: {
        color: '#a2a3b7',
        margin: '5px 0 0 0',
        fontSize: '0.9rem',
    },
    addButton: {
        padding: '12px 24px',
        backgroundColor: '#5d5fef',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(93, 95, 239, 0.2)',
        transition: 'transform 0.2s, background-color 0.2s',
        display: 'flex',
        alignItems: 'center',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        border: '1px solid #f1f1f4',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    th: {
        textAlign: 'left',
        padding: '16px 20px',
        backgroundColor: '#f9fafb',
        color: '#5e6278',
        fontSize: '0.85rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        borderBottom: '1px solid #f1f1f4',
    },
    tr: {
        transition: 'background-color 0.2s',
        borderBottom: '1px solid #f8f8f8',
    },
    td: {
        padding: '16px 20px',
        verticalAlign: 'middle',
        color: '#3f4254',
        fontSize: '0.95rem',
    },
    tdCenter: {
        padding: '40px',
        textAlign: 'center',
        color: '#a2a3b7',
        fontSize: '1.1rem',
    },
    nameContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    avatar: {
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        backgroundColor: '#f3f6ff',
        color: '#5d5fef',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        fontSize: '0.8rem',
        border: '1px solid #e1e9ff',
    },
    fullName: {
        fontWeight: '600',
        color: '#1e1e2d',
    },
    username: {
        backgroundColor: '#f1f1f4',
        padding: '4px 8px',
        borderRadius: '6px',
        fontSize: '0.85rem',
        color: '#5e6278',
        fontFamily: 'monospace',
    },
    badge: {
        padding: '6px 12px',
        borderRadius: '8px',
        fontSize: '0.75rem',
        fontWeight: '700',
        display: 'inline-block',
    },
    badgeAdmin: {
        backgroundColor: '#f8f5ff',
        color: '#7239ea',
    },
    badgePreceptor: {
        backgroundColor: '#f1faff',
        color: '#009ef7',
    },
    badgeTeacher: {
        backgroundColor: '#e8fff3',
        color: '#50cd89',
    },
    badgeDefault: {
        backgroundColor: '#f5f8fa',
        color: '#7e8299',
    },
    actions: {
        display: 'flex',
        gap: '8px',
        justifyContent: 'center',
    },
    qrButton: {
        padding: '8px 12px',
        backgroundColor: '#f3f6ff',
        color: '#5d5fef',
        textDecoration: 'none',
        borderRadius: '8px',
        fontSize: '0.85rem',
        fontWeight: '600',
        transition: 'all 0.2s',
        border: '1px solid #e1e9ff',
    },
    deleteButton: {
        padding: '8px 12px',
        backgroundColor: '#fff5f8',
        color: '#f1416c',
        border: '1px solid #ffd3e0',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
    }
};

export default UserList;
