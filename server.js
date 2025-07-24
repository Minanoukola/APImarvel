const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger-output.json');
const fs = require('fs');

const DB_NAME = "pwm";
const uri = "mongodb+srv://mina:mina4142mi@prova.ifrr5ia.mongodb.net/?retryWrites=true&w=majority&appName=prova";
const client = new MongoClient(uri);

let rawUsers = fs.readFileSync('users.json');
let registredUsers = JSON.parse(rawUsers);

const app = express();
app.use(express.json()); 
app.use(cors());  

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument)); 
const port = 3002;

function updateFile() {
    fs.writeFileSync("users.json", JSON.stringify(registredUsers)); 
}

async function loginUser(res, body) {
    if (body.email === undefined) {
        res.status(400).send("Email Mancante");
        return;
    }
    if (body.password === undefined) {
        res.status(400).send("Password Mancante");
        return;
    }
    const pwmClient = await client.connect();
    var user = await pwmClient.db("pwm").collection("user").findOne({
        email: body.email,
        password: body.password,
        
    });
    await pwmClient.close();
    
    if (!user) {
        res.status(401).send("Login Errato");
    } else {
        res.json({ id: user._id });
    }
}
async function addUser(res, user) {
    
    if (user.name && user.surname && user.email && user.password) {
        
        if (user.name.length < 3) {
            res.status(400).send("Nome troppo corto o mancante");
            return;
        }
        if (user.surname.length < 3) {
            res.status(400).send("Cognome troppo corto o mancante");
            return;
        }
        if(user.email.length<3){
            res.status(400).send("email non valida");
            return;
        }
        if (user.password.length < 8) {
            res.status(400).send("Password troppo corta o mancante");
            return;
        }
    } else {
        res.status(400).send("Campi assenti");
        return;
    }

    const pwmClient = await client.connect();
    user.hero_prefer = [];
    user.autori_prefer = [];
    user.fumetti_prefer = [];
    user.album = [];
    user.crediti = 0;
    try {
       
        await pwmClient.db(DB_NAME).collection("user").insertOne(user);
        res.status(201).json(user);
    } catch (e) {
        if (e.code == 11000) {
            res.status(400).json({ error: "Email già utilizzata" });
        } else {
            res.status(500).json({ error: `Errore Generico: ${e.code}` });
        }
    } finally {
        await pwmClient.close();
    }
}

async function addToAlbumWithQuantity(res, body, id) {
    if (!ObjectId.isValid(id)) {
        res.status(400).json({ error: "ID utente non valido" });
        return;
    }

    if (!Array.isArray(body.carte) || body.carte.length === 0) {
        res.status(400).json({ error: "Lista carte non valida o vuota" });
        return;
    }

    const pwmClient = await client.connect();
    try {
        const userId = new ObjectId(id);
        const user = await pwmClient.db(DB_NAME).collection("user").findOne({ _id: userId });
        if (!user) {
            res.status(404).json({ error: "Utente non trovato" });
            return;
        }

        const album = user.album || [];

        
        const conteggio = {};
        body.carte.forEach(id => {
            conteggio[id] = (conteggio[id] || 0) + 1;
        });

        
        for (const [id, qty] of Object.entries(conteggio)) {
            const numId = parseInt(id);
            const esistente = album.find(c => c.id === numId);
            if (esistente) {
                esistente.quantita += qty;
            } else {
                album.push({ id: numId, quantita: qty });
            }
        }

        
        await pwmClient.db(DB_NAME).collection("user").updateOne(
            { _id: userId },
            { $set: { album: album } }
        );

        res.status(200).json({ message: "Album aggiornato con quantità", album: album });
    } catch (error) {
        console.error("Errore aggiornamento album:", error);
        res.status(500).json({ error: "Errore del server" });
    } finally {
        await pwmClient.close();
    }
}

app.post('/user/:id/album', async (req, res) => {
    const id = req.params.id;
    const body = req.body;
    console.log("Salvataggio carte con quantità per utente:", id);
    await addToAlbumWithQuantity(res, body, id);
});


app.post('/login', async function (req, res) {
    console.log("Request POST ricevuto su /login");  
    let body = req.body;
    await loginUser(res, body);
});

app.post("/market", async (req, res) => {
    const { id, venditoreId } = req.body;
  
    if (!id || !venditoreId) {
      return res.status(400).json({ error: "ID carta o venditore mancante" });
    }
  
    const localClient = new MongoClient(uri); 
    try {
      await localClient.connect(); 
  
      const db = localClient.db(DB_NAME);
  
      const esiste = await db.collection("market").findOne({ id: parseInt(id) });
  
      if (esiste) {
        return res.status(400).json({ error: "Carta già in vendita" });
      }
  
      await db.collection("market").insertOne({
        id: parseInt(id),
        venditoreId: venditoreId
      });
  
      res.status(201).json({ message: "Carta messa in vendita" });
    } catch (error) {
      console.error("Errore nella vendita:", error);
      res.status(500).json({ error: "Errore del server" });
    } finally {
      await localClient.close(); 
    }
  });


app.post("/acquista", async (req, res) => {
    const { cardId, acquirenteId } = req.body;
  
    if (!cardId || !acquirenteId) {
      return res.status(400).json({ error: "Dati mancanti" });
    }
  
    const pwmClient = await client.connect();
    try {
      const db = pwmClient.db(DB_NAME);
      const cardEntry = await db.collection("market").findOne({ id: parseInt(cardId) });
  
      if (!cardEntry) {
        return res.status(404).json({ error: "Carta non trovata nel mercato" });
      }
  
      const venditoreId = cardEntry.venditoreId;
      const acqId = new ObjectId(acquirenteId);
      const vendId = new ObjectId(venditoreId);
  
      const acqUser = await db.collection("user").findOne({ _id: acqId });
      const vendUser = await db.collection("user").findOne({ _id: vendId });
  
      if (!acqUser || !vendUser) {
        return res.status(404).json({ error: "Utente non trovato" });
      }
  
      
      if ((acqUser.crediti || 0) < 1) {
        return res.status(400).json({ error: "Crediti insufficienti" });
      }
  
      
      await db.collection("market").deleteOne({ id: parseInt(cardId) });
  
     
      const albumAcq = acqUser.album || [];
      const esiste = albumAcq.find(c => c.id === parseInt(cardId));
      if (esiste) {
        esiste.quantita += 1;
      } else {
        albumAcq.push({ id: parseInt(cardId), quantita: 1 });
      }
  
      
      const nuovoAlbumVend = (vendUser.album || []).reduce((acc, carta) => {
        if (carta.id === parseInt(cardId)) {
          if (carta.quantita > 1) {
            acc.push({ id: carta.id, quantita: carta.quantita - 1 });
          }
          
        } else {
          acc.push(carta);
        }
        return acc;
      }, []);
  
      
      await db.collection("user").updateOne(
        { _id: acqId },
        { $set: { album: albumAcq, crediti: (acqUser.crediti || 0) - 1 } }
      );
  
      await db.collection("user").updateOne(
        { _id: vendId },
        {
          $set: { album: nuovoAlbumVend },
          $inc: { crediti: 1 } 
        }
      );
  
      res.json({
        message: "Acquisto completato",
        nuovoCredito: (acqUser.crediti || 0) - 1
      });
    } catch (err) {
      console.error("Errore acquisto:", err);
      res.status(500).json({ error: "Errore server" });
    } finally {
      await pwmClient.close();
    }
  });

app.post("/user/:id/crediti", async (req, res) => {
    const { id } = req.params;
    const { creditiDaAggiungere } = req.body;
  
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID utente non valido" });
    }
  
    const pwmClient = await client.connect();
    try {
      const db = pwmClient.db("pwm");
      const user = await db.collection("user").findOne({ _id: new ObjectId(id) });
      if (!user) return res.status(404).json({ error: "Utente non trovato" });
  
      await db.collection("user").updateOne(
        { _id: new ObjectId(id) },
        { $inc: { crediti: parseFloat(creditiDaAggiungere) } }
      );
  
      const updatedUser = await db.collection("user").findOne({ _id: new ObjectId(id) });
      res.json({ message: "Crediti aggiornati", crediti: updatedUser.crediti });
    } catch (err) {
      console.error("Errore aggiornamento crediti:", err);
      res.status(500).json({ error: "Errore server" });
    } finally {
      await pwmClient.close();
    }
});



app.get('/user/:id', async (req, res) => {
  const userId = req.params.id;

  if (!ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "ID utente non valido" });
  }

  const localClient = new MongoClient(uri);
  try {
    await localClient.connect();

    const user = await localClient
      .db(DB_NAME)
      .collection("user")
      .findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    res.json(user);
  } catch (error) {
    console.error("Errore nella rotta /user/:id:", error);
    res.status(500).json({ error: "Errore del server" }); 
  } finally {
    await localClient.close();
  }
});

app.get("/market", async (req, res) => {
    try {
      const pwmClient = await client.connect();
      const marketCards = await pwmClient
        .db("pwm") 
        .collection("market")
        .find({})
        .toArray();
  
      res.json(marketCards);
      await pwmClient.close();
    } catch (error) {
      console.error("Errore nella rotta /market:", error);
      res.status(500).json({ error: "Errore del server" });
    }
  });


async function addUserFav(res, body, id) {
    const { ObjectId } = require('mongodb');  

    
    if (!ObjectId.isValid(id)) {
        res.status(400).json({ error: "ID utente non valido" });
        return;
    }

    
    if (!body.preferito) {
        res.status(400).json({ error: "Hero non valido o mancante" });
        return;
    }

    const pwmClient = await client.connect();
    try {
        const userId = new ObjectId(id);  
        const heroId = body.preferito;    

        
        const result = await pwmClient.db(DB_NAME).collection("user").updateOne(
            { _id: userId },
            { $addToSet: { hero_prefer: heroId } } 
        );

        
        if (result.matchedCount === 0) {
            res.status(404).json({ error: "Utente non trovato" });
            return;
        }

        const updatedUser = await pwmClient.db(DB_NAME).collection("user").findOne({ _id: userId });
        res.status(201).json(updatedUser); 
    } catch (error) {
        console.error("Errore durante l'aggiunta ai preferiti:", error);
        res.status(500).json({ error: "Errore del server" });
    } finally {
        await pwmClient.close();
    }
}
app.post("/register", function (req, res) {
    addUser(res, req.body);
    console.log(registredUsers);
   
});


app.post('/user/:id/fav', async (req, res) => {
    const id = req.params.id;
    const body = req.body;
    console.log("Aggiungi preferito per utente ID:", id, "Con dati:", body);
    await addUserFav(res, body, id);
});

app.post("/scambi/:id/accetta", async (req, res) => {
  const scambioId = req.params.id;
  const userId = req.body.userId; 

  if (!ObjectId.isValid(scambioId) || !ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "ID non valido" });
  }

  const localClient = new MongoClient(uri);
  try {
    await localClient.connect();
    const db = localClient.db(DB_NAME);

    const scambio = await db.collection("scambi").findOne({ _id: new ObjectId(scambioId) });
    if (!scambio) return res.status(404).json({ error: "Scambio non trovato" });

    const proponente = await db.collection("user").findOne({ _id: new ObjectId(scambio.proponenteId) });
    const destinatario = await db.collection("user").findOne({ _id: new ObjectId(userId) });

    if (!proponente || !destinatario) {
      return res.status(404).json({ error: "Utenti non trovati" });
    }

    
    const haCartaRichiesta = (destinatario.album || []).some(c => c.id === scambio.cartaRichiesta && c.quantita > 0);
    if (!haCartaRichiesta) {
      return res.status(400).json({ error: "Non possiedi la carta richiesta" });
    }


    const albumProponente = (proponente.album || []).map(c =>
      c.id === scambio.cartaOfferta ? { ...c, quantita: c.quantita - 1 } : c
    ).filter(c => c.quantita > 0);
    const esisteRichiesta = albumProponente.find(c => c.id === scambio.cartaRichiesta);
    if (esisteRichiesta) {
      esisteRichiesta.quantita += 1;
    } else {
      albumProponente.push({ id: scambio.cartaRichiesta, quantita: 1 });
    }

    
    const albumDestinatario = (destinatario.album || []).map(c =>
      c.id === scambio.cartaRichiesta ? { ...c, quantita: c.quantita - 1 } : c
    ).filter(c => c.quantita > 0);
    const esisteOfferta = albumDestinatario.find(c => c.id === scambio.cartaOfferta);
    if (esisteOfferta) {
      esisteOfferta.quantita += 1;
    } else {
      albumDestinatario.push({ id: scambio.cartaOfferta, quantita: 1 });
    }

    
    await db.collection("user").updateOne(
      { _id: proponente._id },
      { $set: { album: albumProponente } }
    );

    await db.collection("user").updateOne(
      { _id: destinatario._id },
      { $set: { album: albumDestinatario } }
    );

    await db.collection("scambi").updateOne(
      { _id: new ObjectId(scambioId) },
      { $set: { stato: "accettato" } }
    );

    res.json({ message: "Scambio completato con successo" });
  } catch (err) {
    console.error("Errore accettazione scambio:", err);
    res.status(500).json({ error: "Errore server" });
  } finally {
    await localClient.close();
  }
});



app.get("/scambi", async (req, res) => {
  const localClient = new MongoClient(uri);
  try {
    await localClient.connect();
    const db = localClient.db(DB_NAME);

    const scambi = await db.collection("scambi").find({}).toArray();
    res.json(scambi);
  } catch (err) {
    console.error("Errore nel recupero scambi:", err);
    res.status(500).json({ error: "Errore server" });
  } finally {
    await localClient.close();
  }
});






app.post("/scambi/:id/rifiuta", async (req, res) => {
  const scambioId = req.params.id;

  if (!ObjectId.isValid(scambioId)) {
    return res.status(400).json({ error: "ID scambio non valido" });
  }

  const localClient = new MongoClient(uri);
  try {
    await localClient.connect();
    const db = localClient.db(DB_NAME);

    await db.collection("scambi").updateOne(
      { _id: new ObjectId(scambioId) },
      { $set: { stato: "rifiutato" } }
    );

    res.json({ message: "Scambio rifiutato" });
  } catch (err) {
    console.error("Errore rifiuto scambio:", err);
    res.status(500).json({ error: "Errore server" });
  } finally {
    await localClient.close();
  }
});
app.post("/scambi", async (req, res) => {
  const { proponenteId, cartaOfferta, cartaRichiesta } = req.body;

  if (!proponenteId || !cartaOfferta || !cartaRichiesta) {
    return res.status(400).json({ error: "Dati mancanti per lo scambio" });
  }

  const localClient = new MongoClient(uri);
  try {
    await localClient.connect();
    const db = localClient.db(DB_NAME);

    const result = await db.collection("scambi").insertOne({
      proponenteId,
      cartaOfferta: parseInt(cartaOfferta),
      cartaRichiesta: parseInt(cartaRichiesta),
      stato: "in_attesa"  
    });

    res.status(201).json({ message: "Scambio proposto con successo", id: result.insertedId });
  } catch (err) {
    console.error("Errore proposta scambio:", err);
    res.status(500).json({ error: "Errore durante la proposta" });
  } finally {
    await localClient.close();
  }
});
app.put('/user/:id', async (req, res) => {
  const { id } = req.params;
  const { name, surname, email, password } = req.body;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "ID utente non valido" });
  }

  const pwmClient = await client.connect();
  try {
    const db = pwmClient.db(DB_NAME);
    const userCollection = db.collection("user");

    
    const existingUser = await userCollection.findOne({ _id: new ObjectId(id) });
    if (!existingUser) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    
    if (email && email !== existingUser.email) {
      const emailInUse = await userCollection.findOne({ email: email });
      if (emailInUse) {
        return res.status(400).json({ error: "Email già in uso da un altro utente" });
      }
    }

    
    const updateFields = {};
    if (name) updateFields.name = name;
    if (surname) updateFields.surname = surname;
    if (email) updateFields.email = email;
    if (password) updateFields.password = password;

   
    await userCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    const updatedUser = await userCollection.findOne({ _id: new ObjectId(id) });
    res.json({ message: "Utente aggiornato", user: updatedUser });

  } catch (err) {
    console.error("Errore aggiornamento utente:", err);
    res.status(500).json({ error: "Errore del server" });
  } finally {
    await pwmClient.close();
  }
});

app.delete('/user/:id', async (req, res) => {
  const userId = req.params.id;

  if (!ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "ID non valido" });
  }

  const localClient = new MongoClient(uri);

  try {
    await localClient.connect();
    const db = localClient.db(DB_NAME);

    const result = await db.collection('user').deleteOne({ _id: new ObjectId(userId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    
    await db.collection('scambi').deleteMany({ proponenteId: userId });
    await db.collection('market').deleteMany({ venditoreId: userId });
    

    res.json({ message: "Account eliminato correttamente" });
  } catch (err) {
    console.error("Errore eliminazione utente:", err);
    res.status(500).json({ error: "Errore server" });
  } finally {
    await localClient.close();
  }
});

app.post('/user/:id/add-autore', async (req, res) => {
  const userId = req.params.id;
  const { autoreId } = req.body;

  if (!ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "ID utente non valido" });
  }
  if (!autoreId) {
    return res.status(400).json({ error: 'ID autore mancante' });
  }

  const pwmClient = await client.connect();
  const db = pwmClient.db(DB_NAME);

  try {
    const user = await db.collection('user').findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });

    if (!user.autori_prefer) user.autori_prefer = [];

    if (!user.autori_prefer.includes(autoreId)) {
      user.autori_prefer.push(autoreId);
      await db.collection('user').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { autori_prefer: user.autori_prefer } }
      );
    }

    res.json({ success: true, autori_prefer: user.autori_prefer });
  } catch (err) {
    console.error("Errore nel salvataggio autore:", err);
    res.status(500).json({ error: "Errore server" });
  } finally {
    await pwmClient.close();
  }
});


app.post('/user/:id/fumetto-preferito', async (req, res) => {
  const userId = req.params.id;
  const { fumettoId } = req.body;

  if (!ObjectId.isValid(userId) || !fumettoId) {
    return res.status(400).json({ error: "Dati non validi" });
  }

  const pwmClient = await client.connect();
  const db = pwmClient.db(DB_NAME);

  try {
    const user = await db.collection("user").findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ error: "Utente non trovato" });

    if ((user.fumetti_prefer || []).includes(fumettoId)) {
      return res.status(400).json({ error: "Fumetto già nei preferiti" });
    }

    await db.collection("user").updateOne(
      { _id: new ObjectId(userId) },
      { $addToSet: { fumetti_prefer: fumettoId } }
    );

    res.json({ message: "Fumetto aggiunto ai preferiti!" });
  } catch (err) {
    console.error("Errore salvataggio fumetto preferito:", err);
    res.status(500).json({ error: "Errore del server" });
  } finally {
    await pwmClient.close();
  }
});

app.delete("/market/:cardId/:venditoreId", async (req, res) => {
  const { cardId, venditoreId } = req.params;

  const localClient = new MongoClient(uri);
  try {
    await localClient.connect();
    const db = localClient.db(DB_NAME);

    const result = await db.collection("market").deleteOne({
      id: parseInt(cardId),
      venditoreId: venditoreId
    });

    if (result.deletedCount === 1) {
      res.json({ message: "Carta rimossa dal mercato" });
    } else {
      res.status(404).json({ error: "Carta non trovata o non sei il venditore" });
    }
  } catch (err) {
    console.error("Errore durante la rimozione:", err);
    res.status(500).json({ error: "Errore del server" });
  } finally {
    await localClient.close();
  }
});

app.delete('/scambi/:id', async (req, res) => {
  const scambioId = req.params.id;

  if (!ObjectId.isValid(scambioId)) {
    return res.status(400).json({ error: "ID scambio non valido" });
  }

  const localClient = new MongoClient(uri); 
  try {
    await localClient.connect();
    const db = localClient.db(DB_NAME);

    const result = await db.collection('scambi').deleteOne({ _id: new ObjectId(scambioId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Scambio non trovato" });
    }

    res.json({ message: "Scambio eliminato con successo" });
  } catch (err) {
    console.error("Errore eliminazione scambio:", err);
    res.status(500).json({ error: "Errore server" });
  } finally {
    await localClient.close(); 
  }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`PWM porta in ascolto: ${port}`);
});