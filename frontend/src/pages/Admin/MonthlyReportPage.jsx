import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Papa from 'papaparse';

const MonthlyReportPage = () => {
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    
    const currentDate = new Date();
    const [year, setYear] = useState(currentDate.getFullYear());
    const [month, setMonth] = useState(currentDate.getMonth() + 1); // 1-12
    
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await axios.get('/api/common/courses');
            setCourses(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            toast.error('Error al cargar cursos');
        }
    };

    const handleGenerate = async () => {
        if (!selectedCourse) {
            toast.warn('Seleccione un curso');
            return;
        }

        setLoading(true);
        try {
            const res = await axios.get('/api/reports/monthly', {
                params: {
                    courseId: selectedCourse,
                    year: year,
                    month: month
                }
            });
            setReportData(res.data);
        } catch (error) {
            toast.error('Error al generar la planilla mensual');
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        if (!reportData || !reportData.students) return;

        const { daysInMonth, students, dailyTotals } = reportData;
        const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        const csvData = students.map(student => {
            const row = {
                'N°': student.orderNumber || '',
                'Alumno': `${student.lastName}, ${student.firstName}`
            };

            daysArray.forEach(day => {
                const record = student.dailyRecords[day];
                row[day] = record ? record.statusLabel : '';
            });

            row['Faltas Mes'] = student.monthlyTotal.toFixed(1);
            row['Faltas Año'] = student.annualTotal.toFixed(1);

            return row;
        });

        // Add daily totals row
        if (dailyTotals) {
            const totalsRow = {
                'N°': '',
                'Alumno': 'TOTALES'
            };
            daysArray.forEach(day => {
                const dt = dailyTotals[day];
                if (dt && dt.totalStudents > 0) {
                    totalsRow[day] = `P:${dt.presentCount} A:${dt.absentCount}`;
                } else {
                    totalsRow[day] = '';
                }
            });
            totalsRow['Faltas Mes'] = '';
            totalsRow['Faltas Año'] = '';
            csvData.push(totalsRow);
        }

        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `planilla_mensual_${reportData.courseName.replace(/ /g, '_')}_${year}_${month}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const translateShift = (shift) => {
        switch (shift) {
            case 'MORNING': return 'Mañana';
            case 'AFTERNOON': return 'Tarde';
            case 'EVENING': return 'Noche';
            default: return shift;
        }
    };

    const getCellColor = (label) => {
        if (label === 'P') return '#dcfce7'; // Light green
        if (label === 'A') return '#fee2e2'; // Light red
        if (label === 'AJ') return '#dbeafe'; // Light blue (justified)
        if (label === 'T½' || label === 'T¼' || label === 'R½' || label === 'R¼') return '#fef3c7'; // Light orange
        if (label === 'TJ½' || label === 'TJ¼' || label === 'RJ½' || label === 'RJ¼') return '#e0e7ff'; // Light indigo (justified)
        if (label === 'H') return '#e0f2fe'; // Light blue
        if (label === '-') return '#f3f4f6'; // Gray
        // Fallback for numeric values
        if (label === '0.5' || label === '0.25' || label === '1.0') return '#fef3c7';
        return 'transparent';
    };

    return (
        <div style={styles.container}>
            <h1>Planilla Mensual Consolidada</h1>
            <p style={styles.subtitle}>
                Resumen de asistencia mensual con cálculo de medias faltas.
            </p>

            <div style={styles.filters}>
                <div style={styles.field}>
                    <label>Curso:</label>
                    <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
                        <option value="">Seleccione...</option>
                        {courses.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.yearLabel} {c.division} - Turno {translateShift(c.shift)}
                            </option>
                        ))}
                    </select>
                </div>
                <div style={styles.field}>
                    <label>Año:</label>
                    <input 
                        type="number" 
                        value={year} 
                        onChange={(e) => setYear(e.target.value)} 
                        min="2000" 
                        max="2100" 
                        style={styles.input}
                    />
                </div>
                <div style={styles.field}>
                    <label>Mes:</label>
                    <select value={month} onChange={(e) => setMonth(e.target.value)}>
                        <option value="1">Enero</option>
                        <option value="2">Febrero</option>
                        <option value="3">Marzo</option>
                        <option value="4">Abril</option>
                        <option value="5">Mayo</option>
                        <option value="6">Junio</option>
                        <option value="7">Julio</option>
                        <option value="8">Agosto</option>
                        <option value="9">Septiembre</option>
                        <option value="10">Octubre</option>
                        <option value="11">Noviembre</option>
                        <option value="12">Diciembre</option>
                    </select>
                </div>
                <button onClick={handleGenerate} disabled={loading} style={styles.button}>
                    {loading ? 'Generando...' : 'Generar Planilla'}
                </button>
            </div>

            {reportData && (
                <div style={styles.reportSection}>
                    <div style={styles.header}>
                        <h2>{reportData.courseName} - {month}/{year}</h2>
                        <button onClick={handleExportCSV} style={styles.exportBtn}>
                            📥 Exportar CSV
                        </button>
                    </div>

                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={{...styles.th, ...styles.stickyLeft}}>Alumno</th>
                                    {Array.from({ length: reportData.daysInMonth }, (_, i) => i + 1).map(day => (
                                        <th key={day} style={styles.thDay}>{day}</th>
                                    ))}
                                    <th style={styles.thTotal}>Faltas Mes</th>
                                    <th style={styles.thTotal}>Faltas Año</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.students.length === 0 ? (
                                    <tr>
                                        <td colSpan={reportData.daysInMonth + 3} style={styles.emptyText}>
                                            No hay alumnos o registros para este curso.
                                        </td>
                                    </tr>
                                ) : (
                                    reportData.students.sort((a, b) => a.lastName.localeCompare(b.lastName)).map(student => (
                                        <tr key={student.studentId} style={styles.tr}>
                                            <td style={{...styles.tdName, ...styles.stickyLeft}}>
                                                <small style={{color:'#6b7280', marginRight:'5px'}}>{student.orderNumber}</small>
                                                {student.lastName}, {student.firstName}
                                            </td>
                                            {Array.from({ length: reportData.daysInMonth }, (_, i) => i + 1).map(day => {
                                                const record = student.dailyRecords[day];
                                                const label = record ? record.statusLabel : '';
                                                return (
                                                    <td 
                                                        key={day} 
                                                        style={{
                                                            ...styles.tdDay, 
                                                            backgroundColor: getCellColor(label)
                                                        }}
                                                        title={label === 'H' ? 'Día Feriado / No Lectivo' : ''}
                                                    >
                                                        {label}
                                                    </td>
                                                );
                                            })}
                                            <td style={styles.tdTotalMonth}>
                                                <strong>{student.monthlyTotal.toFixed(1)}</strong>
                                            </td>
                                            <td style={styles.tdTotalYear}>
                                                <strong>{student.annualTotal.toFixed(1)}</strong>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {reportData.dailyTotals && reportData.students.length > 0 && (
                                <tfoot>
                                    <tr style={styles.totalsRow}>
                                        <td style={{...styles.tdTotalsLabel, ...styles.stickyLeft}}>
                                            <strong>TOTALES</strong>
                                        </td>
                                        {Array.from({ length: reportData.daysInMonth }, (_, i) => i + 1).map(day => {
                                            const dt = reportData.dailyTotals[day];
                                            if (!dt || dt.totalStudents === 0) {
                                                return <td key={day} style={styles.tdTotalsEmpty}>-</td>;
                                            }
                                            return (
                                                <td key={day} style={styles.tdTotalsDay}>
                                                    <div style={styles.totalsPresent}>{dt.presentCount}</div>
                                                    <div style={styles.totalsAbsent}>{dt.absentCount}</div>
                                                </td>
                                            );
                                        })}
                                        <td style={styles.tdTotalsEmpty}></td>
                                        <td style={styles.tdTotalsEmpty}></td>
                                    </tr>
                                    <tr>
                                        <td colSpan={reportData.daysInMonth + 3} style={styles.totalsLegend}>
                                            <span style={{color: '#16a34a', fontWeight: '600'}}>■ Presentes</span>
                                            {' / '}
                                            <span style={{color: '#dc2626', fontWeight: '600'}}>■ Ausentes/Faltas</span>
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { padding: '20px', maxWidth: '1400px', margin: '0 auto' },
    subtitle: { color: '#6b7280', marginBottom: '20px' },
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
    input: { padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', width: '100px' },
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
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
    },
    exportBtn: {
        padding: '8px 15px',
        backgroundColor: '#10b981',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold'
    },
    tableWrapper: {
        overflowX: 'auto',
        maxWidth: '100%',
        position: 'relative'
    },
    table: {
        borderCollapse: 'collapse',
        width: 'max-content',
        fontSize: '0.85rem'
    },
    stickyLeft: {
        position: 'sticky',
        left: 0,
        backgroundColor: 'white',
        zIndex: 2,
        borderRight: '2px solid #e5e7eb'
    },
    th: {
        padding: '12px',
        textAlign: 'left',
        borderBottom: '2px solid #e5e7eb',
        backgroundColor: '#f9fafb'
    },
    thDay: {
        padding: '8px',
        minWidth: '35px',
        textAlign: 'center',
        borderBottom: '2px solid #e5e7eb',
        borderRight: '1px solid #f3f4f6',
        backgroundColor: '#f9fafb'
    },
    thTotal: {
        padding: '12px',
        textAlign: 'center',
        borderBottom: '2px solid #e5e7eb',
        backgroundColor: '#fef3c7',
        fontWeight: 'bold'
    },
    tr: {
        borderBottom: '1px solid #f3f4f6'
    },
    tdName: {
        padding: '12px',
        fontWeight: '500',
        whiteSpace: 'nowrap'
    },
    tdDay: {
        padding: '8px',
        textAlign: 'center',
        borderRight: '1px solid #f3f4f6',
        fontWeight: '600',
        color: '#374151'
    },
    tdTotalMonth: {
        padding: '12px',
        textAlign: 'center',
        backgroundColor: '#fffbeb',
        color: '#92400e'
    },
    tdTotalYear: {
        padding: '12px',
        textAlign: 'center',
        backgroundColor: '#fffbeb',
        color: '#b45309'
    },
    emptyText: {
        padding: '20px',
        textAlign: 'center',
        color: '#9ca3af',
        fontStyle: 'italic'
    },
    // Daily totals row styles
    totalsRow: {
        borderTop: '3px solid #6366f1',
        backgroundColor: '#f8fafc'
    },
    tdTotalsLabel: {
        padding: '12px',
        fontWeight: 'bold',
        color: '#4338ca',
        backgroundColor: '#f8fafc',
        whiteSpace: 'nowrap'
    },
    tdTotalsDay: {
        padding: '4px 6px',
        textAlign: 'center',
        borderRight: '1px solid #e5e7eb',
        fontSize: '0.75rem',
        lineHeight: '1.2'
    },
    tdTotalsEmpty: {
        padding: '8px',
        textAlign: 'center',
        borderRight: '1px solid #f3f4f6',
        color: '#d1d5db'
    },
    totalsPresent: {
        color: '#16a34a',
        fontWeight: '700'
    },
    totalsAbsent: {
        color: '#dc2626',
        fontWeight: '700'
    },
    totalsLegend: {
        padding: '8px 12px',
        fontSize: '0.75rem',
        color: '#6b7280',
        textAlign: 'left',
        backgroundColor: '#f8fafc'
    }
};

export default MonthlyReportPage;
