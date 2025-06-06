import express, { json } from 'express'
import 'dotenv/config'
import auth from './assets/js/auth.js'
import session from 'express-session'
import * as query from './assets/js/query.js'

const app = express()
const port = 3000

app.use(json()) // Middleware to parse JSON request bodies

import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
})

// Apply the rate limiting middleware to all requests.
app.use(limiter)

app.get('/', async (req, res) => {
  try {
    const result = query.getAllUsers()
    result.then(data => {
      res.status(200).json(data)
    })
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
  try {
    let { username, password, email } = req.body
    const validatedInput = auth.user_schema.validate({username: username, password: password, email: email})
    
    if (validatedInput.error) return res.status(400).send(validatedInput.error.message)

    password = await auth.hashPassword(password)

    if (!password) return res.status(500).send('Error hashing password')

    console.log(`Creating user with username: ${username}, email: ${email}`)

    const existingUser = query.getUserByUsername(username)

    if (existingUser) {
      return res.status(409).send('Username already exists')
    }

    const result = query.addUser(username, password, email)

    result.then(data => {
      if (!data) return res.status(500).send('Error creating user')
      res.status(201).json(data)
    })

  }
  catch (err) {
    console.error(err)
    res.status(500).send('Internal Server Error')
  }
})


app.get('/login', async (req, res) => {
  if(req.headers['content-type'] !== 'application/json') {
    return res.status(400).send('Content-Type must be application/json')
  }
  if (!req.body) {
    return res.status(400).send('Request body is required')
  }
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).send('Missing required fields')
    }
    const user = await pool.query('SELECT * FROM user_data WHERE username = $1', [username])
    if (user.rows.length === 0) {
      return res.status(404).send('User not found')
    }
    const isValidPassword = await auth.verifyPassword(password, user.rows[0].password)
    if (!isValidPassword) {
      return res.status(401).send('Invalid password')
    }
    res.json({ message: 'Login successful' })
  }
  catch (err) {
    console.error(err)
    res.status(500).send('Internal Server Error')
  }
}
)

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