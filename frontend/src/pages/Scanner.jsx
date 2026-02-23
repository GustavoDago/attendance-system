import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from "html5-qrcode";
import axios from 'axios';

const Scanner = () => {
    const { type } = useParams(); // ENTRY or EXIT
    const navigate = useNavigate();
    const [message, setMessage] = useState(null);
    const scannerRef = useRef(null);
    const timeoutRef = useRef(null);

    // Function to handle returning to home
    const returnHome = () => {
        navigate('/');
    };

    const resetInactivityTimeout = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        // 30 seconds inactivity timeout
        timeoutRef.current = setTimeout(returnHome, 30000);
    };

    useEffect(() => {
        // Start the inactivity timeout
        resetInactivityTimeout();

        // Clear previous scanner if exists (though cleanup should handle it)
        if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error);
            scannerRef.current = null;
        }

        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
        );
        scannerRef.current = scanner;

        const onScanSuccess = (decodedText) => {
            // Clear inactivity timeout so it doesn't trigger while showing success
            if (timeoutRef.current) clearTimeout(timeoutRef.current);

            scanner.clear().catch(err => console.error("Failed to clear scanner", err));
            handleScan(decodedText);
        };

        const onScanFailure = (error) => {
            // We do NOT reset timeout on scan failure, because failures happen constantly 
            // while it's looking for a code (every frame). Only reset on specific interactions if needed.
        };

        scanner.render(onScanSuccess, onScanFailure);

        // Cleanup
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => {
                    console.error("Failed to clear html5-qrcode scanner. ", error);
                });
                scannerRef.current = null;
            }
        };

        // Inner function to capture latest 'type'
        async function handleScan(userId) {
            try {
                const response = await axios.post('http://localhost:8080/api/attendance', {
                    userId: userId,
                    type: type
                });

                const user = response.data.user;
                const recordType = response.data.type;

                let successMsg = `¡Bienvenido, ${user.firstName} ${user.lastName}!`;
                let msgType = 'success';

                if (recordType === 'LATE') {
                    successMsg = `¡Ingreso registrado (TARDE), ${user.firstName}!`;
                    msgType = 'warning';
                } else if (recordType === 'EXIT') {
                    successMsg = `¡Hasta luego, ${user.firstName} ${user.lastName}!`;
                }

                setMessage({
                    type: msgType,
                    text: successMsg
                });
            } catch (error) {
                console.error(error);
                let errorMsg = 'Error al registrar asistencia. Intente nuevamente.';

                // Parse Spring Boot error response if available
                if (error.response && error.response.data) {
                    if (typeof error.response.data === 'string') errorMsg = error.response.data;
                    else if (error.response.data.message) errorMsg = error.response.data.message;
                }

                // If it's the 1-hour cooldown message from backend
                if (errorMsg.includes('1 hora') || errorMsg.includes('misma acción')) {
                    setMessage({
                        type: 'warning',
                        text: '⚠ Ya registró esta acción. Espere al menos 1 hora.'
                    });
                } else {
                    setMessage({
                        type: 'error',
                        text: errorMsg
                    });
                }
            }

            // Redirect after 3 seconds
            setTimeout(() => {
                navigate('/');
            }, 3000);
        }

    }, [type, navigate]);

    return (
        <div className="kiosk-mode" style={styles.container}>
            <h1 style={styles.title}>Escaneando para: {type === 'ENTRY' ? 'INGRESO' : 'EGRESO'}</h1>

            <div id="reader" style={{ width: '500px', display: message ? 'none' : 'block' }}></div>

            {message && (
                <div style={{
                    ...styles.message,
                    backgroundColor: message.type === 'success' ? '#4CAF50' :
                        message.type === 'warning' ? '#ff9800' : '#f44336'
                }}>
                    {message.text}
                </div>
            )}

            <button style={styles.button} onClick={returnHome}>
                Cancelar
            </button>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '20px',
    },
    title: {
        marginBottom: '20px',
        color: '#333',
        fontSize: '2rem',
    },
    message: {
        padding: '30px',
        color: 'white',
        borderRadius: '10px',
        marginTop: '20px',
        fontSize: '2rem',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    button: {
        marginTop: '30px',
        padding: '15px 30px',
        fontSize: '1.2rem',
        cursor: 'pointer',
        backgroundColor: '#999',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
    },
};

export default Scanner;
