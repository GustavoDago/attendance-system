import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const StudentList = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [courseFilter, setCourseFilter] = useState('');
    const [courses, setCourses] = useState([]);
    const [showInactive, setShowInactive] = useState(false);

    useEffect(() => {
        fetchStudents();
        fetchCourses();
    }, [showInactive]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/students?onlyActive=${!showInactive}`);
            setStudents(response.data);
        } catch (error) {
            console.error('Error fetching students:', error);
            toast.error('Error al cargar alumnos');
        } finally {
            setLoading(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const response = await axios.get('/api/common/courses');
            setCourses(response.data);
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    };

    const handleDeactivate = async (id, name) => {
        if (window.confirm(`¿Está seguro de que desea desactivar al alumno ${name}?`)) {
            try {
                await axios.delete(`/api/students/${id}`);
                toast.success('Alumno desactivado');
                fetchStudents();
            } catch (error) {
                toast.error('Error al desactivar');
            }
        }
    };

    const handleActivate = async (id) => {
        try {
            await axios.post(`/api/students/${id}/activate`);
            toast.success('Alumno reactivado');
            fetchStudents();
        } catch (error) {
            toast.error('Error al activar');
        }
    };

    const filteredStudents = students.filter(student => {
        const matchesSearch = 
            student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.dni.includes(searchTerm) ||
            (student.studentFileId && student.studentFileId.includes(searchTerm));
        
        const matchesCourse = courseFilter === '' || student.courseId === parseInt(courseFilter);
        
        return matchesSearch && matchesCourse;
    });

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Gestión de Alumnos</h1>
                <button onClick={() => navigate('/admin/students/new')} style={styles.addButton}>
                    + Nuevo Alumno
                </button>
            </div>

            <div style={styles.filtersContainer}>
                <div style={styles.searchBox}>
                    <span style={styles.searchIcon}>🔍</span>
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre, DNI o legajo..." 
                        style={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <select 
                    style={styles.filterSelect}
                    value={courseFilter}
                    onChange={(e) => setCourseFilter(e.target.value)}
                >
                    <option value="">Todos los cursos</option>
                    {courses.map(course => (
                        <option key={course.id} value={course.id}>
                            {course.yearLabel} {course.division}
                        </option>
                    ))}
                </select>

                <label style={styles.checkboxLabel}>
                    <input 
                        type="checkbox" 
                        checked={showInactive}
                        onChange={(e) => setShowInactive(e.target.checked)}
                    />
                    Mostrar inactivos
                </label>
            </div>

            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Legajo</th>
                            <th style={styles.th}>Alumno</th>
                            <th style={styles.th}>DNI</th>
                            <th style={styles.th}>Curso</th>
                            <th style={styles.th}>Estado</th>
                            <th style={styles.th}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={styles.tdCenter}>Cargando...</td></tr>
                        ) : filteredStudents.length === 0 ? (
                            <tr><td colSpan="6" style={styles.tdCenter}>No se encontraron alumnos</td></tr>
                        ) : (
                            filteredStudents.map(student => (
                                <tr key={student.id} style={student.active ? {} : styles.inactiveRow}>
                                    <td style={styles.td}>{student.studentFileId || '-'}</td>
                                    <td style={styles.td}>
                                        <div style={styles.studentName}>
                                            {student.lastName}, {student.firstName}
                                        </div>
                                    </td>
                                    <td style={styles.td}>{student.dni}</td>
                                    <td style={styles.td}>
                                        <span style={styles.badge}>
                                            {student.courseName || 'Sin asignar'}
                                        </span>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={student.active ? styles.statusActive : styles.statusInactive}>
                                            {student.active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td style={styles.td}>
                                        <div style={styles.actions}>
                                            <button 
                                                onClick={() => navigate(`/admin/students/edit/${student.id}`)}
                                                style={styles.actionBtnEdit}
                                                title="Editar"
                                            >
                                                ✏️
                                            </button>
                                            <Link 
                                                to={`/admin/qr/${student.id}`} 
                                                target="_blank" 
                                                style={styles.actionBtnPrint}
                                                title="Imprimir QR"
                                            >
                                                🖨️
                                            </Link>
                                            {student.active ? (
                                                <button 
                                                    onClick={() => handleDeactivate(student.id, `${student.firstName} ${student.lastName}`)}
                                                    style={styles.actionBtnDelete}
                                                    title="Desactivar"
                                                >
                                                    🚫
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => handleActivate(student.id)}
                                                    style={styles.actionBtnActivate}
                                                    title="Reactivar"
                                                >
                                                    ✅
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div style={styles.footer}>
                Mostrando {filteredStudents.length} alumnos
            </div>
        </div>
    );
};

const styles = {
    container: {
        padding: '20px',
        backgroundColor: '#f4f7f6',
        minHeight: '100vh',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '25px',
    },
    title: {
        fontSize: '1.8rem',
        color: '#2d3436',
        margin: 0,
    },
    addButton: {
        padding: '10px 20px',
        backgroundColor: '#0984e3',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '600',
        transition: 'all 0.2s',
        boxShadow: '0 4px 6px rgba(9, 132, 227, 0.2)',
    },
    filtersContainer: {
        display: 'flex',
        gap: '15px',
        marginBottom: '20px',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    searchBox: {
        position: 'relative',
        flex: 1,
        minWidth: '300px',
    },
    searchIcon: {
        position: 'absolute',
        left: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#b2bec3',
    },
    searchInput: {
        width: '100%',
        padding: '12px 12px 12px 40px',
        borderRadius: '10px',
        border: '1px solid #dfe6e9',
        fontSize: '0.95rem',
        outline: 'none',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
    },
    filterSelect: {
        padding: '12px',
        borderRadius: '10px',
        border: '1px solid #dfe6e9',
        backgroundColor: 'white',
        fontSize: '0.95rem',
        outline: 'none',
        minWidth: '180px',
    },
    checkboxLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.9rem',
        color: '#636e72',
        cursor: 'pointer',
    },
    tableWrapper: {
        backgroundColor: 'white',
        borderRadius: '15px',
        overflow: 'hidden',
        boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    th: {
        textAlign: 'left',
        padding: '15px 20px',
        backgroundColor: '#f8f9fa',
        color: '#636e72',
        fontWeight: '600',
        fontSize: '0.85rem',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        borderBottom: '1px solid #eee',
    },
    td: {
        padding: '15px 20px',
        borderBottom: '1px solid #f1f2f6',
        color: '#2d3436',
        fontSize: '0.95rem',
    },
    tdCenter: {
        padding: '40px',
        textAlign: 'center',
        color: '#b2bec3',
        fontSize: '1.1rem',
    },
    studentName: {
        fontWeight: '600',
        color: '#2d3436',
    },
    badge: {
        padding: '4px 10px',
        backgroundColor: '#e3f2fd',
        color: '#1976d2',
        borderRadius: '20px',
        fontSize: '0.8rem',
        fontWeight: '500',
    },
    statusActive: {
        padding: '4px 10px',
        backgroundColor: '#e8f5e9',
        color: '#2e7d32',
        borderRadius: '20px',
        fontSize: '0.8rem',
        fontWeight: '500',
    },
    statusInactive: {
        padding: '4px 10px',
        backgroundColor: '#ffebee',
        color: '#c62828',
        borderRadius: '20px',
        fontSize: '0.8rem',
        fontWeight: '500',
    },
    inactiveRow: {
        backgroundColor: '#fafafa',
        opacity: 0.7,
    },
    actions: {
        display: 'flex',
        gap: '10px',
    },
    actionBtnEdit: {
        border: 'none',
        background: '#f1f2f6',
        padding: '6px 10px',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'background 0.2s',
    },
    actionBtnPrint: {
        textDecoration: 'none',
        background: '#f1f2f6',
        padding: '6px 10px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '1rem',
        display: 'inline-flex',
        alignItems: 'center',
    },
    actionBtnDelete: {
        border: 'none',
        background: '#ffeaa7',
        padding: '6px 10px',
        borderRadius: '6px',
        cursor: 'pointer',
    },
    actionBtnActivate: {
        border: 'none',
        background: '#55efc4',
        padding: '6px 10px',
        borderRadius: '6px',
        cursor: 'pointer',
    },
    footer: {
        marginTop: '15px',
        color: '#b2bec3',
        fontSize: '0.85rem',
        textAlign: 'right',
    }
};

export default StudentList;
