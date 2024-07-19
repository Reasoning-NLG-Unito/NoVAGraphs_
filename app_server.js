const express = require('express');
const app = express();
const port = 3000;
const hostname = 'localhost'; // specifica l'hostname del server

const session = require('express-session');

const bodyParser = require("body-parser");
const AIMLInterpreterEsempio1 = require('aiml-high-novagraphs1');
const AIMLInterpreterEsempio2 = require('aiml-high-novagraphs2');
const AIMLInterpreterEsempio3 = require('aiml-high-novagraphs3');
const AIMLInterpreterEsempio4 = require('aiml-high-novagraphs4');
const AIMLInterpreterEsempio5 = require('aiml-high-novagraphs5');
const AIMLInterpreterEsempio6 = require('aiml-high-novagraphs6');
const AIMLInterpreterEsempio7 = require('aiml-high-novagraphs7');

const AIMLInterpreterTreDominiAutomi = require('aiml-high-novagraphs8');
const AIMLInterpreterTreDominiInsiemi = require('aiml-high-novagraphs9');
const AIMLInterpreterTreDominiCircuiti = require('aiml-high-novagraphs10');

const AIMLInterpreterSperimentazioneAutomiABC = require('aiml-high-novagraphs11');
const AIMLInterpreterSperimentazioneAutomiXYZ = require('aiml-high-novagraphs12');

const fs = require('fs');
const path = require('path');
const csv = require("csv-stringify");

const aiml = {
  // Sperimentazione automi
  'botABC': [
    path.join(__dirname, 'public', 'aiml/sperimentazione_automi/novagraphABC.aiml'),
  ],
  'botXYZ': [
    path.join(__dirname, 'public', 'aiml/sperimentazione_automi/novagraphXYZ.aiml'),
  ],

  // Tre domini
  'botAutomi': [
    path.join(__dirname, 'public', 'aiml/tre_domini/automi/bot.aiml'),
  ],
  'botCircuiti': [
    path.join(__dirname, 'public', 'aiml/tre_domini/circuiti/bot.aiml'),
  ],
  'botInsiemi': [
    path.join(__dirname, 'public', 'aiml/tre_domini/insiemi/bot.aiml'),
  ],

  // Sperimentazione insiemi
  'botEsempio1': [
    path.join(__dirname, 'public', 'aiml/insiemi/esempio1.aiml'),
  ],
  'botEsempio2': [
    path.join(__dirname, 'public', 'aiml/insiemi/esempio2.aiml'),
  ],
  'botEsempio3': [
    path.join(__dirname, 'public', 'aiml/insiemi/esempio3.aiml'),
  ],
  'botEsempio4': [
    path.join(__dirname, 'public', 'aiml/insiemi/esempio4.aiml'),
  ],
  'botEsempio5': [
    path.join(__dirname, 'public', 'aiml/insiemi/esempio5.aiml'),
  ],
  'botEsempio6': [
    path.join(__dirname, 'public', 'aiml/insiemi/esempio6.aiml'),
  ],
  'botEsempio7': [
    path.join(__dirname, 'public', 'aiml/insiemi/esempio7.aiml'),
  ],
}

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

//#region FUNZIONI

/**
 * Pulisce l'input dell'utente dei caratteri speciali
 */ 
function cleanString(inputString) {
  const outputString = inputString
    .normalize("NFD") // Decomposizione dei caratteri accentati in caratteri base + diacritici
    .replace(/[\u0300-\u036f]/g, "") // Rimozione dei diacritici
    .replace(/[^\w\s]/g, " ") // Rimozione dei caratteri di punteggiatura e sostituzione con spazi
    .replace(/\s+/g, " "); // Rimozione degli spazi multipli consecutivi
  return outputString;
}

/**
 * Ottenere data della richiesta
 */ 
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

/**
 * Estrae la risposta e l'eventuale link all'immagine dalla risposta del bot
 */ 
function extractAnswer(answer) {
  let image_link = '';
  let id_elements = [];
  let style_names = [];
  let style_values = [];
  let elements = [];
  let splitted_element = [];

  // controlla se la risposta contiene un link all'immagine e nel caso prendila
  if (answer.includes("figure{")) {
    image_link = answer.match(/figure\{([^}]+)\}/)[0];
    answer = answer.replace(image_link, '');

    image_link = 'img/' + image_link.replace('figure{', '').replace('}', '');
    //image_link = 'http://localhost:3000/static/img/' + image_link.replace('figure{', '').replace('}', ''); 
  }

  // controlla se la risposta contiene uno o più elementi svg
  if (answer.includes("element{")) {
    elements = answer.match(/element\{([^}]+)\}/g);
    for (let i = 0; i < elements.length; i++) {
      answer = answer.replace(elements[i], '');
      splitted_element = elements[i].split('--');

      id_elements.push(splitted_element[0].replace('element{', '').replace('}', ''));
      style_names.push(splitted_element[1].replace('element{', '').replace('}', ''));
      style_values.push(splitted_element[2].replace('element{', '').replace('}', ''));
    }  
  }

  return { 
    answer: answer,
    image_link: image_link,
    id_elements: id_elements,
    style_names: style_names,
    style_values: style_values
  };
}

/**
 * Pulisce la risposta del bot
 */ 
function beatufyAnswer(answer) {
  //mette lo spazio dopo ogni punto
  answer = answer.replace(/\./g, '. ');

  return answer;
}

//#endregion

app.set('view engine', 'ejs');
app.use(express.static('public'));

//#region SPERIMENTAZIONE AUTOMI

//#region ABC

app.get('//sperimentazione_automi/homepageABC', (req, res) => {
  res.render('index_server_sperimentazione_automiABC', { pageTitle: 'Homepage', section: 'sperimentazione_automi/homepageABC.ejs' });
});

app.get('//sperimentazione_automi/diagramABC', (req, res) => {
  res.render('index_server_sperimentazione_automiABC', { pageTitle: 'Diagram', section: 'sperimentazione_automi/diagramABC.ejs' });
});

app.get('//sperimentazione_automi/chatbotABC', (req, res) => {
  res.render('index_server_sperimentazione_automiABC', { pageTitle: 'Automaton', section: 'sperimentazione_automi/chatbotABC.ejs' });
});

app.post("//sperimentazione_automi/chatbotABC.html", async (req, res) => {
  // Ricevi la query dal client
  let query = req.body.query;

  var intepreter = new AIMLInterpreterSperimentazioneAutomiABC({ name: 'Novagraph.ABC' });
  intepreter.loadFiles(aiml.botABC);
  
  try {
    // Chiamata asincrona per trovare la risposta
    intepreter.findAnswer(cleanString(query), (answer, wildCardArray, input) => {
      req.session.history = req.session.history || [];
      req.session.history.push({ query: query, answer: answer });
      console.log(answer + ' | ' +  wildCardArray + ' | ' + input);
      csv.stringify([[req.session.id, query, answer, wildCardArray, getDate(), 'typeABC']], (err, output) => {
        fs.appendFileSync("interactionsABC.csv", output);
      });

      res.json({ query: query, answer: answer });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Errore durante l'elaborazione della richiesta");
  }
});

//#endregion

//#region XYZ

app.get('//sperimentazione_automi/homepageXYZ', (req, res) => {
  res.render('index_server_sperimentazione_automiXYZ', { pageTitle: 'Homepage', section: 'sperimentazione_automi/homepageXYZ.ejs' });
});

app.get('//sperimentazione_automi/diagramXYZ', (req, res) => {
  res.render('index_server_sperimentazione_automiXYZ', { pageTitle: 'Diagram', section: 'sperimentazione_automi/diagramXYZ.ejs' });
});

app.get('//sperimentazione_automi/chatbotXYZ', (req, res) => {
  res.render('index_server_sperimentazione_automiXYZ', { pageTitle: 'Automaton', section: 'sperimentazione_automi/chatbotXYZ.ejs' });
});

app.post("//sperimentazione_automi/chatbotXYZ.html", async (req, res) => {
  // Ricevi la query dal client
  let query = req.body.query;

  var intepreter = new AIMLInterpreterSperimentazioneAutomiXYZ({ name: 'Novagraph.XYZ' });
  intepreter.loadFiles(aiml.botXYZ);
  
  try {
    // Chiamata asincrona per trovare la risposta
    intepreter.findAnswer(cleanString(query), (answer, wildCardArray, input) => {
      req.session.history = req.session.history || [];
      req.session.history.push({ query: query, answer: answer });
      console.log(answer + ' | ' +  wildCardArray + ' | ' + input);
      csv.stringify([[req.session.id, query, answer, wildCardArray, getDate(), 'typeXYZ']], (err, output) => {
        fs.appendFileSync("interactionsXYZ.csv", output);
      });

      res.json({ query: query, answer: answer });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Errore durante l'elaborazione della richiesta");
  }
});


//#endregion

//#endregion


//#region TRE DOMINI

app.get('//tre_domini', (req, res) => {
  res.render('index_server_tre_domini', { pageTitle: 'Homepage', section: 'tre_domini/homepage.ejs' });
});

//#region AUTOMI

app.get('//tre_domini/automi', (req, res) => {
  res.render('index_server_tre_domini', { pageTitle: 'Automi', section: 'tre_domini/automi/automi.ejs' });
});

app.post("//tre_domini/automi.html", async (req, res) => {
  // Ricevi la query dal client
  let query = req.body.query;

  var intepreter = new AIMLInterpreterTreDominiAutomi({ name: 'Novagraph.automi' });
  intepreter.loadFiles(aiml.botAutomi);
  
  try {
    // Chiamata asincrona per trovare la risposta
    intepreter.findAnswer(cleanString(query), (answer, wildCardArray, input) => {
      req.session.history = req.session.history || [];
      req.session.history.push({ query: query, answer: answer });
      console.log(answer + ' | ' +  wildCardArray + ' | ' + input);
      csv.stringify([[req.session.id, query, answer, wildCardArray, getDate(), 'typeAutomi']], (err, output) => {
        fs.appendFileSync("interactionsAutomi.csv", output);
      });

      var ret = extractAnswer(answer);
      ret.answer = beatufyAnswer(ret.answer);
            
      // Invia la risposta al client
      res.json({ 
        query: query,
        answer: ret.answer,
        image_link: ret.image_link,
        id_elements: ret.id_elements,
        style_names: ret.style_names,
        style_values: ret.style_values,
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Errore durante l'elaborazione della richiesta");
  }
});

//#endregion

//#region CIRCUITI

app.get('//tre_domini/circuiti', (req, res) => {
  res.render('index_server_tre_domini', { pageTitle: 'Circuiti', section: 'tre_domini/circuiti/circuiti.ejs' });
});

app.post("//tre_domini/circuiti.html", async (req, res) => {
  // Ricevi la query dal client
  let query = req.body.query;

  var intepreter = new AIMLInterpreterTreDominiCircuiti({ name: 'Novagraph.circuiti' });
  intepreter.loadFiles(aiml.botCircuiti);
  
  try {
    // Chiamata asincrona per trovare la risposta
    intepreter.findAnswer(cleanString(query), (answer, wildCardArray, input) => {
      req.session.history = req.session.history || [];
      req.session.history.push({ query: query, answer: answer });
      console.log(answer + ' | ' +  wildCardArray + ' | ' + input);
      csv.stringify([[req.session.id, query, answer, wildCardArray, getDate(), 'typeCircuiti']], (err, output) => {
        fs.appendFileSync("interactionsCircuiti.csv", output);
      });

      var ret = extractAnswer(answer);
      ret.answer = beatufyAnswer(ret.answer);
            
      // Invia la risposta al client
      res.json({ 
        query: query,
        answer: ret.answer,
        image_link: ret.image_link,
        id_elements: ret.id_elements,
        style_names: ret.style_names,
        style_values: ret.style_values,
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Errore durante l'elaborazione della richiesta");
  }
});

//#endregion

//#region INSIEMI

app.get('//tre_domini/insiemi', (req, res) => {
  res.render('index_server_tre_domini', { pageTitle: 'Insiemi', section: 'tre_domini/insiemi/insiemi.ejs' });
});

app.post("//tre_domini/insiemi.html", async (req, res) => {
  // Ricevi la query dal client
  let query = req.body.query;

  var intepreter = new AIMLInterpreterTreDominiInsiemi({ name: 'Novagraph.insiemi' });
  intepreter.loadFiles(aiml.botInsiemi);
  
  try {
    // Chiamata asincrona per trovare la risposta
    intepreter.findAnswer(cleanString(query), (answer, wildCardArray, input) => {
      req.session.history = req.session.history || [];
      req.session.history.push({ query: query, answer: answer });
      console.log(answer + ' | ' +  wildCardArray + ' | ' + input);
      csv.stringify([[req.session.id, query, answer, wildCardArray, getDate(), 'typeInsiemi']], (err, output) => {
        fs.appendFileSync("interactionsInsiemi.csv", output);
      });

      var ret = extractAnswer(answer);
      ret.answer = beatufyAnswer(ret.answer);
      
      // Invia la risposta al client
      res.json({ 
        query: query,
        answer: ret.answer,
        image_link: ret.image_link,
        id_elements: ret.id_elements,
        style_names: ret.style_names,
        style_values: ret.style_values,
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Errore durante l'elaborazione della richiesta");
  }
});

//#endregion


//#endregion

//#region SPERIMENTAZIONE INSIEMI

app.get('/', (req, res) => {
  res.render('index_server', { pageTitle: 'Homepage', section: 'homepage.ejs' });
});

//#region ESEMPIO 1

app.get('//esempio1', (req, res) => {
  res.render('index_server', { pageTitle: 'Esempio 1', section: 'insiemi/esempio1.ejs' });
});

app.post("//esempio1.html", async (req, res) => {
  // Ricevi la query dal client
  let query = req.body.query;

  var intepreter = new AIMLInterpreterEsempio1({ name: 'Novagraph.esempio1' });
  intepreter.loadFiles(aiml.botEsempio1);
  
  try {
    // Chiamata asincrona per trovare la risposta
    intepreter.findAnswer(cleanString(query), (answer, wildCardArray, input) => {
      req.session.history = req.session.history || [];
      req.session.history.push({ query: query, answer: answer });
      console.log(answer + ' | ' +  wildCardArray + ' | ' + input);

      csv.stringify(
        [[req.session.id, query, answer, wildCardArray, getDate(), 'typeAutomi']],
        { encoding: 'utf8' },
        (err, output) => {
          fs.appendFileSync('interactionsEsempio1.csv', output, { encoding: 'utf8' });
        }
      );

      var ret = extractAnswer(answer);
      ret.answer = beatufyAnswer(ret.answer);
            
      // Invia la risposta al client
      res.json({ 
        query: query,
        answer: ret.answer,
        image_link: ret.image_link,
        id_elements: ret.id_elements,
        style_names: ret.style_names,
        style_values: ret.style_values,
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Errore durante l'elaborazione della richiesta");
  }
});

//#endregion

//#region ESEMPIO 2

app.get('//esempio2', (req, res) => {
  res.render('index_server', { pageTitle: 'Esempio 2', section: 'insiemi/esempio2.ejs' });
});

app.post("//esempio2.html", async (req, res) => {
  // Ricevi la query dal client
  let query = req.body.query;

  var intepreter = new AIMLInterpreterEsempio2({ name: 'Novagraph.esempio2' });
  intepreter.loadFiles(aiml.botEsempio2);
  
  try {
    // Chiamata asincrona per trovare la risposta
    intepreter.findAnswer(cleanString(query), (answer, wildCardArray, input) => {
      req.session.history = req.session.history || [];
      req.session.history.push({ query: query, answer: answer });
      console.log(answer + ' | ' +  wildCardArray + ' | ' + input);
      csv.stringify(
        [[req.session.id, query, answer, wildCardArray, getDate(), 'typeEsempio2']],
        { encoding: 'utf8' },
        (err, output) => {
          fs.appendFileSync('interactionsEsempio2.csv', output, { encoding: 'utf8' });
        }
      );

      var ret = extractAnswer(answer);
      ret.answer = beatufyAnswer(ret.answer);
            
      // Invia la risposta al client
      res.json({ 
        query: query,
        answer: ret.answer,
        image_link: ret.image_link,
        id_elements: ret.id_elements,
        style_names: ret.style_names,
        style_values: ret.style_values,
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Errore durante l'elaborazione della richiesta");
  }
});

//#endregion

//#region ESEMPIO 3

app.get('//esempio3', (req, res) => {
  res.render('index_server', { pageTitle: 'Esempio 3', section: 'insiemi/esempio3.ejs' });
});

app.post("//esempio3.html", async (req, res) => {
  // Ricevi la query dal client
  let query = req.body.query;

  var intepreter = new AIMLInterpreterEsempio3({ name: 'Novagraph.esempio3' });
  intepreter.loadFiles(aiml.botEsempio3);
  
  try {
    // Chiamata asincrona per trovare la risposta
    intepreter.findAnswer(cleanString(query), (answer, wildCardArray, input) => {
      req.session.history = req.session.history || [];
      req.session.history.push({ query: query, answer: answer });
      console.log(answer + ' | ' +  wildCardArray + ' | ' + input);
      csv.stringify(
        [[req.session.id, query, answer, wildCardArray, getDate(), 'typeEsempio3']],
        { encoding: 'utf8' },
        (err, output) => {
          fs.appendFileSync('interactionsEsempio3.csv', output, { encoding: 'utf8' });
        }
      );

      var ret = extractAnswer(answer);
      ret.answer = beatufyAnswer(ret.answer);
            
      // Invia la risposta al client
      res.json({ 
        query: query,
        answer: ret.answer,
        image_link: ret.image_link,
        id_elements: ret.id_elements,
        style_names: ret.style_names,
        style_values: ret.style_values,
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Errore durante l'elaborazione della richiesta");
  }
});

//#endregion

//#region ESEMPIO 4

app.get('//esempio4', (req, res) => {
  res.render('index_server', { pageTitle: 'Esempio 4', section: 'insiemi/esempio4.ejs' });
});

app.post("//esempio4.html", async (req, res) => {
  // Ricevi la query dal client
  let query = req.body.query;

  var intepreter = new AIMLInterpreterEsempio4({ name: 'Novagraph.esempio4' });
  intepreter.loadFiles(aiml.botEsempio4);
  
  try {
    // Chiamata asincrona per trovare la risposta
    intepreter.findAnswer(cleanString(query), (answer, wildCardArray, input) => {
      req.session.history = req.session.history || [];
      req.session.history.push({ query: query, answer: answer });
      console.log(answer + ' | ' +  wildCardArray + ' | ' + input);
      csv.stringify(
        [[req.session.id, query, answer, wildCardArray, getDate(), 'typeEsempio4']],
        { encoding: 'utf8' },
        (err, output) => {
          fs.appendFileSync('interactionsEsempio4.csv', output, { encoding: 'utf8' });
        }
      );
      var ret = extractAnswer(answer);
      ret.answer = beatufyAnswer(ret.answer);
            
      // Invia la risposta al client
      res.json({ 
        query: query,
        answer: ret.answer,
        image_link: ret.image_link,
        id_elements: ret.id_elements,
        style_names: ret.style_names,
        style_values: ret.style_values,
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Errore durante l'elaborazione della richiesta");
  }
});

//#endregion

//#region ESEMPIO 5

app.get('//esempio5', (req, res) => {
  res.render('index_server', { pageTitle: 'Esempio 5', section: 'insiemi/esempio5.ejs' });
});

app.post("//esempio5.html", async (req, res) => {
  // Ricevi la query dal client
  let query = req.body.query;

  var intepreter = new AIMLInterpreterEsempio5({ name: 'Novagraph.esempio5' });
  intepreter.loadFiles(aiml.botEsempio5);
  
  try {
    // Chiamata asincrona per trovare la risposta
    intepreter.findAnswer(cleanString(query), (answer, wildCardArray, input) => {
      req.session.history = req.session.history || [];
      req.session.history.push({ query: query, answer: answer });
      console.log(answer + ' | ' +  wildCardArray + ' | ' + input);
      csv.stringify(
        [[req.session.id, query, answer, wildCardArray, getDate(), 'typeEsempio5']],
        { encoding: 'utf8' },
        (err, output) => {
          fs.appendFileSync('interactionsEsempio5.csv', output, { encoding: 'utf8' });
        }
      );

      var ret = extractAnswer(answer);
      ret.answer = beatufyAnswer(ret.answer);
            
      // Invia la risposta al client
      res.json({ 
        query: query,
        answer: ret.answer,
        image_link: ret.image_link,
        id_elements: ret.id_elements,
        style_names: ret.style_names,
        style_values: ret.style_values,
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Errore durante l'elaborazione della richiesta");
  }
});

//#endregion

//#region ESEMPIO 6

app.get('//esempio6', (req, res) => {
  res.render('index_server', { pageTitle: 'Esempio 6', section: 'insiemi/esempio6.ejs' });
});

app.post("//esempio6.html", async (req, res) => {
  // Ricevi la query dal client
  let query = req.body.query;

  var intepreter = new AIMLInterpreterEsempio6({ name: 'Novagraph.esempio6' });
  intepreter.loadFiles(aiml.botEsempio6);
  
  try {
    // Chiamata asincrona per trovare la risposta
    intepreter.findAnswer(cleanString(query), (answer, wildCardArray, input) => {
      req.session.history = req.session.history || [];
      req.session.history.push({ query: query, answer: answer });
      console.log(answer + ' | ' +  wildCardArray + ' | ' + input);
      csv.stringify(
        [[req.session.id, query, answer, wildCardArray, getDate(), 'typeEsempio6']],
        { encoding: 'utf8' },
        (err, output) => {
          fs.appendFileSync('interactionsEsempio6.csv', output, { encoding: 'utf8' });
        }
      );

      var ret = extractAnswer(answer);
      ret.answer = beatufyAnswer(ret.answer);
            
      // Invia la risposta al client
      res.json({ 
        query: query,
        answer: ret.answer,
        image_link: ret.image_link,
        id_elements: ret.id_elements,
        style_names: ret.style_names,
        style_values: ret.style_values,
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Errore durante l'elaborazione della richiesta");
  }
});

//#endregion

//#region ESEMPIO 7

app.get('//esempio7', (req, res) => {
  res.render('index_server', { pageTitle: 'Esempio 7', section: 'insiemi/esempio7.ejs' });
});

app.post("//esempio7.html", async (req, res) => {
  // Ricevi la query dal client
  let query = req.body.query;

  var intepreter = new AIMLInterpreterEsempio7({ name: 'Novagraph.esempio7' });
  intepreter.loadFiles(aiml.botEsempio7);
  
  try {
    // Chiamata asincrona per trovare la risposta
    intepreter.findAnswer(cleanString(query), (answer, wildCardArray, input) => {
      req.session.history = req.session.history || [];
      req.session.history.push({ query: query, answer: answer });
      console.log(answer + ' | ' +  wildCardArray + ' | ' + input);
      csv.stringify(
        [[req.session.id, query, answer, wildCardArray, getDate(), 'typeEsempio7']],
        { encoding: 'utf8' },
        (err, output) => {
          fs.appendFileSync('interactionsEsempio7.csv', output, { encoding: 'utf8' });
        }
      );

      var ret = extractAnswer(answer);
      ret.answer = beatufyAnswer(ret.answer);
            
      // Invia la risposta al client
      res.json({ 
        query: query,
        answer: ret.answer,
        image_link: ret.image_link,
        id_elements: ret.id_elements,
        style_names: ret.style_names,
        style_values: ret.style_values,
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Errore durante l'elaborazione della richiesta");
  }
});

//#endregion

//#endregion

app.get("*", (req, res) => {
  console.log("Pagina non trovata");
  res.status(404).send("Pagina non trovata");
});

app.listen(port, () => {
  console.log(`Il server è in ascolto su http://${hostname}:${port}/`);
});
