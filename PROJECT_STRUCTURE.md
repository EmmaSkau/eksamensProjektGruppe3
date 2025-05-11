📁 Projektstruktur – Hjemmeværnsskolens Ledelsestræner
Denne fil giver et overblik over mappestrukturen i projektet og forklarer kort, hvad hver fil og mappe bruges til.

🛠 Backend (/backend)
Fil/Mappe	Beskrivelse
server.js	Hovedfilen for Express-serveren. Indeholder alle API-endpoints, databasemodeller og autentifikation.
package.json	Indeholder afhængigheder og scripts til backend.
.env.example	Eksempel på nødvendige miljøvariabler (f.eks. database-url, port, JWT-secret). Denne fil er ikke i .gitignore, da den skal bruges som reference til læring.
render.yaml	Konfigurationsfil til deployment på Render.com.
uploads/	Midlertidig mappe til upload af videoer via Multer.

🌐 Frontend (/frontend)
Fil/Mappe	Beskrivelse
package.json	Afhængigheder og scripts til React frontend.
.env.example	Eksempel på miljøvariabler, fx API-url. Også inkluderet med vilje for læring.
tailwind.config.js	Konfiguration til Tailwind CSS.
postcss.config.js	Konfiguration til PostCSS (anvendes sammen med Tailwind).
vercel.json	Deployment-konfiguration til Vercel.

🧾 Public-mappe (/frontend/public)
Fil	Beskrivelse
index.html	HTML-entry point. React mountes her.
manifest.json	Web app manifest for progressive web app (PWA)-funktioner.

📦 Kildemappe (/frontend/src)
Hovedfiler
Fil	Beskrivelse
index.js	Entry point for React-appen.
index.css	Globale styles inkl. Tailwind-imports.
App.jsx	Hovedkomponenten med routing.
reportWebVitals.js	Bruges til at måle performance (valgfrit).

🔧 Utilities
Fil	Beskrivelse
utils/api.js	Hjælpefunktioner til kommunikation med backend API.

🔐 Contexts
Fil	Beskrivelse
contexts/AuthContext.jsx	React Context til håndtering af login, brugerdata og adgangskontrol.

🧩 Fælles Komponenter
Fil	Beskrivelse
components/common/Navbar.jsx	Navigationsbar, vises på tværs af sider.
components/common/Footer.jsx	Footer-komponent.

📄 Sider (/frontend/src/pages)
Deltagere (/participant)
Fil	Beskrivelse
GameJoin.jsx	Side til at deltage i spil via adgangskode.
TeamDashboard.jsx	Oversigt over opgaver og status for holdet.
TaskList.jsx	Liste over opgaver.
TaskSolve.jsx	Løsningsside for enkeltopgaver.
Reflection.jsx	Refleksionsside efter gennemførsel.

Instruktører (/instructor)
Fil	Beskrivelse
InstructorDashboard.jsx	Oversigt over spil og opgaver.
GameCreate.jsx	Opret nyt spil.
GameManage.jsx	Administrer eksisterende spil.
TaskCreate.jsx	Opret opgaver.
SubmissionEvaluate.jsx	Gennemgå og vurder opgavebesvarelser.

Administratorer (/admin)
Fil	Beskrivelse
AdminDashboard.jsx	Adgang til systemstatus og overvågning.
UserManagement.jsx	Håndtér brugere og roller.
GameStatistics.jsx	Statistik og datavisualisering.

Fælles Sider
Fil	Beskrivelse
Home.jsx	Forside med introduktion.
Login.jsx	Log ind-side.
Register.jsx	Registrér ny bruger.
