import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const HolidayConfigPage = () => {
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    
    // Form state
    const [newDate, setNewDate] = useState('');
    const [newReason, setNewReason] = useState('');

    const fetchHolidays = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/holidays');
            return res.data;
        } catch (err) {
            console.error(err);
            toast.error('Error al cargar feriados');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        const loadData = async () => {
            const data = await fetchHolidays();
            if (isMounted && data) {
                setHolidays(data);
            }
        };
        loadData();
        return () => {
            isMounted = false;
        };
    }, [fetchHolidays]);

    const handleAddHoliday = async (e) => {
        e.preventDefault();
        if (!newDate || !newReason) {
            toast.warn('Complete fecha y motivo');
            return;
        }

        setAdding(true);
        try {
            await axios.post('/api/holidays', { date: newDate, reason: newReason });
            toast.success('Feriado agregado con éxito');
            setNewDate('');
            setNewReason('');
            const data = await fetchHolidays();
            if (data) setHolidays(data);
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.message || 'Error al agregar feriado';
            toast.error(errMsg);
        } finally {
            setAdding(false);
        }
    };

    const handleDeleteHoliday = async (holiday) => {
        if (!window.confirm(`¿Está seguro de que desea eliminar el feriado "${holiday.reason}"?`)) return;

        setDeletingId(holiday.id);
        try {
            await axios.delete(`/api/holidays/${holiday.id}`);
            setHolidays(prev => prev.filter(h => h.id !== holiday.id));
            toast.success('Feriado eliminado');
        } catch (err) {
            console.error(err);
            toast.error('Error al eliminar feriado');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div style={styles.container}>
            <h1>Configuración de Feriados y Días No Lectivos</h1>
            <p style={styles.subtitle}>
                Los días registrados aquí bloquearán la carga de asistencia manual y no serán computados como faltas.
            </p>

            <div style={styles.card}>
                <h2>Agregar Nuevo Feriado</h2>
                <form onSubmit={handleAddHoliday} style={styles.form}>
                    <div style={styles.field}>
                        <label htmlFor="newDate">Fecha:</label>
                        <input 
                            id="newDate"
                            type="date" 
                            value={newDate} 
                            onChange={(e) => setNewDate(e.target.value)} 
                            style={styles.input}
                            required
                        />
                    </div>
                    <div style={styles.field}>
                        <label htmlFor="newReason">Motivo:</label>
                        <input 
                            id="newReason"
                            type="text" 
                            value={newReason} 
                            onChange={(e) => setNewReason(e.target.value)} 
                            style={styles.input}
                            placeholder="Ej. Día del Estudiante"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        style={{
                            ...styles.button,
                            backgroundColor: adding ? '#a7f3d0' : '#10b981',
                            cursor: adding ? 'not-allowed' : 'pointer'
                        }}
                        disabled={adding}
                    >
                        {adding ? 'Registrando...' : 'Registrar'}
                    </button>
                </form>
            </div>

            <div style={styles.card}>
                <h2>Listado de Feriados</h2>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Fecha</th>
                            <th style={styles.th}>Motivo</th>
                            <th style={{ ...styles.th, textAlign: 'center' }}>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="3" style={styles.emptyText}>Cargando...</td>
                            </tr>
                        ) : holidays.length === 0 ? (
                            <tr>
                                <td colSpan="3" style={styles.emptyText}>No hay feriados registrados.</td>
                            </tr>
                        ) : (
                            [...holidays]
                                .sort((a, b) => new Date(a.date) - new Date(b.date))
                                .map(h => (
                                <tr key={h.id} style={styles.tr}>
                                    <td style={styles.td}>
                                        {new Date(h.date + 'T00:00:00').toLocaleDateString('es-AR')}
                                    </td>
                                    <td style={styles.td}>{h.reason}</td>
                                    <td style={{ ...styles.td, textAlign: 'center' }}>
                                        <button
                                            onClick={() => handleDeleteHoliday(h)}
                                            style={{
                                                ...styles.deleteBtn,
                                                opacity: deletingId === h.id ? 0.6 : 1,
                                                cursor: deletingId === h.id ? 'not-allowed' : 'pointer'
                                            }}
                                            disabled={deletingId === h.id}
                                            title={`Eliminar feriado ${h.reason}`}
                                            aria-label={`Eliminar feriado ${h.reason}`}
                                        >
                                            {deletingId === h.id ? '⏳' : 'Eliminar'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '20px', maxWidth: '800px', margin: '0 auto' },
    subtitle: { color: '#6b7280', marginBottom: '20px' },
    card: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        marginBottom: '20px',
    },
    form: { display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' },
    field: { display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, minWidth: '200px' },
    input: {
        padding: '10px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        fontSize: '1rem',
    },
    button: {
        padding: '10px 20px',
        backgroundColor: '#10b981',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '600',
        height: '42px'
    },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #f3f4f6', backgroundColor: '#f9fafb' },
    tr: { borderBottom: '1px solid #f3f4f6' },
    td: { padding: '12px' },
    deleteBtn: {
        padding: '6px 12px',
        backgroundColor: '#ef4444',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.85rem'
    },
    emptyText: { textAlign: 'center', padding: '20px', color: '#9ca3af', fontStyle: 'italic' }
};

export default HolidayConfigPage;
