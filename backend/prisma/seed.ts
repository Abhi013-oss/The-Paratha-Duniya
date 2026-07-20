import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with the official Paratha Duniya menu...');

  // 1. Clear existing database
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.coupon.deleteMany({});
  await prisma.admin.deleteMany({});

  // 2. Create default admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.admin.create({
    data: {
      email: 'admin@parathaduniya.com',
      password: hashedPassword,
      name: 'Super Admin',
    },
  });
  console.log('Admin seeded.');

  // 3. Create Categories
  const signatureCategory = await prisma.category.create({
    data: { name: 'Signature Parathas', slug: 'signature' },
  });
  const traditionalCategory = await prisma.category.create({
    data: { name: 'Traditional Specials', slug: 'traditional' },
  });
  const addonsCategory = await prisma.category.create({
    data: { name: 'Add-ons', slug: 'addons' },
  });
  console.log('Categories seeded.');

  // 4. Create Products matching the menu image exactly
  const products = [
    // Signature Parathas
    {
      name: 'Classic aloo paratha',
      description: 'Generously stuffed with spiced mashed potatoes, green chillies, and fresh coriander. A classic favorite.',
      price: 60,
      image: '/images/aloo.jpg',
      categoryId: signatureCategory.id,
      isVeg: true,
      isBestSeller: true,
    },
    {
      name: 'Cheese chilli garlic paratha',
      description: 'A mouthwatering fusion of melted cheese, spicy green chillies, and roasted garlic bits.',
      price: 80,
      image: '/images/cheese_chilli_garlic.jpg',
      categoryId: signatureCategory.id,
      isVeg: true,
      isBestSeller: true,
    },
    {
      name: 'Gobhi Paratha',
      description: 'Loaded with grated fresh cauliflower, seasoned ginger, green chillies, and roasted cumin spices.',
      price: 60,
      image: '/images/gobhi.jpg',
      categoryId: signatureCategory.id,
      isVeg: true,
      isBestSeller: false,
    },
    {
      name: 'Mooli Paratha',
      description: 'Stuffed with fresh grated radish, traditional Punjab ground spices, and fresh herbs.',
      price: 60,
      image: '/images/mooli.jpg',
      categoryId: signatureCategory.id,
      isVeg: true,
      isBestSeller: false,
    },
    {
      name: 'Methi Paratha',
      description: 'Wholesome flatbread infused with fresh fenugreek leaves, mixed spices, and roasted in pure ghee.',
      price: 60,
      image: '/images/methi.jpg',
      categoryId: signatureCategory.id,
      isVeg: true,
      isBestSeller: false,
    },
    {
      name: 'Palak Paratha',
      description: 'Healthy and delicious spinach flatbread mixed with green chillies, cumin, and soft herbs.',
      price: 60,
      image: '/images/palak.jpg',
      categoryId: signatureCategory.id,
      isVeg: true,
      isBestSeller: false,
    },
    {
      name: 'Paneer Paratha',
      description: 'Stuffed with fresh grated spiced paneer cottage cheese, roasted onions, and traditional herbs.',
      price: 70,
      image: '/images/paneer.jpg',
      categoryId: signatureCategory.id,
      isVeg: true,
      isBestSeller: true,
    },
    {
      name: 'Cheese Paratha',
      description: 'Melted premium cheese loaded inside a crispy layered flatbread. Extremely gooey and satisfying.',
      price: 70,
      image: '/images/cheese.jpg',
      categoryId: signatureCategory.id,
      isVeg: true,
      isBestSeller: true,
    },
    {
      name: 'Matar Paratha',
      description: 'Prepared using green peas mashed with light roasted spices, ginger, and garlic.',
      price: 70,
      image: '/images/matar.jpg',
      categoryId: signatureCategory.id,
      isVeg: true,
      isBestSeller: false,
    },
    {
      name: 'Onion Paratha',
      description: 'Finely chopped crispy onions seasoned with carom seeds (ajwain) and traditional spices.',
      price: 60,
      image: '/images/onion.jpg',
      categoryId: signatureCategory.id,
      isVeg: true,
      isBestSeller: false,
    },
    {
      name: 'Mixed Veg Paratha',
      description: 'A delicious assortment of potatoes, carrots, beans, peas, and paneer stuffed in crispy dough.',
      price: 60,
      image: '/images/mix_veg.jpg',
      categoryId: signatureCategory.id,
      isVeg: true,
      isBestSeller: true,
    },
    {
      name: 'Sattu Paratha',
      description: 'Traditional roasted gram flour (sattu) stuffed with pickle spices, mustard oil, garlic, and green chillies.',
      price: 60,
      image: '/images/sattu.jpg',
      categoryId: signatureCategory.id,
      isVeg: true,
      isBestSeller: false,
    },
    {
      name: 'Aloo Methi Paratha',
      description: 'An aromatic blend of fenugreek leaves and seasoned mashed potatoes stuffed inside our golden flatbread.',
      price: 60,
      image: '/images/aloo_methi.jpg',
      categoryId: signatureCategory.id,
      isVeg: true,
      isBestSeller: false,
    },

    // Traditional Specials
    {
      name: 'Kachori Aloo Curry',
      description: 'Crispy, flaky khasta kachoris served with dry-spiced hot tangy potato curry and sweet-sour chutney.',
      price: 60,
      image: '/images/kachori_aloo.jpg',
      categoryId: traditionalCategory.id,
      isVeg: true,
      isBestSeller: false,
    },
    {
      name: 'Chola Puri',
      description: 'Piping hot, fluffy puffed fried puris served with traditional spicy Punjabi chole curry and pickles.',
      price: 60,
      image: '/images/chola_puri.jpg',
      categoryId: traditionalCategory.id,
      isVeg: true,
      isBestSeller: true,
    },
    {
      name: 'Litti Chokha',
      description: 'Authentic roasted wheat flour balls stuffed with spiced sattu, served with mashed eggplant and potato chokha.',
      price: 60,
      image: '/images/litti_chokha.jpg',
      categoryId: traditionalCategory.id,
      isVeg: true,
      isBestSeller: true,
    },

    // Add-ons
    {
      name: 'Pickle',
      description: 'Spicy and sour mixed pickle prepared using authentic spices and mustard oil.',
      price: 10,
      image: '/images/pickle.jpg',
      categoryId: addonsCategory.id,
      isVeg: true,
      isBestSeller: false,
    },
    {
      name: 'Butter',
      description: 'Chilled white butter. The essential melting glaze for every paratha.',
      price: 15,
      image: '/images/butter.jpg',
      categoryId: addonsCategory.id,
      isVeg: true,
      isBestSeller: true,
    },
    {
      name: 'Curd',
      description: 'Fresh thick creamy yogurt. Perfect cooling side for hot parathas.',
      price: 15,
      image: '/images/curd.jpg',
      categoryId: addonsCategory.id,
      isVeg: true,
      isBestSeller: true,
    },
    {
      name: 'Green Chutney',
      description: 'Home-made tangy green chutney prepared with coriander, mint, lemon juice, and spices.',
      price: 10,
      image: '/images/green_chutney.jpg',
      categoryId: addonsCategory.id,
      isVeg: true,
      isBestSeller: false,
    },
  ];

  for (const product of products) {
    await prisma.product.create({
      data: product,
    });
  }
  console.log('Products seeded.');

  // 5. Create Coupons
  await prisma.coupon.create({
    data: {
      code: 'FIRSTORDER',
      discountType: 'PERCENTAGE',
      discountValue: 15, // 15% off
      minOrderValue: 150,
      isActive: true,
    },
  });

  await prisma.coupon.create({
    data: {
      code: 'FLAT50',
      discountType: 'FIXED',
      discountValue: 50, // Rs. 50 off
      minOrderValue: 250,
      isActive: true,
    },
  });

  await prisma.coupon.create({
    data: {
      code: 'FREESHIP',
      discountType: 'FIXED',
      discountValue: 30, // waives delivery charge
      minOrderValue: 100,
      isActive: true,
    },
  });
  console.log('Coupons seeded.');

  console.log('Official seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
