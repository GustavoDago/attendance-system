import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const UserForm = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dni: '',
        role: 'STUDENT'
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('http://localhost:8080/api/users', formData);
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
                <div style={styles.group}>
                    <label style={styles.label}>Nombre:</label>
                    <input style={styles.input} name="firstName" value={formData.firstName} onChange={handleChange} required />
                </div>
                <div style={styles.group}>
                    <label style={styles.label}>Apellido:</label>
                    <input style={styles.input} name="lastName" value={formData.lastName} onChange={handleChange} required />
                </div>
                <div style={styles.group}>
                    <label style={styles.label}>DNI:</label>
                    <input style={styles.input} name="dni" value={formData.dni} onChange={handleChange} required />
                </div>
                <div style={styles.group}>
                    <label style={styles.label}>Rol:</label>
                    <select style={styles.input} name="role" value={formData.role} onChange={handleChange}>
                        <option value="STUDENT">Estudiante</option>
                        <option value="TEACHER">Profesor</option>
                        <option value="STAFF">Staff</option>
                        <option value="PRINCIPAL">Directivo</option>
                    </select>
                </div>
                <button type="submit" disabled={loading} style={styles.button}>
                    {loading ? 'Guardando...' : 'Guardar'}
                </button>
            </form>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '500px',
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
    group: {
        marginBottom: '15px',
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
    },
    button: {
        padding: '10px',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '1rem',
    },
};

export default UserForm;
