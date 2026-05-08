import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const activityTypes = ['AULA', 'TALLER', 'EDUCACION_FISICA', 'INSTITUCIONAL'];

const ManualAttendancePage = () => {
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState([]);
    const [scheduledActivities, setScheduledActivities] = useState([]);
    const [suspendedActivities, setSuspendedActivities] = useState({});
    const [holidayInfo, setHolidayInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchMetadata();
    }, []);

    const fetchMetadata = async () => {
        try {
            const [coursesRes] = await Promise.all([
                axios.get('/api/common/courses')
            ]);
            setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
            
            if (!Array.isArray(coursesRes.data)) {
                console.error('API /api/common/courses returned non-array:', coursesRes.data);
            }
        } catch (error) {
            toast.error('Error al cargar metadatos');
        }
    };

    useEffect(() => {
        checkHoliday(date);
    }, [date]);

    const checkHoliday = async (selectedDate) => {
        try {
            const res = await axios.get(`/api/holidays/check?date=${selectedDate}`);
            if (res.status === 200 && res.data) {
                setHolidayInfo(res.data);
                setStudents([]); // Clear table if any
            } else {
                setHolidayInfo(null);
            }
        } catch (error) {
            setHolidayInfo(null);
        }
    };

    const handleFetchStudents = async () => {
        if (holidayInfo) {
            toast.info('No se puede cargar asistencia en un día feriado');
            return;
        }
        if (!selectedCourse) {
            toast.warn('Seleccione un curso');
            return;
        }
        setLoading(true);
        try {
            const [studentsRes, attendanceRes, activitiesRes] = await Promise.all([
                axios.get(`/api/students`, { params: { courseId: selectedCourse } }),
                axios.get(`/api/activity-attendance`, { params: { courseId: selectedCourse, date } }),
                axios.get(`/api/common/courses/${selectedCourse}/activities`, { params: { date } })
            ]);

            const existingAttendance = attendanceRes.data;
            const activeActivitiesData = activitiesRes.data;
            
            setScheduledActivities(activeActivitiesData);
            setSuspendedActivities({});
            
            const studentList = studentsRes.data.map(s => {
                const statuses = {};
                activityTypes.forEach(type => {
                    const record = existingAttendance.find(a => a.student.id === s.id && a.activityType === type);
                    
                    const isScheduledForStudent = activeActivitiesData.some(act => 
                        act.activityType === type && 
                        (act.groupNumber === null || act.groupNumber === s.groupNumber)
                    );

                    let defaultStatus = 'PRESENTE';
                    if (!isScheduledForStudent && type !== 'INSTITUCIONAL') {
                        defaultStatus = 'NO_APLICA';
                    }
                    if (type === 'INSTITUCIONAL') {
                        defaultStatus = 'NO_APLICA';
                    }
                    
                    statuses[type] = record ? record.status : defaultStatus;
                });
                return { ...s, statuses };
            });
            setStudents(studentList);
        } catch (error) {
            toast.error('Error al cargar alumnos o asistencia previa');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (studentId, type, newStatus) => {
        setStudents(students.map(s => 
            s.id === studentId 
                ? { ...s, statuses: { ...s.statuses, [type]: newStatus } } 
                : s
        ));
    };

    const handleSuspendToggle = (type) => {
        const isSuspended = !suspendedActivities[type];
        setSuspendedActivities({ ...suspendedActivities, [type]: isSuspended });
        
        // Update all students to NO_APLICA if suspended, or back to PRESENTE if unsuspended
        if (isSuspended) {
            setStudents(students.map(s => ({
                ...s,
                statuses: { ...s.statuses, [type]: 'NO_APLICA' }
            })));
        } else {
            setStudents(students.map(s => ({
                ...s,
                statuses: { ...s.statuses, [type]: 'PRESENTE' }
            })));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const records = [];
            students.forEach(s => {
                activityTypes.forEach(type => {
                    records.push({
                        studentId: s.id,
                        activityType: type,
                        status: s.statuses[type]
                    });
                });
            });

            const payload = {
                date,
                records
            };
            await axios.post('/api/activity-attendance/batch', payload);
            toast.success('Asistencia guardada con éxito');
        } catch (error) {
            toast.error('Error al guardar asistencia');
        } finally {
            setSaving(false);
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

    const getStatusLabel = (status) => {
        switch (status) {
            case 'PRESENTE': return 'Presente';
            case 'AUSENTE': return 'Ausente';
            case 'AUSENTE_J': return 'Ausente Justif.';
            case 'TARDANZA_1_4': return 'Tardanza 1/4';
            case 'TARDANZA_1_4_J': return 'Tardanza 1/4 Justif.';
            case 'TARDANZA_1_2': return 'Tardanza 1/2';
            case 'TARDANZA_1_2_J': return 'Tardanza 1/2 Justif.';
            case 'RETIRO_1_2': return 'Retiro 1/2';
            case 'RETIRO_1_2_J': return 'Retiro 1/2 Justif.';
            case 'RETIRO_1_4': return 'Retiro 1/4';
            case 'RETIRO_1_4_J': return 'Retiro 1/4 Justif.';
            case 'NO_APLICA': return 'No Aplica';
            default: return status;
        }
    };

    const renderActivityHeader = (title, type) => {
        const isScheduledForAnyGroup = scheduledActivities.some(act => act.activityType === type) || type === 'INSTITUCIONAL';
        return (
            <th style={styles.th}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                    <span>{title}</span>
                    {isScheduledForAnyGroup && type !== 'INSTITUCIONAL' && (
                        <label style={styles.suspendLabel}>
                            <input 
                                type="checkbox" 
                                checked={suspendedActivities[type] || false} 
                                onChange={() => handleSuspendToggle(type)} 
                            /> Suspender
                        </label>
                    )}
                </div>
            </th>
        );
    };

    return (
        <div style={styles.container}>
            <h1>Carga de Asistencia Manual - Multi-Actividad</h1>
            
            <div style={styles.filters}>
                <div style={styles.field}>
                    <label>Curso:</label>
                    <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
                        <option value="">Seleccione...</option>
                        {Array.isArray(courses) && courses.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.yearLabel} {c.division} - Turno {translateShift(c.shift)}
                            </option>
                        ))}
                    </select>
                </div>
                <div style={styles.field}>
                    <label>Fecha:</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <button onClick={handleFetchStudents} disabled={loading || holidayInfo !== null} style={styles.button}>
                    {loading ? 'Cargando...' : 'Cargar Planilla'}
                </button>
            </div>

            {holidayInfo && (
                <div style={styles.holidayAlert}>
                    <h3>🏖️ Día No Lectivo / Feriado</h3>
                    <p><strong>Motivo:</strong> {holidayInfo.reason}</p>
                    <p>No se requiere ni se permite la carga de asistencia para este día.</p>
                </div>
            )}

            {!holidayInfo && students.length > 0 && (
                <div style={styles.tableSection}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Alumno</th>
                                {renderActivityHeader('Aula', 'AULA')}
                                {renderActivityHeader('Taller', 'TALLER')}
                                {renderActivityHeader('Ed. Física', 'EDUCACION_FISICA')}
                                {renderActivityHeader('Inst.', 'INSTITUCIONAL')}
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student) => {
                                return (
                                    <tr key={student.id} style={styles.tr}>
                                        <td style={styles.tdName}>{student.lastName}, {student.firstName}</td>
                                        {activityTypes.map(type => {
                                            const isScheduledForStudent = scheduledActivities.some(act => 
                                                act.activityType === type && 
                                                (act.groupNumber === null || act.groupNumber === student.groupNumber)
                                            );
                                            const isNotScheduled = !isScheduledForStudent && type !== 'INSTITUCIONAL';
                                            const isSuspended = suspendedActivities[type] || false;
                                            const isDisabled = isNotScheduled || isSuspended;
                                            
                                            const currentStatus = student.statuses[type];
                                            
                                            return (
                                                <td key={type} style={styles.td}>
                                                    <select 
                                                        value={currentStatus} 
                                                        onChange={(e) => handleStatusChange(student.id, type, e.target.value)}
                                                        disabled={isDisabled}
                                                        title={getStatusLabel(currentStatus)}
                                                        style={{
                                                            ...styles.select, 
                                                            ...getStatusStyle(currentStatus),
                                                            ...(isDisabled ? styles.disabledSelect : {})
                                                        }}
                                                    >
                                                        {isDisabled ? (
                                                            <option value="NO_APLICA" title="No Aplica">N/A</option>
                                                        ) : (
                                                            <>
                                                                <option value="PRESENTE" title="Presente">P</option>
                                                                <option value="AUSENTE" title="Ausente">A</option>
                                                                <option value="AUSENTE_J" title="Ausente Justificada">AJ</option>
                                                                <option value="TARDANZA_1_4" title="Tardanza 1/4">T¼</option>
                                                                <option value="TARDANZA_1_4_J" title="Tardanza 1/4 Justificada">TJ¼</option>
                                                                <option value="TARDANZA_1_2" title="Tardanza 1/2">T½</option>
                                                                <option value="TARDANZA_1_2_J" title="Tardanza 1/2 Justificada">TJ½</option>
                                                                <option value="RETIRO_1_2" title="Retiro 1/2">R½</option>
                                                                <option value="RETIRO_1_2_J" title="Retiro 1/2 Justificado">RJ½</option>
                                                                <option value="RETIRO_1_4" title="Retiro 1/4">R¼</option>
                                                                <option value="RETIRO_1_4_J" title="Retiro 1/4 Justificado">RJ¼</option>
                                                                <option value="NO_APLICA" title="No Aplica">N/A</option>
                                                            </>
                                                        )}
                                                    </select>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <div style={styles.footer}>
                        <button onClick={handleSave} disabled={saving} style={styles.saveButton}>
                            {saving ? 'Guardando...' : 'Confirmar Todo'}
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
        case 'AUSENTE_J': return { backgroundColor: '#e3f2fd', color: '#1565c0' };
        case 'TARDANZA_1_4': 
        case 'TARDANZA_1_2': 
        case 'RETIRO_1_2': 
        case 'RETIRO_1_4': return { backgroundColor: '#fff3e0', color: '#ef6c00' };
        case 'TARDANZA_1_4_J': 
        case 'TARDANZA_1_2_J': 
        case 'RETIRO_1_2_J': 
        case 'RETIRO_1_4_J': return { backgroundColor: '#e8eaf6', color: '#283593' };
        case 'NO_APLICA': return { backgroundColor: '#f3f4f6', color: '#6b7280' };
        default: return { backgroundColor: '#fff3e0', color: '#ef6c00' };
    }
};

const styles = {
    container: { padding: '20px', maxWidth: '1200px', margin: '0 auto' },
    holidayAlert: {
        backgroundColor: '#fef3c7',
        border: '1px solid #f59e0b',
        color: '#92400e',
        padding: '20px',
        borderRadius: '12px',
        textAlign: 'center',
        marginBottom: '20px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
    },
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
        overflowX: 'auto'
    },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #f3f4f6' },
    tr: { borderBottom: '1px solid #f3f4f6' },
    tdName: { padding: '12px', fontWeight: '500', minWidth: '200px' },
    td: { padding: '8px' },
    select: {
        padding: '6px',
        borderRadius: '6px',
        border: '1px solid #e5e7eb',
        fontSize: '0.85rem',
        width: '80px'
    },
    disabledSelect: {
        backgroundColor: '#f3f4f6',
        color: '#9ca3af',
        cursor: 'not-allowed',
        border: '1px dashed #d1d5db'
    },
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
    },
    suspendLabel: {
        fontSize: '0.75rem',
        fontWeight: 'normal',
        color: '#d97706',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        cursor: 'pointer'
    }
};

export default ManualAttendancePage;
