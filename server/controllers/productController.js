const prisma = require("../prismaClient");

const addProduct = async (req, res) => {
  try {
    const { name, category, stock, buyPrice, sellPrice, lowStockThreshold } = req.body;

    if (
      !name ||
      !category ||
      stock === undefined ||
      buyPrice === undefined ||
      sellPrice === undefined ||
      lowStockThreshold === undefined
    ) {
      return res.status(400).json({ error: "All product fields are required" });
    }

    const product = await prisma.product.create({
      data: {
        name,
        category,
        stock: Number(stock),
        buyPrice: Number(buyPrice),
        sellPrice: Number(sellPrice),
        lowStockThreshold: Number(lowStockThreshold),
      },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error("Add product error:", error);
    res.status(500).json({ error: "Failed to add product" });
  }
};

const getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        sales: true,
        purchases: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const enrichedProducts = products.map((product) => {
      const totalSoldUnits = product.sales.reduce(
        (sum, sale) => sum + sale.soldUnits,
        0
      );

      const totalPurchasedUnits = product.purchases.reduce(
        (sum, purchase) => sum + purchase.quantity,
        0
      );

      const remainingStock = product.stock;
      const isLowStock = remainingStock <= product.lowStockThreshold;

      return {
        ...product,
        totalSoldUnits,
        totalPurchasedUnits,
        remainingStock,
        isLowStock,
      };
    });

    res.json(enrichedProducts);
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
};

module.exports = {
  addProduct,
  getProducts,
  deleteProduct,
};