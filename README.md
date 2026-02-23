# Sistema de Asistencia Escolar

Este proyecto es una aplicación de asistencia escolar con backend en Spring Boot y frontend en React.

## Requisitos
- Java 21
- Node.js 18+
- Maven

## Estructura
- `backend/`: Código fuente del servidor (Spring Boot).
- `frontend/`: Código fuente de la interfaz (React + Vite).

## Ejecución

### Backend
1. Navegar a la carpeta `backend`.
2. Ejecutar `mvn spring-boot:run`.
   - El servidor iniciará en `http://localhost:8080`.
   - La base de datos H2 se guardará en `attendance_db`.

### Frontend
1. Navegar a la carpeta `frontend`.
2. Ejecutar `npm install` (si no se ha hecho).
3. Ejecutar `npm run dev`.
   - La aplicación estará disponible en `http://localhost:5173`.

## Uso

### Kiosco (Tablets)
- Acceder a la raíz `/` para ver los botones de INGRESO/EGRESO.
- Escanear el código QR del usuario.

### Administración (PC)
- Acceder a `/admin` para gestionar usuarios y ver reportes.
- `/admin/users`: Agregar usuarios e imprimir sus códigos QR.
- `/admin/reports`: Ver quién está presente y el historial completo.
