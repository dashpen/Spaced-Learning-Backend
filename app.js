const express = require('express')
const { Pool } = require('pg')
require('dotenv').config()
const auth =  require('./auth.js')

const app = express()
const port = 3000

app.use(express.json()) // Middleware to parse JSON request bodies

const pool = new Pool({
  user: process.env.DB_USER_NAME,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
})

app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM user_data')
    res.json(result.rows)
  }
  catch (err) {
    console.error(err)
    res.status(500).send('Internal Server Error')
  }
})

app.post('/signup', async (req, res) => {
  if(req.headers['content-type'] !== 'application/json') {
    return res.status(400).send('Content-Type must be application/json')
  }
  if (!req.body) {
    return res.status(400).send('Request body is required')
  }
  console.log(req)
  try {
    let { username, password, email } = req.body
    if (!username || !password || !email) {
      return res.status(400).send('Missing required fields')
    }
    const validatedInput = auth.user_schema.validate({username: username, password: password, email: email})
    if (validatedInput.error) {
      return res.status(400).send(validatedInput.error)
    }
    console.log(validatedInput)
    password = await auth.hashPassword(password)
    if (!password) {
      return res.status(500).send('Error hashing password')
    }
    const existingUser = await pool.query('SELECT * FROM user_data WHERE username = $1', [username])
    if (existingUser.rows.length > 0) {
      return res.status(409).send('Username already exists')
    }
    const result = await pool.query("INSERT INTO user_data (username, password, email) VALUES ($1, $2, $3) RETURNING *",
       [username, password, email])
    res.status(201).json(result.rows[0])
  }
  catch (err) {
    console.error(err)
    res.status(500).send('Internal Server Error')
  }
})


app.get('/problems', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM problem WHERE is_private = false')
    res.json(result.rows)
  }
  catch (err) {
    console.error(err)
    res.status(500).send('Internal Server Error')
  }
}
)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})