const express = require("express");
const bodyParser = require("body-parser");
const AIMLInterpreter = require('aiml-high');
const AIMLInterpreter2 = require('aiml-high2');
const session = require('express-session');
const app = express();
const port = 3000; // specifica la porta del server
const hostname = 'localhost'; // specifica l'hostname del server
const fs = require('fs');
const path = require('path');
const csv = require("csv-stringify");

const homepageABC = 'homepageABC.html'
const diagrampageABC = 'diagramABC.html'
const chatbotpageABC = 'chatbotABC.html'
const chatbotpageaimlABC = 'novagraphABCv2.0.aiml.xml'

const homepageXYZ = 'homepageXYZ.html'
const diagrampageXYZ = 'diagramXYZ.html'
const chatbotpageXYZ = 'chatbotXYZ.html'
const chatbotpageaimlXYZ = 'novagraphXYZv2.0.aiml.xml'

// Configura body-parser per gestire i dati del form
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/static", express.static(path.join(__dirname, 'public')));

// Configura la sessione per memorizzare la storia delle domande e risposte
app.use(session({
  secret: 'mysecretkey',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 3600000 // durata del cookie in millisecondi (1 ora)
  }
}));


// Pulisce l'input dell'utente dei caratteri speciali
function cleanString(inputString) {
  const outputString = inputString
    .normalize("NFD") // Decomposizione dei caratteri accentati in caratteri base + diacritici
    .replace(/[\u0300-\u036f]/g, "") // Rimozione dei diacritici
    .replace(/[^\w\s]/g, " ") // Rimozione dei caratteri di punteggiatura e sostituzione con spazi
    .replace(/\s+/g, " "); // Rimozione degli spazi multipli consecutivi
  return outputString;
}

// Ottenere data della richiesta
function getDate() {
  const dateObject = new Date();
  // current date
  // adjust 0 before single digit date
  const date = (`0 ${dateObject.getDate()}`).slice(-2);
  // current month
  const month = (`0 ${dateObject.getMonth() + 1}`).slice(-2);
  // current year
  const year = dateObject.getFullYear();
  // current hours
  const hours = dateObject.getHours();
  // current minutes
  const minutes = dateObject.getMinutes();
  // current seconds
  const seconds = dateObject.getSeconds();

  return year+"-"+month+"-"+date+" "+hours+":"+minutes+":"+seconds;
}


// Definisci la route per la homepage ABC
app.get("//homepageABC.html", (req, res) => {
  fs.readFile(path.join(__dirname, 'public', homepageABC), (err, data) => {
    if (err) {
      // Gestisci eventuali errori
      res.writeHead(500);
      res.end('Errore nel caricamento della pagina');
    } else {
      let html = data.toString();
      html = html.replace('<h5 class="text-center display-6"></h5>', '<h5 class="text-center display-6"> <b> Your CodeID: </b>' + req.session.id.substring(0, 5) + '</h5>')
      // Invia la pagina HTML al client
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    }
  });
});

// Definisci la route per la homepage XYZ
app.get("//homepageXYZ.html", (req, res) => {
  fs.readFile(path.join(__dirname, 'public', homepageXYZ), (err, data) => {
    if (err) {
      // Gestisci eventuali errori
      res.writeHead(500);
      res.end('Errore nel caricamento della pagina');
    } else {
      let html = data.toString();
      html = html.replace('<h5 class="text-center display-6"></h5>', '<h5 class="text-center display-6"> <b> Your CodeID: </b>' + req.session.id.substring(0, 5) + '</h5>')
      // Invia la pagina HTML al client
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    }
  });
});

// Definisci la route per la pagina state table ABC
app.get("//diagramABC.html", (req, res) => {
  fs.readFile(path.join(__dirname, 'public', diagrampageABC), (err, data) => {
    if (err) {
      // Gestisci eventuali errori
      res.writeHead(500);
      res.end('Errore nel caricamento della pagina');
    } else {
      // Invia la pagina HTML al client
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    }
  });
});

// Definisci la route per la pagina state table XYZ
app.get("//diagramXYZ.html", (req, res) => {
  fs.readFile(path.join(__dirname, 'public', diagrampageXYZ), (err, data) => {
    if (err) {
      // Gestisci eventuali errori
      res.writeHead(500);
      res.end('Errore nel caricamento della pagina');
    } else {
      let html = data.toString();
      html = html.replace('<h5 class="text-center display-6"></h5>', '<h5 class="text-center display-6"> <b> Your CodeID: </b>' + req.session.id.substring(0, 5) + '</h5>')
      // Invia la pagina HTML al client
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    }
  });
});

// Definisci la route per il chatbot ABC
app.get("//chatbotABC.html", (req, res) => {
  fs.readFile(path.join(__dirname, 'public', chatbotpageABC), (err, data) => {
    if (err) {
      // Gestisci eventuali errori
      res.writeHead(500);
      res.end('Errore nel caricamento della pagina');
    } else {
      // Aggiungi l'history all'HTML prima di inviarlo al client
      let html = data.toString();
      if (req.session.history) {
        let historyHtml = '';
        let counter = req.session.history.length;
        req.session.history.slice().reverse().forEach(item => {
          historyHtml += '<tr><td>' + counter + '</td><td>' + item.query + '</td><td>' + item.answer + '</td></tr>';
          counter--;
        });
        html = html.replace('</tbody>', historyHtml + '</tbody>');
      }
      // Invia la pagina HTML al client con l'history aggiunta
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    }
  });
});

// Definisci operazioni per la route per il chatbot ABC
app.post("//chatbotABC.html", async (req, res) => {
  // Ricevi la query dal client
  let query = req.body.query;
  try {
    var aimlInterpreterABC = new AIMLInterpreter({ name: 'NovagraphV1.4ABC' });
    await aimlInterpreterABC.loadFiles([path.join(__dirname, 'public', chatbotpageaimlABC)]);

    // Chiamata asincrona per trovare la risposta
    aimlInterpreterABC.findAnswer(cleanString(query), (answer, wildCardArray, input) => {
      req.session.history = req.session.history || [];
      req.session.history.push({ query: query, answer: answer });
      console.log(answer + ' | ' + wildCardArray + ' | ' + input);
      csv.stringify([[req.session.id, input, answer, wildCardArray, getDate(), 'typeABC']], (err, output) => {
        fs.appendFileSync("interactionsABC.csv", output);
      });
      // Invia la risposta al client
      res.json({ query: query, answer: answer });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Errore durante l'elaborazione della richiesta");
  }
});


// Definisci la route per il chatbot XYZ
app.get("//chatbotXYZ.html", (req, res) => {
  fs.readFile(path.join(__dirname, 'public', chatbotpageXYZ), (err, data) => {
    if (err) {
      // Gestisci eventuali errori
      res.writeHead(500);
      res.end('Errore nel caricamento della pagina');
    } else {
      // Aggiungi l'history all'HTML prima di inviarlo al client
      let html = data.toString();
      html = html.replace('<h5 class="text-center display-6"></h5>', '<h5 class="text-center display-6"> <b> Your CodeID: </b>' + req.session.id.substring(0, 5) + '</h5>')
      if (req.session.history2) {
        let historyHtml = '';
        let counter = req.session.history2.length;
        req.session.history2.slice().reverse().forEach(item => {
          historyHtml += '<tr><td>' + counter + '</td><td>' + item.query + '</td><td>' + item.answer + '</td></tr>';
          counter--;
        });
        html = html.replace('</tbody>', historyHtml + '</tbody>');
      }
      // Invia la pagina HTML al client con l'history aggiunta
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    }
  });
});

// Definisci operazioni per la route per il chatbot XYZ
app.post("//chatbotXYZ.html", async (req, res) => {
  // Ricevi la query dal client
  let query = req.body.query;
  try {
    var aimlInterpreterXYZ = new AIMLInterpreter2({ name: 'NovagraphV1.4XYZ' });
    await aimlInterpreterXYZ.loadFiles([path.join(__dirname, 'public', chatbotpageaimlXYZ)]);

    // Chiamata asincrona per trovare la risposta
    aimlInterpreterXYZ.findAnswer(cleanString(query), (answer, wildCardArray, input) => {
      req.session.history2 = req.session.history2 || [];
      req.session.history2.push({ query: query, answer: answer });
      console.log(answer + ' | ' + wildCardArray + ' | ' + input);
      csv.stringify([[req.session.id, input, answer, wildCardArray, getDate(), 'typeXYZ']], (err, output) => {
        fs.appendFileSync("interactionsXYZ.csv", output);
      });
      // Invia la risposta al client
      res.json({ query: query, answer: answer });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Errore durante l'elaborazione della richiesta");
  }
});

app.get("*", (req, res) => {
  console.log("Pagina non trovata");
  res.status(404).send("Pagina non trovata");
});

app.listen(port, hostname, () => {
  console.log(`Il server è in ascolto su http://${hostname}:${port}/`);
});
