import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const ManualAttendancePage = () => {
    const [courses, setCourses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [activityType, setActivityType] = useState('AULA');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchMetadata();
    }, []);

    const fetchMetadata = async () => {
        try {
            const [coursesRes, subjectsRes] = await Promise.all([
                axios.get('/api/common/courses'),
                axios.get('/api/common/subjects')
            ]);
            setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
            setSubjects(Array.isArray(subjectsRes.data) ? subjectsRes.data : []);
            
            if (!Array.isArray(coursesRes.data)) {
                console.error('API /api/common/courses returned non-array:', coursesRes.data);
            }
            if (!Array.isArray(subjectsRes.data)) {
                console.error('API /api/common/subjects returned non-array:', subjectsRes.data);
            }
        } catch (error) {
            toast.error('Error al cargar metadatos');
        }
    };

    const handleFetchStudents = async () => {
        if (!selectedCourse) {
            toast.warn('Seleccione un curso');
            return;
        }
        setLoading(true);
        try {
            const params = { courseId: selectedCourse };
            if (selectedGroup) params.groupNumber = selectedGroup;
            
            const response = await axios.get(`/api/students`, { params });
            // Initialize each student with PRESENTE status
            const studentList = response.data.map(s => ({
                ...s,
                status: 'PRESENTE'
            }));
            setStudents(studentList);
        } catch (error) {
            toast.error('Error al cargar alumnos');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (studentId, newStatus) => {
        setStudents(students.map(s => s.id === studentId ? { ...s, status: newStatus } : s));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                date,
                activityType,
                subjectId: selectedSubject || null,
                records: students.map(s => ({
                    studentId: s.id,
                    status: s.status
                }))
            };
            await axios.post('/api/activity-attendance/batch', payload);
            toast.success('Asistencia guardada con éxito');
        } catch (error) {
            toast.error('Error al guardar asistencia');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={styles.container}>
            <h1>Carga de Asistencia Manual (Res. 1650/2024)</h1>
            
            <div style={styles.filters}>
                <div style={styles.field}>
                    <label>Curso:</label>
                    <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
                        <option value="">Seleccione...</option>
                        {Array.isArray(courses) && courses.map(c => (
                            <option key={c.id} value={c.id}>{c.yearLabel} {c.division} - {c.shift}</option>
                        ))}
                    </select>
                </div>
                <div style={styles.field}>
                    <label>Grupo:</label>
                    <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
                        <option value="">Todos</option>
                        <option value="1">Grupo 1</option>
                        <option value="2">Grupo 2</option>
                        <option value="3">Grupo 3</option>
                    </select>
                </div>
                <div style={styles.field}>
                    <label>Fecha:</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div style={styles.field}>
                    <label>Momento:</label>
                    <select value={activityType} onChange={(e) => setActivityType(e.target.value)}>
                        <option value="AULA">Aula</option>
                        <option value="TALLER">Taller</option>
                        <option value="EDUCACION_FISICA">Educación Física</option>
                    </select>
                </div>
                <div style={styles.field}>
                    <label>Materia (opcional):</label>
                    <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                        <option value="">General</option>
                        {Array.isArray(subjects) && subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
                <button onClick={handleFetchStudents} disabled={loading} style={styles.button}>
                    {loading ? 'Cargando...' : 'Cargar Alumnos'}
                </button>
            </div>

            {students.length > 0 && (
                <div style={styles.tableSection}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th>Orden</th>
                                <th>Alumno</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student, index) => (
                                <tr key={student.id}>
                                    <td>{index + 1}</td>
                                    <td>{student.lastName}, {student.firstName}</td>
                                    <td>
                                        <select 
                                            value={student.status} 
                                            onChange={(e) => handleStatusChange(student.id, e.target.value)}
                                            style={getStatusStyle(student.status)}
                                        >
                                            <option value="PRESENTE">Presente</option>
                                            <option value="AUSENTE">Ausente</option>
                                            <option value="TARDANZA_1_4">Tardanza (1/4)</option>
                                            <option value="TARDANZA_1_2">Tardanza (1/2)</option>
                                            <option value="RETIRO_ANTICIPADO">Retiro (1/2)</option>
                                            <option value="JUSTIFICADA">Justificada</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div style={styles.footer}>
                        <button onClick={handleSave} disabled={saving} style={styles.saveButton}>
                            {saving ? 'Guardando...' : 'Confirmar Asistencia'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const getStatusStyle = (status) => {
    switch (status) {
        case 'PRESENTE': return { backgroundColor: '#e8f5e9', color: '#2e7d32' };
        case 'AUSENTE': return { backgroundColor: '#ffebee', color: '#c62828' };
        case 'JUSTIFICADA': return { backgroundColor: '#e3f2fd', color: '#1565c0' };
        default: return { backgroundColor: '#fff3e0', color: '#ef6c00' };
    }
};

const styles = {
    container: { padding: '20px' },
    filters: {
        display: 'flex',
        gap: '20px',
        flexWrap: 'wrap',
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        marginBottom: '20px',
        alignItems: 'flex-end'
    },
    field: { display: 'flex', flexDirection: 'column', gap: '5px' },
    button: {
        padding: '10px 20px',
        backgroundColor: '#6366f1',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '600'
    },
    tableSection: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    },
    table: { width: '100%', borderCollapse: 'collapse' },
    footer: { marginTop: '20px', display: 'flex', justifyContent: 'flex-end' },
    saveButton: {
        padding: '12px 30px',
        backgroundColor: '#10b981',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: 'bold'
    }
};

export default ManualAttendancePage;
