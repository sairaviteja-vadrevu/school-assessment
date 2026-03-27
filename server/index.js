import express from 'express';
import cors from 'cors';

// Import routes
import authRoutes from './routes/auth.js';
import teachersRoutes from './routes/teachers.js';
import tasksRoutes from './routes/tasks.js';
import collaborationRoutes from './routes/collaboration.js';
import attendanceRoutes from './routes/attendance.js';
import assessmentsRoutes from './routes/assessments.js';
import campaignsRoutes from './routes/campaigns.js';
import adminRoutes from './routes/admin.js';
import classesRoutes from './routes/classes.js';
import studentsRoutes from './routes/students.js';

// Initialize database
import db from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'School Staff Collaboration App Backend' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teachers', teachersRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/collaboration', collaborationRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/assessments', assessmentsRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/students', studentsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`School Staff Collaboration App Backend running on port ${PORT}`);
  console.log(`\nDefault Login Credentials:`);
  console.log(`Admin: admin@school.com / admin123`);
  console.log(`Teacher: teacher1@school.com / teacher123`);
});

export default app;
