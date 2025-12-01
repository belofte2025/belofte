import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function findSales() {
  try {
    // First, find all sales for pakogina to see what dates exist
    const allPakoginaSales = await prisma.sale.findMany({
      where: {
        customer: {
          customerName: {
            contains: 'pakogina',
            mode: 'insensitive'
          }
        }
      },
      include: {
        customer: {
          select: {
            customerName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('All Pakogina sales dates:');
    for (const sale of allPakoginaSales) {
      console.log(' -', sale.createdAt.toISOString(), '| Total: ₵' + sale.totalAmount.toFixed(2));
    }
    console.log('\n');

    const sales = await prisma.sale.findMany({
      where: {
        customer: {
          customerName: {
            contains: 'pakogina',
            mode: 'insensitive'
          }
        },
        createdAt: {
          gte: new Date('2025-11-24T00:00:00.000Z'),
          lte: new Date('2025-11-26T23:59:59.999Z')
        }
      },
      include: {
        customer: {
          select: {
            customerName: true,
            phone: true
          }
        },
        items: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log('Found', sales.length, 'sales for Pakogina Company between Nov 24-26, 2025:\n');

    for (const sale of sales) {
      console.log('-------------------------------------------');
      console.log('Sale ID:', sale.id);
      console.log('Customer:', sale.customer.customerName);
      console.log('Date:', sale.createdAt.toISOString().split('T')[0]);
      console.log('Sale Type:', sale.saleType);
      console.log('Subtotal: ₵', sale.subtotal.toFixed(2));
      if (sale.discountType && sale.discountValue > 0) {
        console.log('Discount:', sale.discountType === 'percentage' ? sale.discountValue + '%' : '₵' + sale.discountValue);
      }
      console.log('Total: ₵', sale.totalAmount.toFixed(2));
      console.log('Items:');
      for (const item of sale.items) {
        console.log('  -', item.itemName, 'x', item.quantity, '@ ₵' + item.unitPrice.toFixed(2), '= ₵' + (item.quantity * item.unitPrice).toFixed(2));
      }
    }

    if (sales.length > 0) {
      const grandTotal = sales.reduce((sum, s) => sum + s.totalAmount, 0);
      console.log('\n-------------------------------------------');
      console.log('GRAND TOTAL: ₵', grandTotal.toFixed(2));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findSales();
