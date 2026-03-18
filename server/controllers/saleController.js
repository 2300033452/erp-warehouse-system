const prisma = require("../prismaClient");

const addSale = async (req, res) => {
  try {
    const { productId, soldUnits, sellingPricePerUnit, soldBy } = req.body;

    if (!productId || !soldUnits || !sellingPricePerUnit || !soldBy) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const product = await prisma.product.findUnique({
      where: { id: Number(productId) },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (product.stock < Number(soldUnits)) {
      return res.status(400).json({ error: "Not enough stock" });
    }

    const sale = await prisma.sale.create({
      data: {
        productId: Number(productId),
        soldUnits: Number(soldUnits),
        sellingPricePerUnit: Number(sellingPricePerUnit),
        soldBy,
      },
    });

    await prisma.product.update({
      where: { id: Number(productId) },
      data: {
        stock: {
          decrement: Number(soldUnits),
        },
      },
    });

    res.status(201).json(sale);
  } catch (error) {
    console.error("Add sale error:", error);
    res.status(500).json({ error: "Failed to add sale" });
  }
};

const getSales = async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        product: true,
      },
      orderBy: { date: "desc" },
    });

    res.json(sales);
  } catch (error) {
    console.error("Get sales error:", error);
    res.status(500).json({ error: "Failed to fetch sales" });
  }
};

const clearSales = async (req, res) => {
  try {
    await prisma.sale.deleteMany({});
    res.json({ message: "All sales history cleared successfully" });
  } catch (error) {
    console.error("Clear sales error:", error);
    res.status(500).json({ error: "Failed to clear sales history" });
  }
};

module.exports = {
  addSale,
  getSales,
  clearSales,
};