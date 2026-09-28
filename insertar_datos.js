const { MongoClient, ServerApiVersion } = require('mongodb');

// Cadena de conexión a MongoDB Atlas
const uri = "mongodb+srv://stalavo_db_user:Avenged930430@cluster0.ii6pctz.mongodb.net/style_luna_azul?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    console.log("¡Conexión exitosa a MongoDB Atlas!");

    const db = client.db("style_luna_azul");

    // 1. Insertar Usuarios
    const usuarios = db.collection("usuarios");
    await usuarios.insertMany([
      { nombres: "Steven Alexander Aviles", email: "steven@email.com", rol: "admin", estado: true },
      { nombres: "Julio Cesar Porras", email: "julio@email.com", rol: "barbero", estado: true },
      { nombres: "Mildrey Vanetza Celis", email: "mildrey@email.com", rol: "cliente", estado: true }
    ]);
    console.log("-> Colección 'usuarios' poblada.");

    // 2. Insertar Citas
    const citas = db.collection("citas");
    await citas.insertMany([
      {
        cliente: "Mildrey Vanetza Celis",
        barbero: "Julio Cesar Porras",
        servicio: "Corte de cabello y barba",
        precio: 35000,
        fecha: new Date("2026-09-28T10:00:00Z"),
        estado: "confirmada"
      },
      {
        cliente: "Steven Alexander Aviles",
        barbero: "Julio Cesar Porras",
        servicio: "Perfilado de barba",
        precio: 15000,
        fecha: new Date("2026-09-28T11:30:00Z"),
        estado: "pendiente"
      }
    ]);
    console.log("-> Colección 'citas' poblada.");

    // 3. Insertar Inventario
    const inventario = db.collection("inventario");
    await inventario.insertMany([
      { producto: "Cuchillas de afeitar", cantidad: 50, stock_minimo: 10, categoria: "Insumos" },
      { producto: "Cera moldeadora", cantidad: 15, stock_minimo: 5, categoria: "Productos" }
    ]);
    console.log("-> Colección 'inventario' poblada.");

    console.log("\n¡Todos los datos iniciales fueron creados con éxito en Style Luna Azul!");

  } catch (error) {
    console.error("Error al poblar la base de datos:", error);
  } finally {
    await client.close();
  }
}

run();