import "dotenv/config";
import pg from "pg";
import bcrypt from "bcryptjs";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function query(text, params) {
  const result = await pool.query(text, params);
  return result;
}

async function initializeDatabase() {
  // Users table
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'teacher')),
      subject TEXT,
      phone TEXT,
      classes TEXT,
      responsibilities TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tasks table
  await query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      assigned_to INTEGER NOT NULL REFERENCES users(id),
      assigned_by INTEGER NOT NULL REFERENCES users(id),
      deadline TIMESTAMP,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed')),
      priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Announcements table
  await query(`
    CREATE TABLE IF NOT EXISTS announcements (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author_id INTEGER NOT NULL REFERENCES users(id),
      priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('normal', 'urgent')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Collaboration rooms table
  await query(`
    CREATE TABLE IF NOT EXISTS collab_rooms (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL CHECK(type IN ('department', 'academic', 'event', 'general')),
      created_by INTEGER NOT NULL REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Collaboration messages table
  await query(`
    CREATE TABLE IF NOT EXISTS collab_messages (
      id SERIAL PRIMARY KEY,
      room_id INTEGER NOT NULL REFERENCES collab_rooms(id),
      author_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      parent_id INTEGER REFERENCES collab_messages(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Collaboration room members table
  await query(`
    CREATE TABLE IF NOT EXISTS collab_room_members (
      id SERIAL PRIMARY KEY,
      room_id INTEGER NOT NULL REFERENCES collab_rooms(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(room_id, user_id)
    )
  `);

  // Collaboration notifications table
  await query(`
    CREATE TABLE IF NOT EXISTS collab_notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      room_id INTEGER NOT NULL REFERENCES collab_rooms(id) ON DELETE CASCADE,
      message_id INTEGER NOT NULL REFERENCES collab_messages(id) ON DELETE CASCADE,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Teacher attendance table
  await query(`
    CREATE TABLE IF NOT EXISTS teacher_attendance (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      date DATE NOT NULL,
      check_in TIMESTAMP,
      check_out TIMESTAMP,
      status TEXT NOT NULL CHECK(status IN ('present', 'absent', 'late')),
      location TEXT,
      UNIQUE(user_id, date)
    )
  `);

  // Student classes table
  await query(`
    CREATE TABLE IF NOT EXISTS student_classes (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      section TEXT NOT NULL,
      grade INTEGER NOT NULL
    )
  `);

  // Students table
  await query(`
    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      class_id INTEGER NOT NULL REFERENCES student_classes(id),
      roll_number INTEGER NOT NULL
    )
  `);

  // Student attendance table
  await query(`
    CREATE TABLE IF NOT EXISTS student_attendance (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES students(id),
      class_id INTEGER NOT NULL REFERENCES student_classes(id),
      date DATE NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('present', 'absent', 'late')),
      marked_by INTEGER NOT NULL REFERENCES users(id),
      UNIQUE(student_id, date)
    )
  `);

  // Assessments table
  await query(`
    CREATE TABLE IF NOT EXISTS assessments (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES students(id),
      subject TEXT NOT NULL,
      marks REAL NOT NULL,
      total_marks REAL NOT NULL,
      grade TEXT,
      exam_type TEXT NOT NULL,
      date DATE NOT NULL,
      entered_by INTEGER NOT NULL REFERENCES users(id)
    )
  `);

  // Campaigns table
  await query(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      assigned_to INTEGER REFERENCES users(id),
      location TEXT,
      visit_date DATE,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'planned' CHECK(status IN ('planned', 'in_progress', 'completed')),
      created_by INTEGER NOT NULL REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      live_lat REAL,
      live_lng REAL,
      live_updated_at TIMESTAMP
    )
  `);

  // Campaign location logs table
  await query(`
    CREATE TABLE IF NOT EXISTS campaign_location_logs (
      id SERIAL PRIMARY KEY,
      campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      place_name TEXT,
      logged_at TEXT NOT NULL
    )
  `);

  console.log("Database tables initialized");
}

async function seedDatabase() {
  const { rows } = await query("SELECT COUNT(*) as count FROM users");
  if (parseInt(rows[0].count) > 0) {
    console.log("Database already has users, skipping seed...");
    return;
  }

  console.log("Seeding database...");
  const adminPassword = bcrypt.hashSync("admin123", 10);
  const teacherPassword = bcrypt.hashSync("teacher123", 10);

  await query("INSERT INTO users (name, email, password, role, subject, phone, classes) VALUES ($1, $2, $3, $4, $5, $6, $7)", [
    "Admin",
    "admin@school.com",
    adminPassword,
    "admin",
    null,
    null,
    null,
  ]);
  await query("INSERT INTO users (name, email, password, role, subject, phone, classes) VALUES ($1, $2, $3, $4, $5, $6, $7)", [
    "Teacher One",
    "teacher1@school.com",
    teacherPassword,
    "teacher",
    "Mathematics",
    "555-0101",
    "10A, 10B",
  ]);

  console.log("Database seeded successfully");
}

// Initialize on load
(async () => {
  try {
    await initializeDatabase();
    await seedDatabase();
  } catch (error) {
    console.error("Database initialization error:", error);
  }
})();

export default { query };
export { query, pool };
