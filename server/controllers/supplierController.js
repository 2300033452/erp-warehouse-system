const prisma = require("../prismaClient");

const addSupplier = async (req, res) => {
  try {
    const { name, email, phone, address, productsSupplied } = req.body;

    if (!name || !email || !phone || !address) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        email,
        phone,
        address,
        productsSupplied,
      },
    });

    res.status(201).json(supplier);
  } catch (error) {
    console.error("Add supplier error:", error);
    res.status(500).json({ error: "Failed to add supplier" });
  }
};

const getSuppliers = async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json(suppliers);
  } catch (error) {
    console.error("Get suppliers error:", error);
    res.status(500).json({ error: "Failed to fetch suppliers" });
  }
};

module.exports = {
  addSupplier,
  getSuppliers,
};