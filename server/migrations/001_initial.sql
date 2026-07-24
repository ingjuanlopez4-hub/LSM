PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  initials TEXT NOT NULL,
  level INTEGER NOT NULL CHECK (level >= 1),
  points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
  streak_days INTEGER NOT NULL DEFAULT 0 CHECK (streak_days >= 0),
  best_streak_days INTEGER NOT NULL DEFAULT 0 CHECK (best_streak_days >= 0),
  practice_minutes INTEGER NOT NULL DEFAULT 0 CHECK (practice_minutes >= 0),
  signs_mastered INTEGER NOT NULL DEFAULT 0 CHECK (signs_mastered >= 0),
  daily_goal_minutes INTEGER NOT NULL DEFAULT 18 CHECK (daily_goal_minutes BETWEEN 1 AND 240),
  weekly_goal_days INTEGER NOT NULL DEFAULT 5 CHECK (weekly_goal_days BETWEEN 1 AND 7),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  eyebrow TEXT NOT NULL,
  description TEXT NOT NULL,
  meta TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Vocabulario','Conversación','Cultura Sorda','Gramática')),
  level TEXT NOT NULL CHECK (level IN ('Principiante','Intermedio','Avanzado')),
  color TEXT NOT NULL CHECK (color IN ('coral','yellow','blue','mint')),
  image_url TEXT NOT NULL,
  position INTEGER NOT NULL,
  published INTEGER NOT NULL DEFAULT 1 CHECK (published IN (0,1))
);

CREATE TABLE lessons (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0),
  position INTEGER NOT NULL CHECK (position > 0),
  points_reward INTEGER NOT NULL DEFAULT 25 CHECK (points_reward >= 0),
  UNIQUE(course_id, position)
);

CREATE TABLE enrollments (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  PRIMARY KEY(user_id, course_id)
);

CREATE TABLE lesson_progress (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('in_progress','completed')),
  watched_seconds INTEGER NOT NULL DEFAULT 0 CHECK (watched_seconds >= 0),
  completed_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id, lesson_id)
);

CREATE TABLE challenges (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  options_json TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  points_reward INTEGER NOT NULL CHECK (points_reward >= 0),
  active_from TEXT NOT NULL,
  active_until TEXT NOT NULL
);

CREATE TABLE challenge_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL,
  answer TEXT NOT NULL,
  correct INTEGER NOT NULL CHECK (correct IN (0,1)),
  points_awarded INTEGER NOT NULL DEFAULT 0 CHECK (points_awarded >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, challenge_id, idempotency_key)
);

CREATE TABLE challenge_completions (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  attempt_id INTEGER NOT NULL REFERENCES challenge_attempts(id),
  completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(user_id, challenge_id)
);

CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  topic TEXT NOT NULL,
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 1000),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE post_likes (
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(post_id, user_id)
);

CREATE TABLE events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  mode TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE event_reservations (
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reserved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(event_id, user_id)
);

CREATE INDEX idx_courses_filters ON courses(published, level, category, position);
CREATE INDEX idx_lessons_course ON lessons(course_id, position);
CREATE INDEX idx_progress_user ON lesson_progress(user_id, status);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_comments_post ON comments(post_id, created_at);
CREATE INDEX idx_reservations_event ON event_reservations(event_id);
