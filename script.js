const api_key = '1ef844cb824d486f8aca3ebeb47cf0ce';
const private_key = 'a1a5a597f5b58806ef5d614dd7e0e2573769aca0';
let limit = 20;
let offset = 0;
let pageNumber=1;

// Funzione per generare l'hash MD5
function generateMD5Hash(data) {
    return SparkMD5.hash(data); // Utilizza SparkMD5 per generare l'hash
}
// funzione per aggiornare il num di pagg
function updatePage(){
    const pageNumberElement = document.getElementById('pageNumber');
    pageNumberElement.textContent = pageNumber; // Imposta il numero di pagina corrente
}
// Funzione per ottenere i dati dall'API Marvel
async function getFromMarvel(url, query = "") {
    const timestamp = Date.now();
    const hash = generateMD5Hash(`${timestamp}${private_key}${api_key}`);
    const parameters = `ts=${timestamp}&apikey=${api_key}&hash=${hash}&limit=${limit}&offset=${offset}`;
    try {
        const response = await fetch(`https://gateway.marvel.com/v1/public/${url}?${parameters}${query}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}



async function getComics(){
    const url = `comics`;
    const characters = await getFromMarvel(url);
    if (comics) {
        mostraCharacters(comics); // Mostra i personaggi ottenuti
    } else {
        console.error("Failed to fetch characters.");
    }
}

// Funzione per ottenere i personaggi
async function getCharacters() {
    const url = `characters`;
    const characters = await getFromMarvel(url);
    if (characters) {
        mostraCharacters(characters); // Mostra i personaggi ottenuti
    } else {
        console.error("Failed to fetch characters.");
    }
}


// Funzione per mostrare i personaggi
function mostraCharacters(characters) {
    const container = document.getElementById('container');

    // Rimuovi solo le card dinamiche
    const dynamicCards = container.querySelectorAll('.dynamic-card');
    dynamicCards.forEach(card => card.remove());

    const cardTemplate = document.getElementById('card-characters');

    if (!cardTemplate) {
        console.error("Template 'card-characters' non trovato");
        return;
    }

    characters.data.results.forEach((character) => {
        const clone = cardTemplate.cloneNode(true); // Clona il template
        clone.id = 'card-characters-' + character.id;
        clone.classList.add('dynamic-card'); // Aggiungi classe dinamica

        const c_name = clone.querySelector('.card-name');
        const description = clone.querySelector('.card-text');
        const image = clone.querySelector('.card-img-top');
        const button = clone.querySelector('.btn-primary');
        const rarityBadge = clone.querySelector('.rarity-badge'); // Seleziona il badge

        c_name.textContent = character.name;
        description.textContent = character.description || "No description available";
        image.src = `${character.thumbnail.path}.${character.thumbnail.extension}`;
        button.href = "card.html?id=" + character.id;

        // Determina la rarità
        const comicsCount = character.comics.available;
        let rarity = "Base"; // Default
        if (comicsCount <= 20) {
            rarity = "Epico";
            rarityBadge.classList.add('epic-badge');
        } else if (comicsCount <= 200) {
            rarity = "Raro";
            rarityBadge.classList.add('rare-badge');
        } else {
            rarityBadge.classList.add('base-badge');
        }

        rarityBadge.textContent = rarity; // Imposta il testo del badge

        clone.classList.remove('d-none'); // Rendi visibile la card
        container.appendChild(clone); // Aggiungi la card al contenitore
    });
}


// Funzione per gestire il pulsante "Avanti"
function nextPage() {
    offset += limit; // Incrementa l'offset
    pageNumber+=1;
    getCharacters(); // Carica la pagina successiva
    updatePage();
}

// Funzione per gestire il pulsante "Indietro"
function previousPage() {
    if (offset >= limit) {
        offset -= limit; // Decrementa l'offset
        pageNumber-=1;
    } else {
        offset = 0; // Non permettere valori negativi
    }
    getCharacters(); // Carica la pagina precedente
    updatePage();
}

function ricerca() {
    query = document.getElementById('query').value;
    console.log(query, query.length);
    if(query.length > 3){
      const options = {
        method: 'GET'
        };
  
        const timestamp = Date.now();
        const hash = generateMD5Hash(`${timestamp}${private_key}${api_key}`);
        const parameters = `ts=${timestamp}&apikey=${api_key}&hash=${hash}`;
      
  
      
        fetch(`https://gateway.marvel.com:443/v1/public/characters?nameStartsWith=${query}&${parameters}`, options)
            .then(response => response.json())
            .then(response => mostraCharacters(response))
            .catch(err => console.error(err));
    }
  
    return false;
  
}

  function logout() {
    localStorage.removeItem("id_utente");
    localStorage.removeItem("nome_utente");
    localStorage.removeItem("email_utente");

    window.location.href = "home.html"; // Reindirizza alla pagina di login
    }