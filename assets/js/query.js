import { Pool } from 'pg'

const pool = new Pool({
  user: process.env.DB_USER_NAME,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
})

export async function addUser(username, password, email) {
  try {
        const result = await pool.query("INSERT INTO user_data (username, password, email) VALUES ($1, $2, $3) RETURNING *",
            [username, password, email]);
        return result.rows[0]
    } catch (err) {
        console.error("Error adding user:", err);
    }
}

export async function getUserByUsername(username) {
  try {
    const result = await pool.query('SELECT * FROM user_data WHERE username = $1', [username]);
    return result.rows[0];
  } catch (err) {
    console.error("Error fetching user:", err);
    throw err;
  }
}

export async function getAllUsers() {
    try {
            const result = await pool.query('SELECT * FROM user_data');
            return result.rows;
        } catch (err) {
            console.error("Error fetching all users:", err);
            throw err;
        }
}
async function getPublicProblems() {
  try {
        const result = await pool.query('SELECT * FROM problem WHERE is_private = false');
        return result.rows;
    } catch (err) {
        console.error("Error fetching public problems:", err);
    }
}

export async function getCardsByUserId(userId) {
  try {
    const result = await pool.query('SELECT * FROM card WHERE user_id = $1', [userId]);
    return result.rows;
  } catch (err) {
    console.error("Error fetching problems by user ID:", err);
  }
}

function getProblemById(problemId) {
  return pool.query('SELECT * FROM problem WHERE id = $1', [problemId])
    .then(result => result.rows[0])
    .catch(err => {
      console.error("Error fetching problem:", err);
      throw err;
    });
}
function addProblem(title, description, isPrivate) {
  return pool.query("INSERT INTO problem (title, description, is_private) VALUES ($1, $2, $3) RETURNING *",
    [title, description, isPrivate])
    .then(result => result.rows[0])
    .catch(err => {
      console.error("Error adding problem:", err);
      throw err;
    });
}
function updateProblem(problemId, title, description, isPrivate) {
  return pool.query("UPDATE problem SET title = $1, description = $2, is_private = $3 WHERE id = $4 RETURNING *",
    [title, description, isPrivate, problemId])
    .then(result => result.rows[0])
    .catch(err => {
      console.error("Error updating problem:", err);
      throw err;
    });
}
function deleteProblem(problemId) {
  return pool.query("DELETE FROM problem WHERE id = $1 RETURNING *", [problemId])
    .then(result => result.rows[0])
    .catch(err => {
      console.error("Error deleting problem:", err);
      throw err;
    });
}