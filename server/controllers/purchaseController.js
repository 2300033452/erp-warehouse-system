const prisma = require("../prismaClient");

const addPurchase = async (req, res) => {
  try {
    const { supplierId, productId, quantity, purchasePricePerUnit } = req.body;

    if (!supplierId || !productId || !quantity || !purchasePricePerUnit) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const purchase = await prisma.purchase.create({
      data: {
        supplierId: Number(supplierId),
        productId: Number(productId),
        quantity: Number(quantity),
        purchasePricePerUnit: Number(purchasePricePerUnit),
      },
    });

    await prisma.product.update({
      where: { id: Number(productId) },
      data: {
        stock: {
          increment: Number(quantity),
        },
      },
    });

    res.status(201).json(purchase);
  } catch (error) {
    console.error("Add purchase error:", error);
    res.status(500).json({ error: "Failed to add purchase" });
  }
};

const getPurchases = async (req, res) => {
  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        supplier: true,
        product: true,
      },
      orderBy: { date: "desc" },
    });

    res.json(purchases);
  } catch (error) {
    console.error("Get purchases error:", error);
    res.status(500).json({ error: "Failed to fetch purchases" });
  }
};

const clearPurchases = async (req, res) => {
  try {
    await prisma.purchase.deleteMany({});
    res.json({ message: "All purchase history cleared successfully" });
  } catch (error) {
    console.error("Clear purchases error:", error);
    res.status(500).json({ error: "Failed to clear purchase history" });
  }
};

module.exports = {
  addPurchase,
  getPurchases,
  clearPurchases,
};