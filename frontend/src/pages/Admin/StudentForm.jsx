import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const StudentForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dni: '',
        birthDate: '',
        address: '',
        city: '',
        nationality: 'Argentina',
        birthPlace: '',
        studentFileId: '',
        guardianName: '',
        guardianPhone: '',
        courseId: '',
        orderNumber: ''
    });

    const [courses, setCourses] = useState([]);

    useEffect(() => {
        fetchCourses();
        if (isEditMode) {
            fetchStudent();
        }
    }, [id]);

    const fetchCourses = async () => {
        try {
            const token = localStorage.getItem('token');
            // We use the dashboard stats to get the list of courses
            const response = await axios.get('http://localhost:8080/api/attendance/dashboard', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCourses(response.data.courseStats || []);
        } catch (error) {
            console.error('Error fetching courses:', error);
            toast.error('Error al cargar la lista de cursos');
        }
    };

    const fetchStudent = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:8080/api/students/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = response.data;
            setFormData({
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                dni: data.dni || '',
                birthDate: data.birthDate || '',
                address: data.address || '',
                city: data.city || '',
                nationality: data.nationality || 'Argentina',
                birthPlace: data.birthPlace || '',
                studentFileId: data.studentFileId || '',
                guardianName: data.guardianName || '',
                guardianPhone: data.guardianPhone || '',
                courseId: data.courseId || '',
                orderNumber: data.orderNumber || ''
            });
        } catch (error) {
            console.error('Error fetching student:', error);
            toast.error('Error al cargar los datos del alumno');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.firstName || !formData.lastName || !formData.dni || !formData.birthDate || !formData.courseId) {
            toast.warn('Por favor complete los campos obligatorios');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            if (isEditMode) {
                await axios.put(`http://localhost:8080/api/students/${id}`, formData, config);
                toast.success('Alumno actualizado correctamente');
            } else {
                await axios.post('http://localhost:8080/api/students', formData, config);
                toast.success('Alumno creado correctamente');
            }
            navigate('/admin/students');
        } catch (error) {
            console.error('Error saving student:', error);
            toast.error(error.response?.data?.message || 'Error al guardar el alumno');
        }
    };

    return (
        <div style={styles.container}>
            <h1>{isEditMode ? 'Editar Alumno' : 'Agregar Nuevo Alumno'}</h1>
            <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.section}>
                    <h3>Datos Personales</h3>
                    <div style={styles.row}>
                        <div style={styles.group}>
                            <label style={styles.label}>Nombre *</label>
                            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} style={styles.input} required />
                        </div>
                        <div style={styles.group}>
                            <label style={styles.label}>Apellido *</label>
                            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} style={styles.input} required />
                        </div>
                    </div>
                    <div style={styles.row}>
                        <div style={styles.group}>
                            <label style={styles.label}>DNI *</label>
                            <input type="text" name="dni" value={formData.dni} onChange={handleChange} style={styles.input} required />
                        </div>
                        <div style={styles.group}>
                            <label style={styles.label}>Fecha de Nacimiento *</label>
                            <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} style={styles.input} required />
                        </div>
                    </div>
                </div>

                <div style={styles.section}>
                    <h3>Escolaridad</h3>
                    <div style={styles.row}>
                        <div style={styles.group}>
                            <label style={styles.label}>Curso *</label>
                            <select name="courseId" value={formData.courseId} onChange={handleChange} style={styles.input} required>
                                <option value="">Seleccione un curso</option>
                                {courses.map(course => (
                                    <option key={course.id} value={course.id}>
                                        {course.name} {course.division} ({course.shift})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div style={styles.group}>
                            <label style={styles.label}>Legajo</label>
                            <input type="text" name="studentFileId" value={formData.studentFileId} onChange={handleChange} style={styles.input} />
                        </div>
                    </div>
                </div>

                <div style={styles.section}>
                    <h3>Contacto y Tutor</h3>
                    <div style={styles.row}>
                        <div style={styles.group}>
                            <label style={styles.label}>Nombre del Tutor</label>
                            <input type="text" name="guardianName" value={formData.guardianName} onChange={handleChange} style={styles.input} />
                        </div>
                        <div style={styles.group}>
                            <label style={styles.label}>Teléfono del Tutor</label>
                            <input type="text" name="guardianPhone" value={formData.guardianPhone} onChange={handleChange} style={styles.input} />
                        </div>
                    </div>
                </div>

                <div style={styles.actions}>
                    <button type="button" onClick={() => navigate('/admin/students')} style={styles.cancelBtn}>Cancelar</button>
                    <button type="submit" style={styles.submitBtn}>{isEditMode ? 'Actualizar' : 'Crear'}</button>
                </div>
            </form>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
    },
    form: {
        backgroundColor: '#fff',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    },
    section: {
        marginBottom: '25px',
        borderBottom: '1px solid #eee',
        paddingBottom: '15px',
    },
    row: {
        display: 'flex',
        gap: '20px',
        marginBottom: '15px',
    },
    group: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    label: {
        marginBottom: '5px',
        fontWeight: 'bold',
        fontSize: '0.9rem',
    },
    input: {
        padding: '10px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        fontSize: '1rem',
    },
    actions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '15px',
        marginTop: '20px',
    },
    submitBtn: {
        backgroundColor: '#007bff',
        color: '#fff',
        padding: '10px 25px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '1rem',
    },
    cancelBtn: {
        backgroundColor: '#6c757d',
        color: '#fff',
        padding: '10px 25px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '1rem',
    },
};

export default StudentForm;
