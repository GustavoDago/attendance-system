import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const SubjectReportPage = () => {
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // Default dates: current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const [startDate, setStartDate] = useState(firstDay);
    const [endDate, setEndDate] = useState(lastDay);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await axios.get('/api/students');
            setStudents(response.data);
        } catch (error) {
            toast.error('Error al cargar alumnos');
        }
    };

    const handleGenerateReport = async () => {
        if (!selectedStudent) {
            toast.warn('Seleccione un alumno');
            return;
        }
        setLoading(true);
        try {
            const response = await axios.get(`/api/reports/institutional`, {
                params: {
                    studentId: selectedStudent,
                    start: startDate,
                    end: endDate
                }
            });
            setReport(response.data);
        } catch (error) {
            toast.error('Error al generar el reporte');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <h1>Reporte por Materias (Res. 1650/2024)</h1>
            
            <div style={styles.filters}>
                <div style={styles.field}>
                    <label>Alumno:</label>
                    <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
                        <option value="">Seleccione...</option>
                        {students.map(s => (
                            <option key={s.id} value={s.id}>{s.lastName}, {s.firstName} ({s.dni})</option>
                        ))}
                    </select>
                </div>
                <div style={styles.field}>
                    <label>Desde:</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div style={styles.field}>
                    <label>Hasta:</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
                <button onClick={handleGenerateReport} disabled={loading} style={styles.button}>
                    {loading ? 'Generando...' : 'Ver Reporte'}
                </button>
            </div>

            {report && (
                <div style={styles.reportSection}>
                    <div style={styles.header}>
                        <h2>Resumen para {report.studentName}</h2>
                        <div style={styles.institutionalBox}>
                            <span style={styles.label}>Inasistencias Institucionales Totales:</span>
                            <span style={styles.value}>{report.totalAbsences.toFixed(2)}</span>
                            {report.totalAbsences > 28 && <span style={styles.alert}>⚠️ Superó límite de 28</span>}
                        </div>
                    </div>

                    <div style={styles.subjectGrid}>
                        {Object.entries(report.subjectAttendance).map(([subject, percentage]) => (
                            <div key={subject} style={styles.subjectCard}>
                                <h3>{subject}</h3>
                                <div style={styles.percentageCircle}>
                                    <span style={{ 
                                        ...styles.percentageText, 
                                        color: percentage < 75 ? '#ef4444' : '#10b981' 
                                    }}>
                                        {percentage.toFixed(1)}%
                                    </span>
                                </div>
                                <div style={styles.statusLabel}>
                                    {percentage < 75 ? (
                                        <span style={styles.intensificacion}>Requiere Intensificación</span>
                                    ) : (
                                        <span style={styles.regular}>Regular</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
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
    reportSection: {
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid #f3f4f6',
        paddingBottom: '20px',
        marginBottom: '30px'
    },
    institutionalBox: {
        backgroundColor: '#f9fafb',
        padding: '15px 25px',
        borderRadius: '10px',
        textAlign: 'right'
    },
    label: { color: '#6b7280', fontSize: '0.9rem', marginRight: '10px' },
    value: { fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' },
    alert: { display: 'block', color: '#ef4444', fontWeight: 'bold', fontSize: '0.8rem', marginTop: '5px' },
    subjectGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '20px'
    },
    subjectCard: {
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px',
        textAlign: 'center'
    },
    percentageCircle: {
        margin: '15px 0',
        fontSize: '1.8rem',
        fontWeight: '800'
    },
    intensificacion: {
        backgroundColor: '#fef2f2',
        color: '#b91c1c',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '0.8rem',
        fontWeight: '600'
    },
    regular: {
        backgroundColor: '#f0fdf4',
        color: '#15803d',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '0.8rem',
        fontWeight: '600'
    }
};

export default SubjectReportPage;
