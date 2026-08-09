const express = require("express");
const {
  listAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  accountValidators,
} = require("../controllers/accountController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", listAccounts);
router.post("/", accountValidators, createAccount);
router.patch("/:id", updateAccount);
router.delete("/:id", deleteAccount);

module.exports = router;
