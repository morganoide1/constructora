# Constructora ERP

Sistema de gestión integral para constructoras. Incluye:

- **Cajas**: Caja principal en USD y 2 cajas chicas en ARS con transferencias entre ellas
- **Ventas**: Gestión de propiedades, clientes y planes de pago en cuotas
- **Certificados**: Certificados de obra para pagos al obrador
- **Portal Cliente**: Cada cliente puede ver su propiedad, montos pagados y pendientes

## 🚀 Deploy en Railway

### Paso 1: Crear cuenta y proyecto en Railway

1. Ir a [railway.app](https://railway.app) y crear cuenta con GitHub
2. Click en "New Project" → "Deploy from GitHub repo"
3. Seleccionar este repositorio

### Paso 2: Agregar MongoDB

1. En el proyecto de Railway, click en "New" → "Database" → "MongoDB"
2. Railway creará automáticamente la variable `MONGODB_URI`

### Paso 3: Configurar Variables de Entorno

En Railway, ir a tu servicio → Variables, y agregar:

```
JWT_SECRET=tu-clave-secreta-muy-larga-y-segura
NODE_ENV=production
PORT=3001
```

### Paso 4: Deploy

Railway detectará automáticamente los scripts y hará el deploy.

El build ejecutará:
1. `npm run build` - Compila el frontend React
2. `npm run start` - Inicia el servidor Express

## 💻 Desarrollo Local

### Requisitos
- Node.js 18+
- MongoDB local o Atlas

### Instalación

```bash
# Clonar repo
git clone https://github.com/TU_USUARIO/constructora-erp.git
cd constructora-erp

# Instalar dependencias del servidor
cd server
npm install
cp .env.example .env
# Editar .env con tu MONGODB_URI

# Instalar dependencias del cliente
cd ../client
npm install

# Correr en desarrollo (2 terminales)
# Terminal 1 - Backend:
cd server && npm run dev

# Terminal 2 - Frontend:
cd client && npm run dev
```

El frontend estará en `http://localhost:5173`
El backend estará en `http://localhost:3001`

## 📱 Uso

### Primera vez

1. Ir a `/setup` para crear el usuario administrador
2. Ir a "Cajas" y hacer click en "Configurar Cajas" para crear las 3 cajas iniciales
3. Crear clientes en la sección "Clientes"
4. Agregar propiedades y registrar ventas

### Roles

- **Admin**: Acceso completo al sistema (tú y tu papá)
- **Cliente**: Solo puede ver su portal con sus propiedades y pagos

### Funcionalidades principales

- Registrar ingresos/egresos en cualquier caja
- Transferir fondos entre cajas (con tipo de cambio si USD↔ARS)
- Crear propiedades con precio y valor futuro
- Registrar ventas con plan de cuotas
- Registrar pagos de cuotas
- Crear y aprobar certificados de obra
- Pagar certificados desde las cajas

## 🔧 Tecnologías

- **Frontend**: React 18, Vite, TailwindCSS, Lucide Icons
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Auth**: JWT

## 📝 Licencia

MIT
