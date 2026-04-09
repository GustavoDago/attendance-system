import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/attendance/dashboard');
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <p>Cargando Dashboard...</p>;
    if (!stats) return <p>No se pudieron cargar las estadísticas.</p>;

    return (
        <div style={styles.container}>
            <h1>Dashboard de Asistencia</h1>
            <p>Bienvenido, {user?.firstName} {user?.lastName} ({user?.role})</p>

            {/* Metrics Cards */}
            <div style={styles.metricsGrid}>
                <Card title="Total Alumnos" value={stats.totalStudents} color="#2196F3" />
                <Card title="Presentes Hoy" value={stats.presentCount} color="#4CAF50" />
                <Card title="Ausentes" value={stats.absentCount} color="#f44336" />
                <Card title="Asistencia %" value={`${((stats.presentCount / (stats.totalStudents || 1)) * 100).toFixed(1)}%`} color="#FF9800" />
            </div>

            <div style={styles.sectionsGrid}>
                {/* Course Breakdown */}
                <div style={styles.section}>
                    <h3>Desglose por Curso</h3>
                    <div style={styles.courseList}>
                        {stats.courseStats.map(course => (
                            <div key={course.id} style={styles.courseItem}>
                                <div style={styles.courseHeader}>
                                    <span>{course.name} {course.division}</span>
                                    <span>{course.present}/{course.total}</span>
                                </div>
                                <div style={styles.progressBarBg}>
                                    <div style={{ 
                                        ...styles.progressBarFill, 
                                        width: `${course.percentage}%`,
                                        backgroundColor: course.percentage > 80 ? '#4CAF50' : course.percentage > 50 ? '#FF9800' : '#f44336'
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Absent Students */}
                <div style={styles.section}>
                    <h3>Ausentes Hoy ({stats.absentStudents.length})</h3>
                    <div style={styles.absentList}>
                        {stats.absentStudents.length === 0 ? (
                            <p>No hay ausentes reportados.</p>
                        ) : (
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Alumno</th>
                                        <th>Curso</th>
                                        <th>DNI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.absentStudents.map(student => (
                                        <tr key={student.id}>
                                            <td>{student.firstName} {student.lastName}</td>
                                            <td>{student.courseName}</td>
                                            <td>{student.dni}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Card = ({ title, value, color }) => (
    <div style={{ ...styles.card, borderLeft: `5px solid ${color}` }}>
        <h4 style={styles.cardTitle}>{title}</h4>
        <p style={{ ...styles.cardValue, color }}>{value}</p>
    </div>
);

const styles = {
    container: {
        padding: '10px',
    },
    metricsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px',
        marginTop: '20px',
    },
    card: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    cardTitle: {
        margin: 0,
        color: '#666',
        fontSize: '0.9rem',
        textTransform: 'uppercase',
    },
    cardValue: {
        margin: '10px 0 0 0',
        fontSize: '2rem',
        fontWeight: 'bold',
    },
    sectionsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '30px',
    },
    section: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    courseList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        marginTop: '15px'
    },
    courseItem: {
        width: '100%',
    },
    courseHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '5px',
        fontSize: '0.9rem',
        fontWeight: 'bold'
    },
    progressBarBg: {
        width: '100%',
        height: '10px',
        backgroundColor: '#eee',
        borderRadius: '5px',
        overflow: 'hidden'
    },
    progressBarFill: {
        height: '100%',
        transition: 'width 0.5s ease'
    },
    absentList: {
        marginTop: '15px',
        maxHeight: '400px',
        overflowY: 'auto'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    th: {
        textAlign: 'left',
        padding: '10px',
        borderBottom: '2px solid #eee',
        fontSize: '0.85rem'
    },
    td: {
        padding: '10px',
        borderBottom: '1px solid #eee',
        fontSize: '0.9rem'
    }
};

export default Dashboard;
