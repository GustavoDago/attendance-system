import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const StudentList = () => {
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8080/api/students', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStudents(response.data);
        } catch (error) {
            console.error('Error fetching students:', error);
            toast.error('Error al cargar la lista de alumnos');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar este alumno?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`http://localhost:8080/api/students/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Alumno eliminado correctamente');
                fetchStudents();
            } catch (error) {
                console.error('Error deleting student:', error);
                toast.error('Error al eliminar el alumno');
            }
        }
    };

    const filteredStudents = students.filter(student =>
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.dni.includes(searchTerm)
    );

    return (
        <div>
            <div style={styles.header}>
                <h1>Gestión de Alumnos</h1>
                <Link to="/admin/students/add" style={styles.addButton}>Agregar Alumno</Link>
            </div>

            <div style={styles.searchContainer}>
                <input
                    type="text"
                    placeholder="Buscar por nombre o DNI..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={styles.searchInput}
                />
            </div>

            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>Nombre</th>
                        <th style={styles.th}>DNI</th>
                        <th style={styles.th}>Curso</th>
                        <th style={styles.th}>Nro Orden</th>
                        <th style={styles.th}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredStudents.map(student => (
                        <tr
                            key={student.id}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f1f1'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <td style={styles.td}>{student.lastName}, {student.firstName}</td>
                            <td style={styles.td}>{student.dni}</td>
                            <td style={styles.td}>{student.courseName}</td>
                            <td style={styles.td}>{student.orderNumber}</td>
                            <td style={styles.td}>
                                <button
                                    onClick={() => navigate(`/admin/students/edit/${student.id}`)}
                                    style={styles.editButton}
                                >
                                    Editar
                                </button>
                                <button
                                    onClick={() => handleDelete(student.id)}
                                    style={styles.deleteButton}
                                >
                                    Eliminar
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const styles = {
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
    },
    addButton: {
        backgroundColor: '#28a745',
        color: '#fff',
        padding: '10px 20px',
        textDecoration: 'none',
        borderRadius: '4px',
    },
    searchContainer: {
        marginBottom: '20px',
    },
    searchInput: {
        width: '100%',
        padding: '10px',
        fontSize: '1rem',
        borderRadius: '4px',
        border: '1px solid #ccc',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        backgroundColor: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    th: {
        textAlign: 'left',
        padding: '12px',
        borderBottom: '2px solid #eee',
        backgroundColor: '#f8f9fa',
    },
    td: {
        padding: '12px',
        borderBottom: '1px solid #eee',
    },
    editButton: {
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        padding: '6px 12px',
        borderRadius: '4px',
        marginRight: '10px',
        cursor: 'pointer',
    },
    deleteButton: {
        backgroundColor: '#dc3545',
        color: '#fff',
        border: 'none',
        padding: '6px 12px',
        borderRadius: '4px',
        cursor: 'pointer',
    },
};

export default StudentList;
