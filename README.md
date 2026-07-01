# **Grove — Knowledge Graph Learning 🌳**

Grove es una plataforma web innovadora diseñada para el aprendizaje basado en grafos de conocimiento. Permite a los usuarios organizar información, visualizar relaciones entre conceptos mediante grafos interactivos y retener el conocimiento utilizando tarjetas de estudio (flashcards) con repetición espaciada.

Este repositorio contiene el **frontend** de la aplicación.

## **🚀 Características Principales**

* **Visualización de Grafos:** Representación interactiva de conceptos y sus prerrequisitos/relaciones utilizando **D3.js**.  
* **Gestión de Espacios de Trabajo (Workspaces):** Espacios públicos y privados para organizar tu ecosistema de aprendizaje.  
* **Conceptos y Rutas de Aprendizaje:** Creación de conceptos enriquecidos, asignación de prerrequisitos y generación de rutas de estudio ("Learning Paths").  
* **Tarjetas de Estudio (Flashcards):** Sistema de repaso espaciado integrado directamente con los conceptos.  
* **Etiquetas y Clústeres:** Categorización visual de los nodos en el grafo para un aprendizaje focalizado.  
* **Colaboración:** Sistema de comentarios estructurados dentro de los conceptos.  
* **Diseño Adaptativo y Temas:** Interfaz moderna (Neural Expressive UI) con soporte integral para modo oscuro (Dark Mode) por defecto y modo claro.

## **🛠️ Tecnologías Utilizadas**

* **Core:** [React 18](https://react.dev/) y [TypeScript](https://www.typescriptlang.org/)  
* **Build Tool:** [Vite](https://vitejs.dev/)  
* **Enrutamiento:** [React Router v6](https://reactrouter.com/) (Data API con createBrowserRouter y Lazy Loading)  
* **Peticiones HTTP:** [Axios](https://axios-http.com/) (con interceptores para el manejo de JWT)  
* **Visualización de Datos:** [D3.js](https://d3js.org/)  
* **Manejo de Formularios y Validación:** [React Hook Form](https://react-hook-form.com/) \+ [Zod](https://zod.dev/)  
* **UI / Estilos:** CSS modular con variables de diseño personalizadas (sin dependencias CSS externas pesadas) y notificaciones a través de [React Hot Toast](https://react-hot-toast.com/).  
* **Iconos:** [Lucide React](https://lucide.dev/)  
* **Testing (E2E):** [Playwright](https://playwright.dev/)

## **📦 Instalación y Configuración**

Sigue estos pasos para configurar el entorno de desarrollo local:

### **1\. Requisitos Previos**

* [Node.js](https://nodejs.org/) (versión 18 o superior recomendada).  
* Un gestor de paquetes (npm, yarn o pnpm).  
* Tener el backend corriendo localmente en el puerto 8080 (o ajustar el archivo de entorno).

### **2\. Clonar el repositorio e instalar dependencias**

\# Instalar las dependencias (se creará la carpeta node\_modules)  
npm install

### **3\. Variables de Entorno**

El proyecto se conecta a la API local por defecto, pero puedes configurar la ruta en un archivo .env en la raíz del proyecto:

VITE\_API\_URL=http://localhost:8080/api/v1

*Nota: Vite ya tiene configurado un proxy en vite.config.ts para redirigir las peticiones /api a http://localhost:8080 de manera fluida.*

### **4\. Ejecutar en Modo Desarrollo**

npm run dev

La aplicación estará disponible en http://localhost:5173.

## **📜 Scripts Disponibles**

En el directorio del proyecto, puedes ejecutar:

* npm run dev: Inicia el servidor de desarrollo de Vite.  
* npm run build: Compila TypeScript y genera la versión de producción en la carpeta dist.  
* npm run preview: Previsualiza localmente la compilación generada para producción.  
* npm run lint: Ejecuta ESLint para buscar y advertir sobre errores de código.

## **📁 Estructura del Proyecto**

Una vista general de la estructura principal de la carpeta src/:

src/  
├── api.ts            \# Configuración de Axios y funciones de llamadas a la API  
├── App.tsx           \# Componente raíz con los proveedores globales (Toaster, Auth, Router)  
├── components/       \# Componentes reusables (UI, Layouts, Protecciones de ruta)  
├── context/          \# Contextos globales de React (ej. AuthContext)  
├── index.css         \# Variables globales, temas (Dark/Light) y clases utilitarias personalizadas  
├── main.tsx          \# Punto de entrada de React  
├── pages/            \# Componentes principales de cada ruta (cargados de forma diferida)  
├── router.tsx        \# Configuración centralizada de las rutas de la aplicación  
└── types.ts          \# Definiciones de tipos e interfaces de TypeScript

## **🔒 Autenticación**

El proyecto maneja la autenticación mediante **JSON Web Tokens (JWT)**.

Al iniciar sesión, el token se guarda en localStorage (grove\_token) y el interceptor de Axios (en api.ts) adjunta automáticamente la cabecera Authorization: Bearer \<token\> a cada solicitud subsiguiente.