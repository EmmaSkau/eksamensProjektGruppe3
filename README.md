Hjemmeværnsskolens Ledelsestræner (Leadership Training App)
En webbaseret applikation til ledelsestræning på Hjemmeværnsskolen — designet til at facilitere team-baserede øvelser gennem spilbaserede opgaver og refleksion.

🧭 Overblik
Dette er et Minimum Viable Product (MVP), der understøtter kurser i ledelse. Instruktører kan oprette spil med opgaver, som deltagerhold skal løse for at optjene point og fremme læring gennem refleksion.

✨ Funktioner
👥 For Deltagere
Opret eller deltag i hold via adgangskoder

Løs opgaver (multiple choice, tekstsvar, video)

Følg holdets fremdrift og pointtavle

Reflektér over læring via refleksionsspørgsmål

🎓 For Instruktører
Opret og administrér spil

Design opgaver med type, sværhedsgrad og point

Evaluer deltagerbesvarelser

Få adgang til refleksioner og statistik

🛠️ For Administratorer
Overvåg spil, brugere og hold

Håndtér brugerroller og konti

Adgang til systemstatistik

Eksportér data til analyse

🏗️ Teknisk Arkitektur
Frontend
React + Tailwind CSS

Mobilvenligt og responsivt design

JWT-baseret autentifikation med rolleadgang

Backend
Node.js med Express

MongoDB via Mongoose

Multer til video-upload

JWT til autentifikation

Deployment
Frontend: Vercel

Backend + Database: Render eller Railway

🚀 Kom i gang
Krav
Node.js v14+

MongoDB (lokalt eller Atlas)

Installation
Klon projektet:


git clone https://github.com/your-org/leadership-training-app.git
cd leadership-training-app
Installer backend-afhængigheder:

cd backend
npm install
Opret en .env i backend:

PORT=5000
MONGODB_URI=din_mongodb_connection_string
JWT_SECRET=din_jwt_secret
NODE_ENV=development
Installer frontend-afhængigheder:

cd ../frontend
npm install
Opret en .env i frontend:

REACT_APP_API_URL=http://localhost:5000
Kørsel
Start backend:

cd backend
npm run dev
Start frontend:

cd ../frontend
npm start
Gå til:

Frontend: http://localhost:3000

Backend API: http://localhost:5000

👤 Standardbrugere (Kun i udvikling)
Admin

Bruger: admin@example.com

Kode: admin123

Instruktør

Bruger: instructor@example.com

Kode: instructor123

Deltagere

participant1@example.com / participant123

participant2@example.com / participant123

leadership-training-app/
├── README.md                       # Introduktion og opsætning 📘
├── PROJECT_STRUCTURE.md            # Uddybning af mappestruktur 📁
│
├── backend/                        # Node.js backend ⚙️
│   ├── server.js                   # API-endpoints, database og auth
│   ├── package.json                # Afhængigheder
│   ├── .env.example                # Eksempel på miljøvariabler
│   └── render.yaml                 # Render deployment-konfiguration
│
├── frontend/                       # React frontend 🌐
│   ├── package.json                # Afhængigheder
│   ├── .env.example                # Eksempel på miljøvariabler
│   ├── tailwind.config.js         # Tailwind opsætning
│   ├── postcss.config.js          # PostCSS opsætning
│   ├── vercel.json                # Vercel deployment-konfiguration
│   │
│   ├── public/
│   │   ├── index.html             # HTML-entry point
│   │   └── manifest.json          # Web app manifest
│   │
│   ├── src/
│   │   ├── index.js               # React entry point
│   │   ├── index.css              # Globale styles
│   │   ├── App.jsx                # Hovedkomponent med routing
│   │   ├── reportWebVitals.js     # Ydelsesmåling
│   │   │
│   │   ├── utils/
│   │   │   └── api.js             # API-kald til backend
│   │   │
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx    # Autentifikation og brugerhåndtering
│   │   │
│   │   ├── components/
│   │   │   └── common/
│   │   │       ├── Navbar.jsx     # Navigation
│   │   │       └── Footer.jsx     # Footer
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │
│   │   │   ├── participant/
│   │   │   │   ├── GameJoin.jsx
│   │   │   │   ├── TeamDashboard.jsx
│   │   │   │   ├── TaskList.jsx
│   │   │   │   ├── TaskSolve.jsx
│   │   │   │   └── Reflection.jsx
│   │   │
│   │   │   ├── instructor/
│   │   │   │   ├── InstructorDashboard.jsx
│   │   │   │   ├── GameCreate.jsx
│   │   │   │   ├── GameManage.jsx
│   │   │   │   ├── TaskCreate.jsx
│   │   │   │   └── SubmissionEvaluate.jsx
│   │   │
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── UserManagement.jsx
│   │   │       └── GameStatistics.jsx

🪪 Licens
Dette projekt er open source og udviklet til Hjemmeværnsskolen med henblik på videreudvikling og fri brug.
🔓 Licenseres under MIT eller tilsvarende åben licens. Se LICENSE-filen for detaljer.

🙏 Anerkendelser
Designinspiration fra Forsvarets visuelle designmanual
Udviklet som MVP til brug i undervisning og evaluering

ℹ️ Om .env.example
Både frontend og backend har en fil kaldet .env.example. Disse er bevidst ikke ignoreret i .gitignore, da projektet har undervisningsformål. De giver en skabelon, så studerende eller udviklere nemt kan opsætte deres miljøvariabler korrekt.
