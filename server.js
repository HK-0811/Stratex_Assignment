const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const app = express();
app.use(express.json());

const SECRET_KEY = process.env.SECRET_KEY;

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  console.log("Auth Header:", authHeader);
  const token = authHeader && authHeader.split(" ")[1]; // Extract token
  console.log("Token:", token);
  if (!token) return res.status(401).json({ error: "Access denied" });

  try {
    const verified = jwt.verify(token, SECRET_KEY);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ error: "Invalid token" });
  }
};

// Middleware to verify seller role
const isSeller = (req, res, next) => {
  if (req.user.role !== "seller")
    return res.status(403).json({ error: "Access denied" });
  next();
};

// Register user or seller
app.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: "User already exists" });
  }
});

// Login user or seller
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user)
    return res.status(400).json({ error: "Email or password is wrong" });

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword)
    return res.status(400).json({ error: "Invalid password" });

  const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY);
  res.header("Authorization", token).json({ token });
});

// Configure multer for CSV upload
const upload = multer({ dest: "uploads/" });

// Upload books via CSV
app.post(
  "/books/upload",
  authenticateToken,
  isSeller,
  upload.single("file"),
  async (req, res) => {
    const csvFilePath = req.file.path;

    // Parse CSV and insert books into the database (CSV parsing logic here)
    const csv = require("csv-parser");
    const fs = require("fs");

    const books = [];
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on("data", (row) => {
        books.push({
          title: row.title,
          author: row.author,
          price: parseFloat(row.price),
          sellerId: req.user.id,
        });
      })
      .on("end", async () => {
        await prisma.book.createMany({
          data: books,
        });
        res.json({ message: "Books uploaded successfully" });
      });
  }
);

// CRUD operations for books
app.get("/books", authenticateToken, async (req, res) => {
  const books = await prisma.book.findMany();
  res.json(books);
});

app.get("/books/:id", authenticateToken, async (req, res) => {
  const book = await prisma.book.findUnique({
    where: { id: parseInt(req.params.id) },
  });
  if (!book) return res.status(404).json({ error: "Book not found" });
  res.json(book);
});

app.put("/books/:id", authenticateToken, isSeller, async (req, res) => {
  const { title, author, price } = req.body;
  const book = await prisma.book.findUnique({
    where: { id: parseInt(req.params.id) },
  });

  if (book.sellerId !== req.user.id)
    return res.status(403).json({ error: "Access denied" });

  const updatedBook = await prisma.book.update({
    where: { id: parseInt(req.params.id) },
    data: { title, author, price },
  });
  res.json(updatedBook);
});

app.delete("/books/:id", authenticateToken, isSeller, async (req, res) => {
  const book = await prisma.book.findUnique({
    where: { id: parseInt(req.params.id) },
  });

  if (book.sellerId !== req.user.id)
    return res.status(403).json({ error: "Access denied" });

  await prisma.book.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ message: "Book deleted" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
