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
                ? 'http://localhost:8080/api/attendance/present'
                : 'http://localhost:8080/api/attendance/history';

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
                Nombre: item.firstName,
                Apellido: item.lastName,
                Rol: item.role,
                DNI: item.dni
            }));
        } else {
            csvData = data.map(item => ({
                "Fecha/Hora": new Date(item.timestamp).toLocaleString(),
                Nombre: `${item.user.firstName} ${item.user.lastName}`,
                "Acción": item.type === 'ENTRY' ? 'INGRESO' : 'EGRESO'
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
                                // item is UserDTO
                                return (
                                    <tr key={item.id || index}>
                                        <td>{item.firstName}</td>
                                        <td>{item.lastName}</td>
                                        <td>{item.role}</td>
                                        <td>{item.dni}</td>
                                    </tr>
                                );
                            } else {
                                // item is AttendanceResponse
                                return (
                                    <tr key={item.id || index}>
                                        <td>{new Date(item.timestamp).toLocaleString()}</td>
                                        <td>{item.user.firstName} {item.user.lastName}</td>
                                        <td style={{ color: item.type === 'ENTRY' ? 'green' : 'red' }}>
                                            {item.type === 'ENTRY' ? 'INGRESO' : 'EGRESO'}
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
