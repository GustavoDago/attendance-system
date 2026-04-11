import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const UserForm = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dni: '',
        role: 'STUDENT',
        nationality: 'Argentina',
        birthPlace: '',
        birthDate: '',
        address: '',
        locality: '',
        phone: '',
        fileNumber: '',
        courseIds: []
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await axios.get('/api/courses');
                setCourses(response.data);
            } catch (error) {
                console.error('Error fetching courses:', error);
            }
        };
        fetchCourses();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleCourseChange = (e) => {
        const options = e.target.options;
        const selectedIds = [];
        for (let i = 0; i < options.length; i++) {
            if (options[i].selected) {
                selectedIds.push(parseInt(options[i].value));
            }
        }
        setFormData({ ...formData, courseIds: selectedIds });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('/api/users', formData);
            toast.success('Usuario creado con éxito');
            navigate('/admin/users');
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error al crear usuario');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <h2>Agregar Nuevo Usuario</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.row}>
                    <div style={styles.group}>
                        <label htmlFor="firstName" style={styles.label}>Nombre:</label>
                        <input id="firstName" style={styles.input} name="firstName" value={formData.firstName} onChange={handleChange} required />
                    </div>
                    <div style={styles.group}>
                        <label htmlFor="lastName" style={styles.label}>Apellido:</label>
                        <input id="lastName" style={styles.input} name="lastName" value={formData.lastName} onChange={handleChange} required />
                    </div>
                </div>

                <div style={styles.row}>
                    <div style={styles.group}>
                        <label htmlFor="dni" style={styles.label}>DNI:</label>
                        <input id="dni" style={styles.input} name="dni" value={formData.dni} onChange={handleChange} required />
                    </div>
                    <div style={styles.group}>
                        <label htmlFor="role" style={styles.label}>Rol:</label>
                        <select id="role" style={styles.input} name="role" value={formData.role} onChange={handleChange}>
                            <option value="STUDENT">Estudiante</option>
                            <option value="TEACHER">Profesor</option>
                            <option value="PRECEPTOR">Preceptor</option>
                            <option value="PRINCIPAL">Directivo</option>
                        </select>
                    </div>
                </div>

                {formData.role === 'STUDENT' && (
                    <>
                        <div style={styles.row}>
                            <div style={styles.group}>
                                <label htmlFor="fileNumber" style={styles.label}>Legajo n°:</label>
                                <input id="fileNumber" style={styles.input} name="fileNumber" value={formData.fileNumber} onChange={handleChange} />
                            </div>
                        </div>

                        <div style={styles.row}>
                            <div style={styles.group}>
                                <label htmlFor="nationality" style={styles.label}>Nacionalidad:</label>
                                <input id="nationality" style={styles.input} name="nationality" value={formData.nationality} onChange={handleChange} />
                            </div>
                            <div style={styles.group}>
                                <label htmlFor="birthPlace" style={styles.label}>Lugar de Nacimiento:</label>
                                <input id="birthPlace" style={styles.input} name="birthPlace" value={formData.birthPlace} onChange={handleChange} />
                            </div>
                        </div>

                        <div style={styles.row}>
                            <div style={styles.group}>
                                <label htmlFor="birthDate" style={styles.label}>Fecha de Nacimiento:</label>
                                <input id="birthDate" type="date" style={styles.input} name="birthDate" value={formData.birthDate} onChange={handleChange} />
                            </div>
                            <div style={styles.group}>
                                <label htmlFor="phone" style={styles.label}>Teléfono:</label>
                                <input id="phone" style={styles.input} name="phone" value={formData.phone} onChange={handleChange} />
                            </div>
                        </div>

                        <div style={styles.row}>
                            <div style={styles.group}>
                                <label htmlFor="address" style={styles.label}>Domicilio:</label>
                                <input id="address" style={styles.input} name="address" value={formData.address} onChange={handleChange} />
                            </div>
                            <div style={styles.group}>
                                <label htmlFor="locality" style={styles.label}>Localidad:</label>
                                <input id="locality" style={styles.input} name="locality" value={formData.locality} onChange={handleChange} />
                            </div>
                        </div>

                        <div style={styles.group}>
                            <label htmlFor="courseIds" style={styles.label}>Cursos (Ctrl+click p/ seleccionar varios):</label>
                            <select id="courseIds" multiple style={{...styles.input, height: '100px'}} name="courseIds" value={formData.courseIds} onChange={handleCourseChange}>
                                {courses.map(course => (
                                    <option key={course.id} value={course.id}>
                                        {course.name} {course.division}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </>
                )}

                <button type="submit" disabled={loading} style={styles.button}>
                    {loading ? 'Guardando...' : 'Guardar'}
                </button>
            </form>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '700px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        borderRadius: '8px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
    },
    row: {
        display: 'flex',
        gap: '15px',
        marginBottom: '15px',
    },
    group: {
        flex: 1,
    },
    label: {
        fontWeight: 'bold',
        marginBottom: '5px',
        display: 'block',
    },
    input: {
        width: '100%',
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #ddd',
        boxSizing: 'border-box',
    },
    button: {
        padding: '10px',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '1rem',
        marginTop: '10px',
    },
};

export default UserForm;
