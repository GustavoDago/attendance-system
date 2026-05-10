import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/api/auth/login', {
                username,
                password
            });
            login(response.data.token, response.data.user);
            toast.success('¡Bienvenido!');
            navigate('/admin');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al iniciar sesión');
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.branding}>
                    <div style={styles.logoContainer}>
                        <img src="/logo.png" alt="EEST Nº 3 Ramallo" style={styles.logo} />
                    </div>
                    <h2 style={styles.schoolName}>Escuela de Educación Secundaria Técnica Nº 3</h2>
                    <h3 style={styles.schoolCity}>Ramallo</h3>
                </div>
                
                <div style={styles.formSection}>
                    <h2 style={styles.formTitle}>Acceso Administrativo</h2>
                    <p style={styles.formSubtitle}>Ingresa tus credenciales para continuar</p>
                    
                    <form onSubmit={handleSubmit} style={styles.form}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Usuario</label>
                            <input
                                style={styles.input}
                                type="text"
                                placeholder="Tu nombre de usuario"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Contraseña</label>
                            <input
                                style={styles.input}
                                type="password"
                                placeholder="Tu contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        
                        <button style={styles.button} type="submit">Iniciar Sesión</button>
                        <button style={styles.backButton} type="button" onClick={() => navigate('/kiosk')}>
                            Volver al Kiosco
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f4f6f9',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    },
    card: {
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        width: '100%',
        maxWidth: '900px',
        minHeight: '500px',
    },
    branding: {
        flex: 1,
        backgroundColor: '#f8f9ff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px',
        textAlign: 'center',
        borderRight: '1px solid #f1f1f4',
    },
    logoContainer: {
        width: '180px',
        height: '180px',
        marginBottom: '25px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain',
    },
    schoolName: {
        color: '#1e1e2d',
        fontSize: '1.4rem',
        fontWeight: '700',
        margin: '0 0 5px 0',
        lineHeight: '1.3',
    },
    schoolCity: {
        color: '#5d5fef',
        fontSize: '1.1rem',
        fontWeight: '600',
        margin: 0,
        textTransform: 'uppercase',
        letterSpacing: '1px',
    },
    formSection: {
        flex: 1,
        padding: '50px 60px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
    },
    formTitle: {
        color: '#1e1e2d',
        fontSize: '1.8rem',
        fontWeight: '700',
        margin: '0 0 8px 0',
    },
    formSubtitle: {
        color: '#a2a3b7',
        fontSize: '0.95rem',
        margin: '0 0 30px 0',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        marginBottom: '20px',
    },
    label: {
        fontSize: '0.85rem',
        fontWeight: '600',
        color: '#3f4254',
        marginBottom: '8px',
    },
    input: {
        padding: '14px 16px',
        backgroundColor: '#f9fafb',
        border: '1px solid #e4e6ef',
        borderRadius: '8px',
        fontSize: '1rem',
        color: '#3f4254',
        transition: 'border-color 0.2s',
        outline: 'none',
    },
    button: {
        padding: '14px',
        backgroundColor: '#5d5fef',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        marginTop: '10px',
        marginBottom: '15px',
        boxShadow: '0 4px 12px rgba(93, 95, 239, 0.2)',
        transition: 'transform 0.2s, background-color 0.2s',
    },
    backButton: {
        padding: '12px',
        backgroundColor: 'transparent',
        color: '#a2a3b7',
        border: '1px solid #e4e6ef',
        borderRadius: '8px',
        fontSize: '0.95rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
    }
};

export default Login;
