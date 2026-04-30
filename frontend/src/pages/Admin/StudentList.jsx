import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const StudentList = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/students');
            setStudents(response.data);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <p>Cargando estudiantes...</p>;

    return (
        <div>
            <h1>Listado de Estudiantes</h1>
            
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th>Legajo</th>
                        <th>Nombre</th>
                        <th>Apellido</th>
                        <th>DNI</th>
                        <th>Curso</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map(student => (
                        <tr key={student.id}>
                            <td>{student.studentFileId}</td>
                            <td>{student.firstName}</td>
                            <td>{student.lastName}</td>
                            <td>{student.dni}</td>
                            <td>{student.courseName}</td>
                            <td>
                                <Link to={`/admin/qr/${student.id}`} target="_blank" style={styles.link}>
                                    🖨️ Credencial / QR
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const styles = {
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginTop: '20px'
    },
    th: {
        textAlign: 'left',
        padding: '12px',
        backgroundColor: '#f2f2f2',
        borderBottom: '1px solid #ddd',
    },
    link: {
        color: '#007bff',
        textDecoration: 'none',
        fontWeight: 'bold'
    },
};

export default StudentList;
