const mongoose = require('mongoose');

const { Schema } = mongoose;

// Connessione al database
mongoose.connect('mongodb://localhost:27017/platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Definizione dello schema Bonus
const bonusSchema = new Schema({
  title: String,
  points: Number,
});

// Creazione del modello Bonus
const Bonus = mongoose.model('Bonus', bonusSchema);

// Funzione per rimuovere i duplicati
async function removeDuplicates() {
  try {
    // Trova tutti i bonus e raggruppali per titolo, mantenendo il primo ID di ogni gruppo
    const groupedBonuses = await Bonus.aggregate([
      {
        $group: {
          _id: '$title',
          firstId: { $first: '$_id' },
        },
      },
    ]);

    // Ottieni gli ID dei bonus da mantenere (non duplicati)
    const idsToKeep = groupedBonuses.map(group => group.firstId);

    // Rimuovi tutti i bonus che non hanno l'ID nei bonus da mantenere
    const result = await Bonus.deleteMany({ _id: { $nin: idsToKeep } });

    console.log('Duplicati rimossi:', result);
  } catch (error) {
    console.error('Errore durante la rimozione dei duplicati:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Esegui la funzione
removeDuplicates();
