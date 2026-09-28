const express = require('express');
const path = require('path');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;
const uri = 'mongodb+srv://stalavo_db_user:XLkg1J7y5WRYwdSA@cluster0.ii6pctz.mongodb.net/?appName=Cluster0';

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

app.use(express.static(path.join(__dirname)));
app.use(express.json());

async function connectDB() {
  if (!client.topology || !client.topology.isConnected()) {
    await client.connect();
  }
}

async function getCollections() {
  await connectDB();
  const db = client.db('style_luna_azul');
  return {
    users: db.collection('users'),
    services: db.collection('services'),
    barbers: db.collection('barbers'),
    appointments: db.collection('appointments'),
    inventory: db.collection('inventory'),
    sales: db.collection('sales')
  };
}

async function seedData() {
  const collections = await getCollections();

  const userCount = await collections.users.countDocuments();
  if (userCount === 0) {
    await collections.users.insertMany([
      { email: 'admin@lunaazul.com', password: '1234', role: 'ADMIN', name: 'Steven Avilés' },
      { email: 'mildrey@lunaazul.com', password: '1234', role: 'ADMIN', name: 'Mildrey Celis' },
      { email: 'cesar@lunaazul.com', password: '1234', role: 'ADMIN', name: 'Julio Porras' },
      { email: 'barbero@lunaazul.com', password: '1234', role: 'BARBER', name: 'Alexander Oviedo' },
      { email: 'cliente@lunaazul.com', password: '1234', role: 'CLIENT', name: 'Juan Pérez' }
    ]);
  }

  const serviceCount = await collections.services.countDocuments();
  if (serviceCount === 0) {
    await collections.services.insertMany([
      { name: 'Corte Tradicional', price: 20000 },
      { name: 'Arreglo de Barba', price: 12000 },
      { name: 'Combo Luna Azul', price: 28000 }
    ]);
  }

  const barberCount = await collections.barbers.countDocuments();
  if (barberCount === 0) {
    await collections.barbers.insertMany([
      { name: 'Alexander Oviedo' },
      { name: 'Carlos Barber' }
    ]);
  }

  const appointmentCount = await collections.appointments.countDocuments();
  if (appointmentCount === 0) {
    await collections.appointments.insertMany([
      { id: 101, client: 'Juan Pérez', service: 'Corte Tradicional', barber: 'Alexander Oviedo', datetime: '2026-09-02T10:00', status: 'PENDIENTE' },
      { id: 102, client: 'Mildrey Celis', service: 'Combo Luna Azul', barber: 'Alexander Oviedo', datetime: '2026-09-02T11:30', status: 'COMPLETADA' },
      { id: 103, client: 'Julio Porras', service: 'Arreglo de Barba', barber: 'Carlos Barber', datetime: '2026-09-02T14:00', status: 'PENDIENTE' }
    ]);
  }

  const inventoryCount = await collections.inventory.countDocuments();
  if (inventoryCount === 0) {
    await collections.inventory.insertMany([
      { id: 1, name: 'Cera Peinado Mate', stock: 12, min: 5 },
      { id: 2, name: 'Aceite para Barba', stock: 2, min: 4 },
      { id: 3, name: 'Shampoo Anticaída', stock: 8, min: 3 }
    ]);
  }

  const salesCount = await collections.sales.countDocuments();
  if (salesCount === 0) {
    await collections.sales.insertMany([
      { id: 1, concept: 'Corte Caballero', amount: 20000, payment: 'Efectivo' },
      { id: 2, concept: 'Combo Luna Azul', amount: 28000, payment: 'Transferencia' }
    ]);
  }
}

app.get('/api/data', async (req, res) => {
  try {
    await seedData();
    const collections = await getCollections();

    const [users, services, barbers, appointments, inventory, sales] = await Promise.all([
      collections.users.find({}).toArray(),
      collections.services.find({}).toArray(),
      collections.barbers.find({}).toArray(),
      collections.appointments.find({}).toArray(),
      collections.inventory.find({}).toArray(),
      collections.sales.find({}).toArray()
    ]);

    res.json({ users, services, barbers, appointments, inventory, sales });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al cargar la información de la base de datos.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const collections = await getCollections();
    const user = await collections.users.findOne({ email, password });

    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const safeUser = { id: user._id, email: user.email, role: user.role, name: user.name };
    return res.json({ user: safeUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error en la autenticación.' });
  }
});

app.post('/api/appointments', async (req, res) => {
  try {
    const { client, service, barber, datetime, status } = req.body;
    const collections = await getCollections();
    const nextId = await collections.appointments.countDocuments() + 101;

    const appointment = {
      id: nextId,
      client,
      service,
      barber,
      datetime,
      status: status || 'PENDIENTE'
    };

    const result = await collections.appointments.insertOne(appointment);
    res.status(201).json({ insertedId: result.insertedId, appointment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'No se pudo crear la cita' });
  }
});

app.patch('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const collections = await getCollections();

    const result = await collections.appointments.updateOne({ id: Number(id) }, { $set: { status } });

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'No se pudo actualizar la cita' });
  }
});

app.post('/api/sales', async (req, res) => {
  try {
    const { concept, amount, payment } = req.body;
    const collections = await getCollections();
    const nextId = await collections.sales.countDocuments() + 1;

    const sale = { id: nextId, concept, amount: Number(amount), payment };
    const result = await collections.sales.insertOne(sale);
    res.status(201).json({ insertedId: result.insertedId, sale });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'No se pudo registrar la venta' });
  }
});

app.patch('/api/inventory/:id/reabastecer', async (req, res) => {
  try {
    const { id } = req.params;
    const collections = await getCollections();

    const result = await collections.inventory.updateOne(
      { id: Number(id) },
      { $inc: { stock: 5 } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'No se pudo reabastecer el producto' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

async function startServer() {
  try {
    await connectDB();
    await seedData();
    app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
  } catch (error) {
    console.error('Error al iniciar MongoDB o el servidor:', error);
    process.exit(1);
  }
}

startServer();
