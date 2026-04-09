#!/bin/bash
# =============================================================================
# wsl-setup-and-build.sh
# Compilación nativa de Spring Boot en WSL/Linux.
# Instala GraalVM CE 21 + Maven vía SDKMAN (solo en el primer run).
# Uso: bash ~/wsl-setup-and-build.sh
# =============================================================================
set -e

BUILD_DIR="$HOME/attendance-build"
BINARY_NAME="attendance-backend"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║     Spring Native — Compilación en WSL       ║"
echo "║  CPU: $(grep 'model name' /proc/cpuinfo | head -1 | cut -d: -f2 | xargs | cut -c1-36)"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ─── Paso 1: Dependencias del sistema ────────────────────────────────────────
echo "[1/6] Verificando dependencias del sistema..."
DEPS_NEEDED=()
for pkg in curl zip unzip build-essential zlib1g-dev; do
    dpkg -s "$pkg" &>/dev/null || DEPS_NEEDED+=("$pkg")
done

if [ ${#DEPS_NEEDED[@]} -gt 0 ]; then
    echo "      Instalando: ${DEPS_NEEDED[*]}"
    sudo apt-get update -qq
    sudo apt-get install -y "${DEPS_NEEDED[@]}" -qq
else
    echo "      Todas las dependencias ya están instaladas. ✓"
fi

# ─── Paso 2: SDKMAN ───────────────────────────────────────────────────────────
echo ""
echo "[2/6] Verificando SDKMAN..."
if [ ! -d "$HOME/.sdkman" ]; then
    echo "      Instalando SDKMAN..."
    curl -s "https://get.sdkman.io" | bash
    echo "      SDKMAN instalado. ✓"
else
    echo "      SDKMAN ya está instalado. ✓"
fi

# Cargar SDKMAN en esta sesión de bash
export SDKMAN_DIR="$HOME/.sdkman"
source "$HOME/.sdkman/bin/sdkman-init.sh"

# ─── Paso 3: GraalVM CE 21 ───────────────────────────────────────────────────
echo ""
echo "[3/6] Verificando GraalVM CE 21..."
GRAAL_VERSION="21.0.2-graalce"
if sdk list java | grep -q "${GRAAL_VERSION}.*installed"; then
    echo "      GraalVM CE 21 ya está instalado. ✓"
    sdk use java "$GRAAL_VERSION" > /dev/null
else
    echo "      Instalando GraalVM CE 21 (puede tardar unos minutos)..."
    sdk install java "$GRAAL_VERSION" < /dev/null
    sdk default java "$GRAAL_VERSION"
    echo "      GraalVM instalado. ✓"
    
    # Forzar actualización del entorno
    source "$HOME/.sdkman/bin/sdkman-init.sh"
fi

# ─── Paso 4: Maven ───────────────────────────────────────────────────────────
echo ""
echo "[4/6] Verificando Maven..."
MVN_VERSION="3.9.6"
if sdk list maven | grep -q "${MVN_VERSION}.*installed"; then
    echo "      Maven $MVN_VERSION ya está instalado. ✓"
    sdk use maven "$MVN_VERSION" > /dev/null
else
    echo "      Instalando Maven $MVN_VERSION..."
    sdk install maven "$MVN_VERSION" < /dev/null
    sdk default maven "$MVN_VERSION"
    echo "      Maven instalado. ✓"
    
    # Forzar actualización del entorno
    source "$HOME/.sdkman/bin/sdkman-init.sh"
fi

# Mostrar entorno
echo ""
echo "─── Entorno de compilación ─────────────────────"
java -version 2>&1 | head -1
mvn --version | head -1
echo "────────────────────────────────────────────────"
echo ""

# ─── Paso 5: Node.js 20 & Frontend ───────────────────────────────────────────
echo "[5/6] Instalando Node.js 20 y compilando frontend..."
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1)" != "v20" ]; then
    echo "      Instalando Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null 2>&1
    sudo apt-get install -y nodejs > /dev/null 2>&1
    echo "      Node.js $(node -v) instalado. ✓"
else
    echo "      Node.js $(node -v) ya está instalado. ✓"
fi

echo "      Compilando código frontend en ~/frontend-build..."
cd "$HOME/frontend-build"
npm install --silent
npm run build --silent
if [ $? -ne 0 ]; then
    echo "      Fallo al compilar el frontend."
    exit 1
fi
echo "      Frontend compilado. ✓"

# Limpiar carpeta estática previa para evitar archivos obsoletos
rm -rf "$BUILD_DIR/src/main/resources/static/"
mkdir -p "$BUILD_DIR/src/main/resources/static"

# Copiar estáticos al lugar correcto para Spring Boot
cp -r dist/* "$BUILD_DIR/src/main/resources/static/"
echo "      Recursos estáticos movidos a src/main/resources/static. ✓"
echo ""

# ─── Paso 6: Compilación nativa ──────────────────────────────────────────────
echo "[6/6] Compilando imagen nativa..."
echo "      (Esto puede tardar entre 10 y 30 minutos)"
echo ""

cd "$BUILD_DIR"

# Limpiar compilaciones anteriores para evitar conflictos
mvn clean -q

# Compilación con perfil native; el pom.xml ya contiene -march=compatibility y -Xmx3g
mvn -Pnative native:compile -DskipTests \
    2>&1 | tee "$HOME/attendance-build.log"

# ─── Resultado ───────────────────────────────────────────────────────────────
BINARY_PATH="$BUILD_DIR/target/$BINARY_NAME"

if [ -f "$BINARY_PATH" ]; then
    cp "$BINARY_PATH" "$HOME/$BINARY_NAME"
    chmod +x "$HOME/$BINARY_NAME"
    SIZE=$(du -sh "$HOME/$BINARY_NAME" | cut -f1)

    echo ""
    echo "╔══════════════════════════════════════════════╗"
    echo "║           ¡Compilación exitosa!              ║"
    echo "╠══════════════════════════════════════════════╣"
    echo "║  Binario: ~/$BINARY_NAME"
    echo "║  Tamaño:  $SIZE"
    echo "╚══════════════════════════════════════════════╝"
    echo ""
    echo "  Para ejecutar: ./$BINARY_NAME"
    echo "  Para ver logs: tail -f ~/attendance-build.log"
else
    echo ""
    echo "  ERROR: No se encontró el binario compilado."
    echo "  Revisa el log: cat ~/attendance-build.log"
    exit 1
fi
