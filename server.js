const express = require('express');
const basicAuth = require('express-basic-auth');
const cron = require('node-cron');
const { parse } = require('json2csv');
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

app.get('/orders', (req, res) => {
  const min = parseFloat(req.query.minWorth) || 0;
  const max = parseFloat(req.query.maxWorth) || Number.MAX_SAFE_INTEGER;

  const orders = getAllProcessedOrders().filter(o =>
    o.orderWorth >= min && o.orderWorth <= max
  );

  const csv = parse(orders, { fields: ['orderID', 'orderWorth', 'products'] });

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