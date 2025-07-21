# Tools Web Application

Una aplicación web que provee herramientas y utilidades desarrollada con React y Vite.

## Descripción General
Una colección de herramientas y aplicaciones utilitarias para la gestión y automatización de sistemas.

## Estructura del Proyecto
```
src/
  ├── api/         # Servicios de backend y conexión a BD
  ├── components/  # Componentes React reutilizables
  └── pages/       # Páginas principales de la aplicación
```

## Características
- **Inicio**
  - Dashboard principal de la aplicación
  - Vista general del sistema

- **Proyectos**
  - Vista General
    - Lista de proyectos con filtros y búsqueda
    - Dashboard de proyectos activos
    - Indicadores de estado y progreso
  
  - Gestión de Proyectos
    - ProjectList: Tabla interactiva de proyectos
    - ProjectCard: Vista detallada de proyecto individual
    - ProjectForm: Creación y edición de proyectos
    - ProjectStatus: Indicador visual de estado
  
  - Recursos del Proyecto
    - ResourceManager: Gestión de archivos y recursos
    - ResourceUploader: Carga de archivos al proyecto
    - ResourceViewer: Visualización de recursos
  
  - Seguimiento
    - ProjectTimeline: Línea temporal de actividades
    - ActivityLog: Registro de cambios y actualizaciones
    - ProjectMetrics: Métricas y estadísticas

  - Generación de CD
    - CDGenerator: Generación automática de pipelines
    - CDTemplates: Plantillas predefinidas de CD
    - CDConfigurator: Personalización de configuraciones
    - CDValidator: Validación de sintaxis y estructura

  - Gestión de Notas
    - NoteList: Lista de notas del proyecto
    - NoteEditor: Editor rico de notas
    - NoteAttachments: Gestión de archivos adjuntos
    - NoteTags: Sistema de etiquetado de notas

  - Componentes Auxiliares
    - FilterBar: Filtrado avanzado de proyectos
    - SearchBox: Búsqueda en tiempo real
    - SortControls: Ordenamiento de resultados
    - Pagination: Navegación entre páginas

- **JMeter Test Generator**
  - Generación de pruebas de rendimiento
  - Configuración de tests JMeter

- **Visor PHPStan**
  - Visualización de análisis estático
  - Revisión de código PHP

## Menú de Navegación
- Inicio (Dashboard principal)
- Proyectos
- JMeter Test Generator
- Visor PHPStan

## Requisitos
- Node.js 22 o superior
- SQLite3
- Navegador web moderno

## Instalación
1. Clonar el repositorio
```bash
git clone [url-del-repositorio]
cd tools
```

2. Configurar el entorno
```bash
cp .env.example .env
```

3. Instalar dependencias
```bash
npm install
```

4. Inicializar base de datos SQLite
```bash
npm run init-db
```

## Configuración
1. Actualizar el archivo `.env` con la configuración necesaria:
```bash
# Base de datos
DB_PATH=./database.sqlite

# Configuración de rutas
VITE_BASE_PATH=/tools            # Ruta base para desarrollo
VITE_BASE_PATH=/tools           # Ruta base para producción

VITE_API_URL=https://localhost/${VITE_BASE_PATH}/api      # URL base API
```

2. Verificar los permisos de escritura para el archivo de base de datos
3. Configurar el puerto y host en el archivo de configuración

## Uso
### Modo Desarrollo
Iniciar el servidor de desarrollo:
```bash
npm run dev
```

Acceder a las herramientas a través del navegador web:
```
http://localhost:5173${VITE_BASE_PATH}
```

### Modo Producción
Generar build de producción:
```bash
npm run build
```

Acceder a las herramientas a través del navegador web:
```
https://localhost/${VITE_BASE_PATH}
```

## Desarrollo
### Estructura de APIs
El directorio `src/api` contiene los servicios para:
- Conexión con la base de datos
- Gestión de endpoints del backend
- Manejo de peticiones HTTP

### Endpoints Disponibles

#### Gestión de Proyectos
##### Operaciones Básicas
```
GET    /api/projects              # Obtener lista de proyectos
POST   /api/projects              # Crear nuevo proyecto
GET    /api/projects/:id          # Obtener detalles de un proyecto
PUT    /api/projects/:id          # Actualizar proyecto
DELETE /api/projects/:id          # Eliminar proyecto
```

##### Configuración de Proyectos
```
GET    /api/projects/:id/config           # Obtener configuración
PUT    /api/projects/:id/config           # Actualizar configuración
GET    /api/projects/:id/settings         # Obtener ajustes
PATCH  /api/projects/:id/settings         # Modificar ajustes
```

##### Recursos de Proyecto
```
GET    /api/projects/:id/resources        # Listar recursos
POST   /api/projects/:id/resources        # Agregar recurso
DELETE /api/projects/:id/resources/:resId # Eliminar recurso
PUT    /api/projects/:id/resources/:resId # Actualizar recurso
```

##### Métricas y Reportes
```
GET    /api/projects/:id/metrics          # Obtener métricas
GET    /api/projects/:id/reports          # Listar reportes
POST   /api/projects/:id/reports/generate # Generar nuevo reporte
GET    /api/projects/:id/statistics       # Obtener estadísticas
```

##### Estados y Seguimiento
```
GET    /api/projects/:id/status           # Estado actual
PATCH  /api/projects/:id/status           # Actualizar estado
GET    /api/projects/:id/history          # Historial de cambios
GET    /api/projects/:id/activities       # Registro de actividades
```

##### Generación de CD
```
GET    /api/projects/:id/cd                # Obtener configuración CD
POST   /api/projects/:id/cd/generate       # Generar pipeline CD
GET    /api/projects/:id/cd/templates      # Listar plantillas disponibles
POST   /api/projects/:id/cd/validate       # Validar configuración CD
PUT    /api/projects/:id/cd/config         # Actualizar configuración CD
GET    /api/projects/:id/cd/status         # Estado del pipeline CD
```

##### Gestión de Notas
```
GET    /api/projects/:id/notes              # Listar notas del proyecto
POST   /api/projects/:id/notes              # Crear nueva nota
GET    /api/projects/:id/notes/:noteId      # Obtener nota específica
PUT    /api/projects/:id/notes/:noteId      # Actualizar nota
DELETE /api/projects/:id/notes/:noteId      # Eliminar nota
POST   /api/projects/:id/notes/:noteId/tags # Agregar etiquetas
GET    /api/projects/:id/notes/search       # Buscar notas
```

#### JMeter Tests
```
GET    /api/jmeter/tests          # Listar pruebas JMeter
POST   /api/jmeter/tests          # Crear nueva prueba
GET    /api/jmeter/tests/:id      # Obtener configuración de prueba
POST   /api/jmeter/tests/run/:id  # Ejecutar prueba
GET    /api/jmeter/tests/results  # Obtener resultados
```

#### PHPStan
```
POST   /api/phpstan/analyze      # Ejecutar análisis
GET    /api/phpstan/results      # Obtener resultados de análisis
GET    /api/phpstan/history      # Historial de análisis
```

### Códigos de Estado
- 200: Solicitud exitosa
- 201: Recurso creado exitosamente
- 400: Error en la solicitud
- 401: No autorizado
- 404: Recurso no encontrado
- 500: Error interno del servidor

### Autenticación
Todos los endpoints requieren un token JWT en el header:
```
Authorization: Bearer <token>
```

### Componentes Principales
- Sidebar: Navegación principal de la aplicación
- Layouts: Estructuras de página reutilizables
- Componentes específicos para cada herramienta

## Seguridad
- Asegurar que los controles de acceso estén implementados
- Mantener la aplicación protegida con autenticación
- Actualizar las dependencias regularmente

## Contribuciones
1. Hacer un fork del repositorio
2. Crear una rama para la nueva funcionalidad
3. Enviar un pull request

## Licencia
Este proyecto está licenciado bajo la Licencia MIT - ver el archivo LICENSE para más detalles.

## Soporte
Para soporte y preguntas, por favor abrir un issue en el repositorio.
