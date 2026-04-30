import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import QRCode from 'react-qr-code';

const QRCodePage = () => {
    const { id } = useParams();
    const [user, setUser] = useState(null);

    useEffect(() => {
        axios.get(`/api/students/${id}`)
            .then(res => setUser(res.data))
            .catch(err => console.error(err));
    }, [id]);

    if (!user) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Cargando credencial...</div>;

    return (
        <div style={styles.page}>
            <div className="badge-container" style={styles.badge}>
                {/* Header */}
                <div style={styles.header}>
                    <h2 style={styles.schoolName}>COLEGIO INSTITUTO CENTRAL</h2>
                    <p style={styles.schoolSub}>Sistema de Control de Accesos</p>
                </div>

                {/* Body */}
                <div style={styles.body}>
                    <div style={styles.photoPlaceholder}>
                        <span style={styles.photoText}>FOTO</span>
                    </div>

                    <div style={styles.info}>
                        <h1 style={styles.name}>{user.firstName} {user.lastName}</h1>
                        <p style={styles.dni}>DNI: {user.dni}</p>
                        <div style={{ ...styles.roleLabel, backgroundColor: '#2196F3' }}>
                            ESTUDIANTE
                        </div>
                    </div>
                </div>

                {/* Footer with QR */}
                <div style={styles.footer}>
                    <div style={styles.qrWrapper}>
                        <QRCode value={user.qrToken} size={140} level="H" />
                    </div>
                    <p style={styles.idText}>TOKEN: {user.qrToken.substring(0, 8)}...</p>
                </div>
            </div>

            <button className="no-print" style={styles.printButton} onClick={() => window.print()}>
                🖨️ Imprimir Gafete
            </button>
            <style>
                {`
                    @media print {
                        body { background: white; }
                        .no-print { display: none !important; }
                        .badge-container { box-shadow: none !important; border: 1px solid #ccc !important; margin: 0; padding: 0; page-break-inside: avoid; }
                    }
                `}
            </style>
        </div>
    );
};

const getRoleColor = (role) => {
    switch (role) {
        case 'STUDENT': return '#2196F3';
        case 'TEACHER': return '#4CAF50';
        case 'STAFF': return '#FF9800';
        case 'PRINCIPAL': return '#9C27B0';
        default: return '#607D8B';
    }
};

const translateRole = (role) => {
    switch (role) {
        case 'STUDENT': return 'ESTUDIANTE';
        case 'TEACHER': return 'PROFESOR';
        case 'STAFF': return 'PERSONAL STAFF';
        case 'PRINCIPAL': return 'DIRECTIVO';
        default: return role;
    }
};

const styles = {
    page: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#e9ecef',
        padding: '20px',
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    },
    badge: {
        width: '320px',
        minHeight: '520px',
        height: 'auto',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
    },
    header: {
        backgroundColor: '#1a237e',
        color: 'white',
        textAlign: 'center',
        padding: '20px 10px',
        borderBottom: '4px solid #f50057'
    },
    schoolName: {
        margin: 0,
        fontSize: '16px',
        fontWeight: 'bold',
        letterSpacing: '1px'
    },
    schoolSub: {
        margin: '5px 0 0 0',
        fontSize: '11px',
        opacity: 0.8
    },
    body: {
        padding: '25px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: '1 0 auto'
    },
    photoPlaceholder: {
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        backgroundColor: '#e0e0e0',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        border: '3px solid #1a237e',
        marginBottom: '15px'
    },
    photoText: {
        color: '#9e9e9e',
        fontWeight: 'bold',
        fontSize: '14px'
    },
    info: {
        textAlign: 'center',
        width: '100%'
    },
    name: {
        margin: '0 0 5px 0',
        fontSize: '22px',
        fontWeight: 'bold',
        color: '#333',
        lineHeight: 1.2
    },
    dni: {
        margin: '0 0 15px 0',
        fontSize: '14px',
        color: '#666'
    },
    roleLabel: {
        display: 'inline-block',
        padding: '6px 16px',
        color: 'white',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 'bold',
        letterSpacing: '1px'
    },
    footer: {
        backgroundColor: '#f8f9fa',
        padding: '20px 15px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderTop: '1px solid #eee'
    },
    qrWrapper: {
        backgroundColor: 'white',
        padding: '10px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    idText: {
        margin: '10px 0 0 0',
        fontSize: '10px',
        color: '#999',
        textTransform: 'uppercase'
    },
    printButton: {
        marginTop: '30px',
        padding: '12px 24px',
        backgroundColor: '#333',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '16px',
        cursor: 'pointer',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }
};

export default QRCodePage;
