import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [expandedUser, setExpandedUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/api/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const toggleExpand = (userId) => {
        if (expandedUser === userId) {
            setExpandedUser(null);
        } else {
            setExpandedUser(userId);
        }
    };

    return (
        <div>
            <h1>Gestión de Usuarios</h1>
            <button style={styles.addButton} onClick={() => navigate('/admin/users/add')}>
                + Agregar Usuario
            </button>
            
            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>ID</th>
                            <th style={styles.th}>Nombre</th>
                            <th style={styles.th}>Apellido</th>
                            <th style={styles.th}>DNI</th>
                            <th style={styles.th}>Rol</th>
                            <th style={styles.th}>Cursos</th>
                            <th style={styles.th}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <React.Fragment key={user.id}>
                                <tr>
                                    <td style={styles.td}>{user.id}</td>
                                    <td style={styles.td}>{user.firstName}</td>
                                    <td style={styles.td}>{user.lastName}</td>
                                    <td style={styles.td}>{user.dni}</td>
                                    <td style={styles.td}>{user.role}</td>
                                    <td style={styles.td}>
                                        {user.courseNames ? user.courseNames.join(', ') : '-'}
                                    </td>
                                    <td style={styles.td}>
                                        <div style={styles.actions}>
                                            <button onClick={() => toggleExpand(user.id)} style={styles.detailButton}>
                                                {expandedUser === user.id ? 'Ocultar' : 'Detalles'}
                                            </button>
                                            <Link to={`/admin/qr/${user.id}`} target="_blank" style={styles.link}>
                                                QR
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                                {expandedUser === user.id && user.role === 'STUDENT' && (
                                    <tr style={styles.expandedRow}>
                                        <td colSpan="7" style={styles.expandedTd}>
                                            <div style={styles.detailGrid}>
                                                <div><strong>Legajo:</strong> {user.fileNumber}</div>
                                                <div><strong>Edad:</strong> {user.age}</div>
                                                <div><strong>Nacionalidad:</strong> {user.nationality}</div>
                                                <div><strong>Lugar Nac.:</strong> {user.birthPlace}</div>
                                                <div><strong>Fecha Nac.:</strong> {user.birthDate}</div>
                                                <div><strong>Teléfono:</strong> {user.phone}</div>
                                                <div><strong>Localidad:</strong> {user.locality}</div>
                                                <div style={{gridColumn: 'span 2'}}><strong>Domicilio:</strong> {user.address}</div>
                                            </div>
                                            <div style={{marginTop: '15px'}}>
                                                <strong>Cursos y Nro de Orden:</strong>
                                                <ul style={{marginTop: '5px'}}>
                                                    {user.courseNames.map((name, index) => (
                                                        <li key={index}>{name} - Orden: {user.orderNumbers[index]}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const styles = {
    addButton: {
        marginBottom: '20px',
        padding: '10px 20px',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
    },
    tableContainer: {
        overflowX: 'auto',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        minWidth: '800px',
    },
    th: {
        textAlign: 'left',
        padding: '12px',
        backgroundColor: '#f2f2f2',
        borderBottom: '2px solid #ddd',
    },
    td: {
        padding: '12px',
        borderBottom: '1px solid #ddd',
    },
    actions: {
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
    },
    detailButton: {
        padding: '5px 10px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '3px',
        cursor: 'pointer',
        fontSize: '0.8rem',
    },
    link: {
        color: '#007bff',
        textDecoration: 'none',
        fontSize: '0.8rem',
        padding: '5px 10px',
        border: '1px solid #007bff',
        borderRadius: '3px',
    },
    expandedRow: {
        backgroundColor: '#f9f9f9',
    },
    expandedTd: {
        padding: '20px',
        borderBottom: '1px solid #ddd',
    },
    detailGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '15px',
    }
};

export default UserList;
