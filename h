frontend/
├── public/
│   └── index.html
│
├── src/
│   ├── assets/
│   │   ├── images/
│   │   └── styles/
│   │       └── global.css
│
│   ├── components/
│   │   ├── common/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── RoleGuard.jsx
│   │   │
│   │   ├── ui/
│   │   │   ├── Loading.jsx
│   │   │   ├── ConfirmDialog.jsx
│   │   │   └── EmptyState.jsx
│
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx        ✅ (bổ sung)
│   │   │   └── Unauthorized.jsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── Dashboard.jsx
│   │   │   └── Statistics.jsx
│   │   │
│   │   ├── teams/
│   │   │   ├── TeamList.jsx
│   │   │   ├── TeamDetail.jsx
│   │   │   ├── TeamCreate.jsx
│   │   │   └── TeamMembers.jsx
│   │   │
│   │   ├── tasks/
│   │   │   ├── TaskBoard.jsx        (Kanban)
│   │   │   ├── TaskList.jsx
│   │   │   ├── TaskCreate.jsx
│   │   │   ├── TaskDetail.jsx
│   │   │   └── SubtaskList.jsx
│   │   │
│   │   ├── checkpoints/
│   │   │   ├── CheckpointList.jsx
│   │   │   ├── CheckpointCreate.jsx
│   │   │   └── CheckpointDetail.jsx
│   │   │
│   │   ├── submissions/
│   │   │   ├── SubmissionCreate.jsx
│   │   │   └── SubmissionList.jsx
│   │   │
│   │   └── users/
│   │       ├── Profile.jsx
│   │       └── UserList.jsx (Lecturer)
│
│   ├── services/
│   │   ├── api.js                  (Axios + JWT)
│   │   ├── authService.js
│   │   ├── teamService.js
│   │   ├── taskService.js
│   │   ├── checkpointService.js
│   │   └── submissionService.js
│
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── ThemeContext.jsx (optional)
│
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useRole.js
│   │   └── useFetch.js
│
│   ├── routes/
│   │   └── AppRoutes.jsx
│
│   ├── utils/
│   │   ├── constants.js
│   │   ├── formatDate.js
│   │   └── formatStatus.js
│
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── .env
├── package.json
└── README.md
