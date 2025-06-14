import express, { json } from 'express'
import 'dotenv/config'
import auth from './assets/js/auth.js'
import session from 'express-session'
import * as query from './assets/js/query.js'
import cors from 'cors'

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

const allowedOrigin = 'http://localhost:5500' // testing
// const allowedOrigin = 'http://localhost:5500' // add real domain name here

app.use(cors({credentials: true, origin: allowedOrigin}))

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // Set to true if using HTTPS
    httpOnly: true,
    sameSite: 'none',
    maxAge: 1000 * 60 * 60 // 1 hour
  }
}))

function isAuthenticated(req, res, next) {
  console.log("checking authentication for request:", req.method, req.url, req.session);
  if (req.session.user) {
    console.log("got user");
    return next()
  }
  res.status(401).send('Unauthorized')
}

app.get('/', async (req, res) => {
  try {
    const result = await query.getAllUsers()
    res.status(200).json(result)
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

    const existingUser = await query.getUserByUsername(username)

    if (existingUser) return res.status(409).send('Username already exists')

    const existingEmail = await query.getUserByEmail(email)

    if (existingEmail) return res.status(409).send('Email already exists')

    const result = await query.addUser(username, password, email)

    res.status(201).json(result)

  }
  catch (err) {
    console.error(err)
    res.status(500).send('Internal Server Error')
  }
})


app.post('/login', async (req, res) => {
  if(req.headers['content-type'] !== 'application/json') {
    return res.status(400).send('Content-Type must be application/json')
  }
  try {
    const { username, password } = req.body
    const validatedInput = auth.user_login_schema.validate({username: username, password: password})

    if (validatedInput.error) return res.status(400).send(validatedInput.error.message)

    const user = await query.getUserByUsername(username)

    if (!user) return res.status(404).send('User not found')
    
    const isValidPassword = await auth.verifyPassword(password, user.password)

    if (!isValidPassword) return res.status(401).send('Invalid password')

    req.session.user = {
      id: user.id,
      username: user.username,
    }

    req.session.save()

    console.log("logged in", req.session)

    res.status(200).json({ message: 'Login successful' })
  }
  catch (err) {
    console.error(err)
    res.status(500).send('Internal Server Error')
  }
}
)

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err)
      return res.status(500).send('Internal Server Error')
    }
    res.status(200).send('Logged out successfully')
  })
})

app.get('/user/problems', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id
    const result = await query.getCardsByUserId(userId)
    console.log(result)
    res.status(200).json(result)
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
  console.log(`Server listening on port ${port}`)
})