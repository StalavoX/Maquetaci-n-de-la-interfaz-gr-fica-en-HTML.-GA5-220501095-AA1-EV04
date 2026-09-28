const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const uri = "mongodb+srv://stalavo_db_user:Avenged930430@cluster0.ii6pctz.mongodb.net/style_luna_azul?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

async function exportarTodo() {
  try {
    await client.connect();
    console.log("Conectado a MongoDB Atlas...");

    const db = client.db("style_luna_azul");
    const colecciones = await db.listCollections().toArray();
    
    const baseDeDatosCompleta = {};

    for (let col of colecciones) {
      const nombre = col.name;
      const documentos = await db.collection(nombre).find({}).toArray();
      baseDeDatosCompleta[nombre] = documentos;
    }

    // Ruta donde se guardará el archivo JSON consolidado
    const rutaDestino = path.join(__dirname, 'base_de_datos_completa.json');
    fs.writeFileSync(rutaDestino, JSON.stringify(baseDeDatosCompleta, null, 2));

    console.log(`\n¡Toda la base de datos se exportó con éxito!`);
    console.log(`Archivo generado en: ${rutaDestino}`);

  } catch (error) {
    console.error("Error al exportar la base de datos:", error);
  } finally {
    await client.close();
  }
}

exportarTodo();