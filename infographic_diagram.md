# 📊 Infografía Arquitectónica: Sistema de Asistencia (Fase 1)

Aquí tienes una representación visual de la arquitectura y el pipeline de despliegue, ideal para acompañar tu publicación (puedes tomar captura de pantalla del diagrama o usarlo como guía para diseñar una gráfica final).

## Arquitectura y Despliegue

```mermaid
flowchart TD
    subgraph "Entorno Local (Windows 🖥️)"
        VSCode[VS Code<br/>Desarrollo]
        subgraph "Pipeline de Compilación Nivel-SO"
            Powershell[PowerShell<br/>wsl-deploy.ps1]
            WSL[WSL - Debian 🐧<br/>wsl-setup-and-build.sh]
        end
        VSCode -->|Envía Código| Powershell
        Powershell -->|Orquesta| WSL
        WSL -->|GraalVM + Maven| Binario[Binario Nativo Linux<br/>attendance-backend]
        Binario -.->|Extraído a Windows| Ext[Carpeta Target]
    end

    subgraph "Comunicaciones y Red 🌐"
        Tailscale((Tailscale VPN<br/>Red Mesh Segura))
        Ngrok((ngrok<br/>Túnel Público))
    end

    subgraph "Entorno Producción (La Escuela 🏫)"
        Server[Servidor Físico<br/>Intel Core 2 Duo<br/>RAM Limitada]
        SpringApp((Spring Native<br/>Boot ultrarrápido<br/>Bajo consumo))
        DB[(H2 Database<br/>Embebida)]
    end

    subgraph "Interfaces de Usuario 📱💻"
        Tablet[Tablets Kiosco<br/>Escaneo QR]
        Admin[PC Administración<br/>Dashboard React]
    end

    %% Conexiones
    Ext -->|Transferencia vía SSH| Tailscale
    Tailscale -->|Despliegue Seguro| Server
    Server --> SpringApp
    SpringApp <--> DB

    Tablet -->|Peticiones API| Ngrok
    Ngrok --> |Redirige| SpringApp
    Admin -->|Acceso Módulos| SpringApp

    style Server fill:#5c2d2d,stroke:#ff6b6b,stroke-width:2px,color:#fff
    style SpringApp fill:#2d5c32,stroke:#6bff6b,stroke-width:2px,color:#fff
    style WSL fill:#2d4c5c,stroke:#6bcfff,stroke-width:2px,color:#fff
    style Tailscale fill:#7b2d5c,stroke:#ff6bff,stroke-width:2px,color:#fff
```

### 🔑 Puntos Clave de la Arquitectura:

1. **💻 Desarrollo fluido:** Escribes tu código en Windows, pero compilas a nivel de sistema operativo Linux gracias a la potente integración con **WSL**.
2. **⚡ Optimización Extrema:** **GraalVM** toma la aplicación en Java y la convierte en un binario ejecutable que corre nativamente en un servidor muy antiguo (Core 2 Duo), optimizando memoria y CPU al máximo frente a una JVM tradicional.
3. **🔒 Seguridad y Testing:** **Tailscale** actúa como un puente directo invisible para manejar el servidor remotamente sin abrir puertos, mientras que **ngrok** permite hacer exposiciones temporales controladas para probar los escáneres QR de las tablets.
4. **🌱 Escalabilidad:** A pesar de los recursos limitados en servidor, la estructura bajo el capó (JPA, React, Spring Security) ya prepara el terreno para la gestión modular completa del ciclo escolar.
