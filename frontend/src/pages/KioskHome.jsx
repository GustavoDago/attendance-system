import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const KioskHome = () => {
  const navigate = useNavigate();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const currentStyles = isDesktop ? desktopStyles : mobileStyles;

  return (
    <div className="kiosk-mode" style={currentStyles.container}>
      {/* Fullscreen Toggle Button - Subtle */}
      <button
        onClick={toggleFullscreen}
        style={currentStyles.fullscreenBtn}
        aria-label="Toggle Fullscreen"
      >
        ⤢
      </button>

      {/* Left Panel - Institutional Info (Desktop Only) */}
      {isDesktop && (
        <div style={desktopStyles.leftPanel}>
          <div style={desktopStyles.infoBox}>
            <h1 style={desktopStyles.schoolName}>COLEGIO INSTITUTO CENTRAL</h1>
            <p style={desktopStyles.schoolSubtitle}>Sistema de Asistencia</p>
            <div style={desktopStyles.divider}></div>
            <p style={desktopStyles.instructions}>
              Aguarde su turno frente a la terminal y seleccione si desea registrar su <strong>ingreso</strong> o <strong>egreso</strong> a la institución.
            </p>
            <p style={desktopStyles.instructionsSub}>
              Deberá presentar el código QR de su credencial al lector óptico.
            </p>
          </div>
        </div>
      )}

      {/* Right/Main Panel - Interaction */}
      <div style={currentStyles.interactionPanel}>
        {!isDesktop && (
          <div style={mobileStyles.header}>
            <h1 style={mobileStyles.headerTitle}>INSTITUTO CENTRAL</h1>
            <p style={mobileStyles.headerSubtitle}>Control de Asistencia</p>
          </div>
        )}

        <div style={mobileStyles.interactionPanel}>
          {!isDesktop && <h2 style={mobileStyles.title}>¿Qué acción desea realizar?</h2>}
          <div style={currentStyles.buttonContainer}>
            <button
              style={{ ...currentStyles.actionButton, backgroundColor: '#4CAF50' }}
              onClick={() => navigate('/scan/ENTRY')}
            >
              INGRESAR
            </button>

            <button
              style={{ ...currentStyles.actionButton, backgroundColor: '#f44336' }}
              onClick={() => navigate('/scan/EXIT')}
            >
              EGRESAR
            </button>
          </div>
        </div>

        {!isDesktop && (
          <footer style={mobileStyles.footer}>
            Sistema de Gestión Escolar v1.0
          </footer>
        )}
      </div>
    </div>
  );
};

// --- Desktop Styles (Split View) ---
const desktopStyles = {
  container: {
    display: 'flex',
    flexDirection: 'row',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
  },
  leftPanel: {
    flex: '1',
    backgroundColor: '#1a237e', // Primary school color
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '4rem',
    boxShadow: 'inset -10px 0 20px rgba(0,0,0,0.1)',
  },
  infoBox: {
    maxWidth: '500px',
    textAlign: 'center',
  },
  schoolName: {
    fontSize: '3rem',
    margin: '0 0 10px 0',
    lineHeight: '1.2',
  },
  schoolSubtitle: {
    fontSize: '1.5rem',
    opacity: 0.8,
    margin: '0 0 30px 0',
  },
  divider: {
    height: '4px',
    width: '60px',
    backgroundColor: '#f50057',
    margin: '0 auto 30px auto',
  },
  instructions: {
    fontSize: '2rem',
    lineHeight: '1.4',
    marginBottom: '20px',
  },
  instructionsSub: {
    fontSize: '1.2rem',
    opacity: 0.7,
  },
  interactionPanel: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3rem',
    width: '100%',
    maxWidth: '400px',
  },
  actionButton: {
    padding: '3rem 2rem',
    fontSize: '3rem',
    fontWeight: 'bold',
    color: 'white',
    border: 'none',
    borderRadius: '16px',
    cursor: 'pointer',
    width: '100%',
    boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
    transition: 'transform 0.1s',
  },
  fullscreenBtn: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'none',
    border: 'none',
    color: '#999',
    fontSize: '24px',
    cursor: 'pointer',
    opacity: 0.5,
    zIndex: 10,
  }
};

// --- Mobile/Tablet Styles (Improved Centered & Scaled) ---
const mobileStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#1a237e', // Base color to avoid white borders
    overflow: 'hidden',
  },
  interactionPanel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
    backgroundColor: '#ffffff',
    padding: '2rem',
    boxSizing: 'border-box',
  },
  header: {
    width: '100%',
    backgroundColor: '#1a237e',
    color: 'white',
    padding: '3rem 1rem',
    textAlign: 'center',
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
    zIndex: 5,
  },
  headerTitle: {
    margin: 0,
    fontSize: 'clamp(2rem, 8vw, 4rem)', // Scalable font
    fontWeight: 'bold',
    letterSpacing: '2px',
  },
  headerSubtitle: {
    margin: '10px 0 0 0',
    fontSize: 'clamp(1rem, 3vw, 1.8rem)',
    opacity: 0.9,
    textTransform: 'uppercase',
  },
  title: {
    marginBottom: '3rem',
    fontSize: 'clamp(1.5rem, 5vw, 3rem)',
    color: '#1a237e',
    textAlign: 'center',
    fontWeight: '600',
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'row', // Horizontal on tablets if possible, vertical handled by CSS or flex-wrap
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '3rem',
    width: '100%',
    maxWidth: '1000px', // Allow it to be much wider on tablets
  },
  actionButton: {
    padding: '4rem 2rem',
    fontSize: 'clamp(1.8rem, 4vw, 3.5rem)',
    fontWeight: 'bold',
    color: 'white',
    border: 'none',
    borderRadius: '24px',
    cursor: 'pointer',
    flex: '1 1 400px', // This makes it grow on tablets to fill space
    maxWidth: '500px',
    boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textTransform: 'uppercase',
  },
  footer: {
    width: '100%',
    padding: '2rem',
    textAlign: 'center',
    color: 'white',
    backgroundColor: '#1a237e',
    fontSize: '1.2rem',
    fontWeight: '500',
  },
  fullscreenBtn: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.3)',
    color: 'white',
    borderRadius: '12px',
    width: '50px',
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    cursor: 'pointer',
    zIndex: 10,
    backdropFilter: 'blur(5px)',
  }
};

export default KioskHome;
