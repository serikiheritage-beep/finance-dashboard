const express = require("express");
const { listBudgets, upsertBudget, deleteBudget, budgetValidators } = require("../controllers/budgetController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", listBudgets);
router.post("/", budgetValidators, upsertBudget);
router.delete("/:id", deleteBudget);

module.exports = router;
