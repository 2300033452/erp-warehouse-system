const express = require("express");
const router = express.Router();

const {
  addSale,
  getSales,
  clearSales,
} = require("../controllers/saleController");

router.post("/", addSale);
router.get("/", getSales);
router.delete("/clear", clearSales);

module.exports = router;