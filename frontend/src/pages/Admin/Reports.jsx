import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Papa from 'papaparse';

const Reports = () => {
    const [tab, setTab] = useState('PRESENT'); // PRESENT or HISTORY
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [tab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const endpoint = tab === 'PRESENT'
                ? '/api/attendance/present'
                : '/api/attendance/history';

            const response = await axios.get(endpoint);
            setData(response.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportCSV = () => {
        if (!data || data.length === 0) return;

        let csvData = [];
        if (tab === 'PRESENT') {
            csvData = data.map(item => ({
                "Hora de Ingreso": new Date(item.timestamp).toLocaleString(),
                Nombre: item.user ? item.user.firstName : 'Usuario Desconocido',
                Apellido: item.user ? item.user.lastName : '',
                Rol: item.user ? item.user.role : '',
                DNI: item.user ? item.user.dni : ''
            }));
        } else {
            csvData = data.map(item => ({
                "Fecha/Hora": new Date(item.timestamp).toLocaleString(),
                Nombre: item.user ? `${item.user.firstName} ${item.user.lastName}` : 'Usuario Desconocido',
                "Acción": item.type === 'ENTRY' ? 'INGRESO' : item.type === 'LATE' ? 'INGRESO (TARDE)' : 'EGRESO'
            }));
        }

        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `reporte_${tab}_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div>
            <h1>Reportes</h1>
            <div style={styles.header}>
                <div style={styles.tabs}>
                    <button
                        style={{ ...styles.tab, backgroundColor: tab === 'PRESENT' ? '#4CAF50' : '#ddd' }}
                        onClick={() => setTab('PRESENT')}
                    >
                        Presentes Ahora
                    </button>
                    <button
                        style={{ ...styles.tab, backgroundColor: tab === 'HISTORY' ? '#4CAF50' : '#ddd' }}
                        onClick={() => setTab('HISTORY')}
                    >
                        Historial Completo
                    </button>
                </div>
                <button style={styles.exportButton} onClick={exportCSV} disabled={loading || data.length === 0}>
                    📥 Exportar CSV
                </button>
            </div>

            {loading ? <p>Cargando...</p> : (
                <table style={styles.table}>
                    <thead>
                        {tab === 'PRESENT' ? (
                            <tr>
                                <th>Fecha/Hora</th>
                                <th>Nombre</th>
                                <th>Apellido</th>
                                <th>Rol</th>
                                <th>DNI</th>
                            </tr>
                        ) : (
                            <tr>
                                <th>Fecha/Hora</th>
                                <th>Nombre</th>
                                <th>Acción</th>
                            </tr>
                        )}
                    </thead>
                    <tbody>
                        {data.map((item, index) => {
                            if (tab === 'PRESENT') {
                                // item is AttendanceResponse
                                return (
                                    <tr key={item.id || index}>
                                        <td>{new Date(item.timestamp).toLocaleString()}</td>
                                        <td>{item.user ? item.user.firstName : 'Desconocido'}</td>
                                        <td>{item.user ? item.user.lastName : ''}</td>
                                        <td>{item.user ? item.user.role : ''}</td>
                                        <td>{item.user ? item.user.dni : ''}</td>
                                    </tr>
                                );
                            } else {
                                // item is AttendanceResponse
                                return (
                                    <tr key={item.id || index}>
                                        <td>{new Date(item.timestamp).toLocaleString()}</td>
                                        <td>{item.user ? `${item.user.firstName} ${item.user.lastName}` : 'Usuario Desconocido'}</td>
                                        <td style={{
                                            color: item.type === 'ENTRY' ? 'green' :
                                                item.type === 'LATE' ? '#ff9800' : 'red',
                                            fontWeight: 'bold'
                                        }}>
                                            {item.type === 'ENTRY' ? 'INGRESO' :
                                                item.type === 'LATE' ? 'INGRESO (TARDE)' : 'EGRESO'}
                                        </td>
                                    </tr>
                                );
                            }
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
};

const styles = {
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
    },
    tabs: {
        display: 'flex',
    },
    tab: {
        padding: '10px 20px',
        marginRight: '10px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        color: 'white',
        fontSize: '1rem',
    },
    exportButton: {
        padding: '10px 20px',
        backgroundColor: '#2196F3',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    th: {
        textAlign: 'left',
        padding: '12px',
        backgroundColor: '#f2f2f2',
        borderBottom: '1px solid #ddd',
    },
    td: {
        padding: '12px',
        borderBottom: '1px solid #ddd',
    },
};

export default Reports;
