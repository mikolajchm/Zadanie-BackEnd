const express = require('express');
const basicAuth = require('express-basic-auth');
const cron = require('node-cron');
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
const {
  fetchOrders,
  processOrders,
  getAllProcessedOrders,
  getOrderById
} = require('./ordersService');

const app = express();
const PORT = 3000;

app.use(basicAuth({
  users: { admin: 'password' },
  challenge: true
}));

const csvStringifier = createCsvStringifier({
  header: [
    { id: 'orderID', title: 'Order ID' },
    { id: 'orderWorth', title: 'Order Worth' },
    { id: 'products', title: 'Products' }
  ]
});

app.get('/orders', (req, res) => {
  const min = parseFloat(req.query.minWorth) || 0;
  const max = parseFloat(req.query.maxWorth) || Number.MAX_SAFE_INTEGER;

  const orders = getAllProcessedOrders().filter(o =>
    o.orderWorth >= min && o.orderWorth <= max
  );
 
  const records = orders.map(o => ({
    orderID: o.orderID,
    orderWorth: o.orderWorth,
    products: o.products.map(p => `ID:${p.productID} quantity${p.quantity}`).join('; ')
  }));

  const header = csvStringifier.getHeaderString();
  const body = csvStringifier.stringifyRecords(records);
  const csv = header + body;

  res.header('Content-Type', 'text/csv');
  res.attachment('orders.csv');
  res.send(csv);
});

app.get('/orders/:id', (req, res) => {
  const order = getOrderById(req.params.id);
  if (!order) return res.status(404).send({ message: 'Order not found' });
  res.json(order);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  updateData();
});

async function updateData() {
  try {
    console.log('Fetching orders...');
    await fetchOrders();
    processOrders();
    console.log('Orders updated!');
  } catch (err) {
    console.error('Error:', err);
  }
}

cron.schedule('0 1 * * *', updateData);