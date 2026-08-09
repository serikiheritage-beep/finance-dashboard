const { body, validationResult } = require("express-validator");
const db = require("../config/db");
const { hashPassword, comparePassword } = require("../utils/password");
const { signToken } = require("../utils/token");

const registerValidators = [
  body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters."),
  body("email").isEmail().withMessage("Enter a valid email address."),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters."),
];

const loginValidators = [
  body("email").isEmail().withMessage("Enter a valid email address."),
  body("password").notEmpty().withMessage("Password is required."),
];

async function register(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

  const { name, email, password } = req.body;

  try {
    const existing = await db.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "An account with that email already exists." });
    }

    const passwordHash = await hashPassword(password);
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'customer')
       RETURNING id, name, email, role, created_at`,
      [name, email, passwordHash]
    );

    const user = result.rows[0];
    const token = signToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

  const { email, password } = req.body;

  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user || !(await comparePassword(password, user.password_hash))) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    const token = signToken(user);
    delete user.password_hash;
    res.json({ user, token });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const result = await db.query(
      "SELECT id, name, email, role, created_at FROM users WHERE id = $1",
      [req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: "User not found." });
    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me, registerValidators, loginValidators };
  
