const express = require("express");
const router = express.Router();

const {
  addPurchase,
  getPurchases,
  clearPurchases,
} = require("../controllers/purchaseController");

router.post("/", addPurchase);
router.get("/", getPurchases);
router.delete("/clear", clearPurchases);

module.exports = router;