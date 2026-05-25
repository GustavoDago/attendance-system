import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

const StudentForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dni: '',
        birthDate: '',
        address: '',
        city: 'Ramallo',
        nationality: 'Argentina',
        birthPlace: '',
        studentFileId: '',
        guardianName: '',
        guardianPhone: '',
        courseId: '',
        orderNumber: '',
        groupNumber: '1'
    });

    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);

    const fetchCourses = React.useCallback(async () => {
        try {
            const response = await axios.get('/api/common/courses');
            setCourses(response.data);
        } catch (error) {
            console.error('Error fetching courses:', error);
            toast.error('Error al cargar cursos');
        }
    }, []);

    const fetchStudent = React.useCallback(async () => {
        setFetching(true);
        try {
            const response = await axios.get(`/api/students/${id}`);
            const data = response.data;
            // Format date for input type="date"
            if (data.birthDate) {
                data.birthDate = data.birthDate.split('T')[0];
            }
            setFormData({
                ...data,
                courseId: data.courseId || '',
                orderNumber: data.orderNumber || '',
                groupNumber: data.groupNumber || '1'
            });
        } catch (error) {
            console.error('Error fetching student:', error);
            toast.error('Error al cargar datos del alumno');
            navigate('/admin/students');
        } finally {
            setFetching(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        let isMounted = true;
        const loadData = async () => {
            if (isMounted) {
                await fetchCourses();
                if (isEdit) {
                    await fetchStudent();
                }
            }
        };
        loadData();
        return () => {
            isMounted = false;
        };
    }, [isEdit, fetchCourses, fetchStudent]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEdit) {
                await axios.put(`/api/students/${id}`, formData);
                toast.success('Alumno actualizado con éxito');
            } else {
                await axios.post('/api/students', formData);
                toast.success('Alumno creado con éxito');
            }
            navigate('/admin/students');
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error al guardar alumno');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div style={styles.loading}>Cargando datos...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>{isEdit ? 'Editar Alumno' : 'Nuevo Alumno'}</h2>
                <button onClick={() => navigate('/admin/students')} style={styles.backButton}>
                    Volver al listado
                </button>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>Información Personal</h3>
                    <div style={styles.grid}>
                        <div style={styles.group}>
                            <label htmlFor="firstName" style={styles.label}>Nombre *</label>
                            <input id="firstName" style={styles.input} name="firstName" value={formData.firstName} onChange={handleChange} required aria-required="true" placeholder="Ej: Juan" />
                        </div>
                        <div style={styles.group}>
                            <label htmlFor="lastName" style={styles.label}>Apellido *</label>
                            <input id="lastName" style={styles.input} name="lastName" value={formData.lastName} onChange={handleChange} required aria-required="true" placeholder="Ej: Pérez" />
                        </div>
                        <div style={styles.group}>
                            <label htmlFor="dni" style={styles.label}>DNI *</label>
                            <input id="dni" style={styles.input} name="dni" value={formData.dni} onChange={handleChange} required aria-required="true" placeholder="Solo números" />
                        </div>
                        <div style={styles.group}>
                            <label htmlFor="birthDate" style={styles.label}>Fecha de Nacimiento</label>
                            <input id="birthDate" type="date" style={styles.input} name="birthDate" value={formData.birthDate} onChange={handleChange} />
                        </div>
                        <div style={styles.group}>
                            <label htmlFor="nationality" style={styles.label}>Nacionalidad</label>
                            <input id="nationality" style={styles.input} name="nationality" value={formData.nationality} onChange={handleChange} placeholder="Ej: Argentina" />
                        </div>
                        <div style={styles.group}>
                            <label htmlFor="birthPlace" style={styles.label}>Lugar de Nacimiento</label>
                            <input id="birthPlace" style={styles.input} name="birthPlace" value={formData.birthPlace} onChange={handleChange} placeholder="Ej: San Nicolás" />
                        </div>
                    </div>
                </div>

                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>Ubicación y Contacto</h3>
                    <div style={styles.grid}>
                        <div style={styles.group}>
                            <label htmlFor="address" style={styles.label}>Dirección</label>
                            <input id="address" style={styles.input} name="address" value={formData.address} onChange={handleChange} placeholder="Calle y número" />
                        </div>
                        <div style={styles.group}>
                            <label htmlFor="city" style={styles.label}>Localidad</label>
                            <input id="city" style={styles.input} name="city" value={formData.city} onChange={handleChange} />
                        </div>
                    </div>
                </div>

                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>Datos del Tutor</h3>
                    <div style={styles.grid}>
                        <div style={styles.group}>
                            <label htmlFor="guardianName" style={styles.label}>Nombre del Tutor</label>
                            <input id="guardianName" style={styles.input} name="guardianName" value={formData.guardianName} onChange={handleChange} placeholder="Nombre completo" />
                        </div>
                        <div style={styles.group}>
                            <label htmlFor="guardianPhone" style={styles.label}>Teléfono del Tutor</label>
                            <input id="guardianPhone" style={styles.input} name="guardianPhone" value={formData.guardianPhone} onChange={handleChange} placeholder="Ej: 3364..." />
                        </div>
                    </div>
                </div>

                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>Datos Académicos</h3>
                    <div style={styles.grid}>
                        <div style={styles.group}>
                            <label htmlFor="studentFileId" style={styles.label}>Legajo</label>
                            <input id="studentFileId" style={styles.input} name="studentFileId" value={formData.studentFileId} onChange={handleChange} placeholder="Ej: 2/26" />
                        </div>
                        <div style={styles.group}>
                            <label htmlFor="courseId" style={styles.label}>Curso *</label>
                            <select id="courseId" style={styles.input} name="courseId" value={formData.courseId} onChange={handleChange} required aria-required="true">
                                <option value="">Seleccione un curso</option>
                                {courses.map(course => (
                                    <option key={course.id} value={course.id}>
                                        {course.yearLabel} {course.division} ({course.shift})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div style={styles.group}>
                            <label htmlFor="orderNumber" style={styles.label}>Nro de Orden</label>
                            <input id="orderNumber" type="number" style={styles.input} name="orderNumber" value={formData.orderNumber} onChange={handleChange} placeholder="Ej: 15" />
                        </div>
                        <div style={styles.group}>
                            <label htmlFor="groupNumber" style={styles.label}>Grupo</label>
                            <select id="groupNumber" style={styles.input} name="groupNumber" value={formData.groupNumber} onChange={handleChange}>
                                <option value="1">Grupo 1</option>
                                <option value="2">Grupo 2</option>
                                <option value="3">Grupo 3</option>
                                <option value="U">Grupo U (Único)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div style={styles.actions}>
                    <button type="submit" disabled={loading} style={styles.saveButton}>
                        {loading ? 'Guardando...' : (isEdit ? 'Actualizar Alumno' : 'Crear Alumno')}
                    </button>
                    <button type="button" onClick={() => navigate('/admin/students')} style={styles.cancelButton}>
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '900px',
        margin: '0 auto',
        padding: '30px',
        backgroundColor: '#f8f9fa',
        minHeight: '100vh',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        borderBottom: '2px solid #e9ecef',
        paddingBottom: '15px',
    },
    title: {
        margin: 0,
        color: '#2c3e50',
        fontSize: '1.8rem',
        fontWeight: '600',
    },
    backButton: {
        padding: '8px 16px',
        backgroundColor: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.9rem',
        transition: 'background-color 0.2s',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    section: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    },
    sectionTitle: {
        margin: '0 0 20px 0',
        fontSize: '1.1rem',
        color: '#495057',
        borderLeft: '4px solid #3498db',
        paddingLeft: '10px',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
    },
    group: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },
    label: {
        fontWeight: '500',
        fontSize: '0.85rem',
        color: '#6c757d',
    },
    input: {
        padding: '10px 12px',
        borderRadius: '6px',
        border: '1px solid #ced4da',
        fontSize: '1rem',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        outline: 'none',
    },
    actions: {
        display: 'flex',
        gap: '15px',
        marginTop: '20px',
        justifyContent: 'center',
    },
    saveButton: {
        padding: '12px 30px',
        backgroundColor: '#2ecc71',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: '600',
        boxShadow: '0 4px 6px rgba(46, 204, 113, 0.2)',
        transition: 'transform 0.2s, background-color 0.2s',
    },
    cancelButton: {
        padding: '12px 30px',
        backgroundColor: '#e74c3c',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: '600',
        boxShadow: '0 4px 6px rgba(231, 76, 60, 0.2)',
        transition: 'transform 0.2s, background-color 0.2s',
    },
    loading: {
        textAlign: 'center',
        padding: '50px',
        fontSize: '1.2rem',
        color: '#6c757d',
    }
};

export default StudentForm;
