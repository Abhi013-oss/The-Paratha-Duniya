import { Router, Request, Response } from 'express';
import prisma from '../config/db';
import { authenticateAdmin } from '../middleware/auth';

const router = Router();

// Public: Get all products (with optional filtering)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, isVeg, isBestSeller, search } = req.query;

    const whereClause: any = { isActive: true };

    if (category) {
      whereClause.category = { slug: String(category) };
    }

    if (isVeg !== undefined) {
      whereClause.isVeg = isVeg === 'true';
    }

    if (isBestSeller !== undefined) {
      whereClause.isBestSeller = isBestSeller === 'true';
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: String(search) } },
        { description: { contains: String(search) } },
      ];
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: {
          select: { name: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(products);
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Public: Get all categories
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (error) {
    console.error('Fetch categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Admin: Add a new product
router.post('/', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
  const { name, description, price, image, categoryId, isVeg, isBestSeller } = req.body;

  if (!name || !price || !categoryId) {
    res.status(400).json({ error: 'Name, price, and categoryId are required.' });
    return;
  }

  try {
    const product = await prisma.product.create({
      data: {
        name,
        description: description || '',
        price: Number(price),
        image: image || 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=800&auto=format&fit=crop&q=80',
        categoryId: Number(categoryId),
        isVeg: isVeg === true || isVeg === 'true',
        isBestSeller: isBestSeller === true || isBestSeller === 'true',
        isActive: true,
      },
    });
    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Admin: Update a product
router.put('/:id', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, description, price, image, categoryId, isVeg, isBestSeller, isActive } = req.body;

  try {
    const existing = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const updated = await prisma.product.update({
      where: { id: Number(id) },
      data: {
        name: name !== undefined ? name : existing.name,
        description: description !== undefined ? description : existing.description,
        price: price !== undefined ? Number(price) : existing.price,
        image: image !== undefined ? image : existing.image,
        categoryId: categoryId !== undefined ? Number(categoryId) : existing.categoryId,
        isVeg: isVeg !== undefined ? (isVeg === true || isVeg === 'true') : existing.isVeg,
        isBestSeller: isBestSeller !== undefined ? (isBestSeller === true || isBestSeller === 'true') : existing.isBestSeller,
        isActive: isActive !== undefined ? (isActive === true || isActive === 'true') : existing.isActive,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Admin: Delete a product
router.delete('/:id', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    await prisma.product.delete({
      where: { id: Number(id) },
    });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product (might be associated with orders).' });
  }
});

// Admin: Add a Category
router.post('/categories', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
  const { name, slug } = req.body;

  if (!name || !slug) {
    res.status(400).json({ error: 'Category Name and slug are required.' });
    return;
  }

  try {
    const category = await prisma.category.create({
      data: { name, slug },
    });
    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category (slug must be unique)' });
  }
});

export default router;
