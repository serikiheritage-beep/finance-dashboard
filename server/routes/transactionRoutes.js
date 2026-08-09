const express = require("express");
const {
  listTransactions,
  createTransaction,
  deleteTransaction,
  transactionValidators,
} = require("../controllers/transactionController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", listTransactions);
router.post("/", transactionValidators, createTransaction);
router.delete("/:id", deleteTransaction);

module.exports = router;
