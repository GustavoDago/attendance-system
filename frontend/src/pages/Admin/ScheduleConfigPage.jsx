import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const activityTypes = ['AULA', 'TALLER', 'EDUCACION_FISICA', 'INSTITUCIONAL'];
const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const dayNames = {
    MONDAY: 'Lunes',
    TUESDAY: 'Martes',
    WEDNESDAY: 'Miércoles',
    THURSDAY: 'Jueves',
    FRIDAY: 'Viernes'
};

const activityNames = {
    AULA: 'Aula',
    TALLER: 'Taller',
    EDUCACION_FISICA: 'Educación Física',
    INSTITUCIONAL: 'Institucional'
};

const ScheduleConfigPage = () => {
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form state
    const [newDay, setNewDay] = useState('MONDAY');
    const [newActivity, setNewActivity] = useState('EDUCACION_FISICA');
    const [newGroup, setNewGroup] = useState(''); // empty string means 'Todos'

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        if (selectedCourse) {
            fetchSchedules(selectedCourse);
        } else {
            setSchedules([]);
        }
    }, [selectedCourse]);

    const fetchCourses = async () => {
        try {
            const res = await axios.get('/api/common/courses');
            setCourses(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            toast.error('Error al cargar cursos');
        }
    };

    const fetchSchedules = async (courseId) => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/schedules/course/${courseId}`);
            setSchedules(res.data);
        } catch (error) {
            toast.error('Error al cargar horarios del curso');
        } finally {
            setLoading(false);
        }
    };

    const handleAddSchedule = async (e) => {
        e.preventDefault();
        if (!selectedCourse) {
            toast.warn('Seleccione un curso primero');
            return;
        }

        const payload = {
            courseId: selectedCourse,
            dayOfWeek: newDay,
            activityType: newActivity,
            groupNumber: newGroup === '' ? null : newGroup
        };

        try {
            await axios.post('/api/schedules', payload);
            toast.success('Actividad programada con éxito');
            fetchSchedules(selectedCourse);
        } catch (error) {
            const errMsg = error.response?.data?.message || 'Error al agregar actividad';
            toast.error(errMsg);
        }
    };

    const handleDeleteSchedule = async (id) => {
        if (!window.confirm('¿Eliminar esta actividad?')) return;
        
        try {
            await axios.delete(`/api/schedules/${id}`);
            toast.success('Actividad eliminada');
            fetchSchedules(selectedCourse);
        } catch (error) {
            toast.error('Error al eliminar actividad');
        }
    };

    const translateShift = (shift) => {
        switch (shift) {
            case 'MORNING': return 'Mañana';
            case 'AFTERNOON': return 'Tarde';
            case 'EVENING': return 'Noche';
            default: return shift;
        }
    };

    return (
        <div style={styles.container}>
            <h1>Configuración de Horarios y Actividades</h1>
            
            <div style={styles.headerCard}>
                <div style={styles.field}>
                    <label>Seleccionar Curso:</label>
                    <select 
                        value={selectedCourse} 
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        style={styles.select}
                    >
                        <option value="">Seleccione...</option>
                        {courses.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.yearLabel} {c.division} - Turno {translateShift(c.shift)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedCourse && (
                <div style={styles.contentGrid}>
                    <div style={styles.card}>
                        <h2>Agregar Actividad</h2>
                        <form onSubmit={handleAddSchedule} style={styles.form}>
                            <div style={styles.field}>
                                <label>Día:</label>
                                <select value={newDay} onChange={(e) => setNewDay(e.target.value)} style={styles.select}>
                                    {daysOfWeek.map(d => (
                                        <option key={d} value={d}>{dayNames[d]}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={styles.field}>
                                <label>Actividad:</label>
                                <select value={newActivity} onChange={(e) => setNewActivity(e.target.value)} style={styles.select}>
                                    {activityTypes.map(a => (
                                        <option key={a} value={a}>{activityNames[a]}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={styles.field}>
                                <label>Grupo:</label>
                                <select value={newGroup} onChange={(e) => setNewGroup(e.target.value)} style={styles.select}>
                                    <option value="">Todos los Grupos</option>
                                    <option value="1">Grupo 1</option>
                                    <option value="2">Grupo 2</option>
                                    <option value="3">Grupo 3</option>
                                    <option value="U">Grupo U (Único)</option>
                                </select>
                            </div>
                            <button type="submit" style={styles.button}>Agregar</button>
                        </form>
                    </div>

                    <div style={styles.card}>
                        <h2>Horario Semanal</h2>
                        {loading ? <p>Cargando...</p> : (
                            <div style={styles.weeklyGrid}>
                                {daysOfWeek.map(day => {
                                    const daySchedules = schedules.filter(s => s.dayOfWeek === day);
                                    
                                    return (
                                        <div key={day} style={styles.dayColumn}>
                                            <div style={styles.dayHeader}>{dayNames[day]}</div>
                                            <div style={styles.dayContent}>
                                                {daySchedules.length === 0 ? (
                                                    <span style={styles.emptyText}>Sin actividades</span>
                                                ) : (
                                                    daySchedules.map(schedule => (
                                                        <div key={schedule.id} style={styles.scheduleBadge}>
                                                            <div style={styles.badgeText}>
                                                                <strong>{activityNames[schedule.activityType] || schedule.activityType}</strong>
                                                                <br/>
                                                                <small>{schedule.groupNumber ? `Grupo ${schedule.groupNumber}` : 'Todos'}</small>
                                                            </div>
                                                            <button 
                                                                onClick={() => handleDeleteSchedule(schedule.id)}
                                                                style={styles.deleteBtn}
                                                                title="Eliminar"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { padding: '20px', maxWidth: '1200px', margin: '0 auto' },
    headerCard: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        marginBottom: '20px',
    },
    contentGrid: {
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: '20px',
        alignItems: 'start'
    },
    card: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
    },
    field: { display: 'flex', flexDirection: 'column', gap: '5px' },
    select: {
        padding: '10px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        fontSize: '1rem',
    },
    button: {
        padding: '10px 20px',
        backgroundColor: '#6366f1',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '600',
        marginTop: '10px'
    },
    weeklyGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '10px'
    },
    dayColumn: {
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden',
        minHeight: '200px',
        backgroundColor: '#f9fafb'
    },
    dayHeader: {
        backgroundColor: '#f3f4f6',
        padding: '10px',
        textAlign: 'center',
        fontWeight: 'bold',
        borderBottom: '1px solid #e5e7eb'
    },
    dayContent: {
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
    },
    emptyText: {
        color: '#9ca3af',
        fontSize: '0.9rem',
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: '20px'
    },
    scheduleBadge: {
        backgroundColor: 'white',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        padding: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    },
    badgeText: {
        fontSize: '0.85rem',
        color: '#374151',
        flex: 1,
        wordBreak: 'break-word',
        paddingRight: '5px'
    },
    deleteBtn: {
        background: 'none',
        border: 'none',
        color: '#ef4444',
        fontSize: '1.5rem',
        cursor: 'pointer',
        padding: '0 5px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
    }
};

export default ScheduleConfigPage;
