const swaggerAutogen = require('swagger-autogen')({openapi: '3.0.0'});

const doc = {
  info: {
    title: 'Gestione Utenti',
    description: 'Una semplice API per la gestione degli utenti'
  },
  components: {
    schemas:{
        userSchema:{
            $name: 'mina',
            $surname: 'noukola',
            $password: 'password',
            email: 'minanoukola@unimi.it',
            $film_preferiti: []
        }
    }
  },
  host: 'localhost:3000'
};

const outputFile = './swagger-output.json';
const routes = ['server.js'];

swaggerAutogen(outputFile, routes, doc);