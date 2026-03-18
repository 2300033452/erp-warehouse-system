const express = require("express");
const router = express.Router();

const {
  getSummary,
  getPredictions,
} = require("../controllers/analyticsController");

router.get("/summary", getSummary);
router.get("/predictions", getPredictions);

module.exports = router;