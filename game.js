// game.js

// Estado inicial do jogo
let gameState = {
    currentLocation: "start",
    inventory: [], // Começa vazio. Ex: ["fragmento_prata", "pelo_de_gato"]
    flags: {} // Para lembrar de eventos. Ex: { viu_o_gato: true }
};

// Referências aos elementos do HTML
const sceneImage = document.getElementById('scene-image');
const storyText = document.getElementById('story-text');
const choicesContainer = document.getElementById('choices-container');
const inventoryItemsContainer = document.getElementById('inventory-items');

// Função principal: Carrega uma cena
function loadLocation(locationKey) {
    const locationData = gameData[locationKey];

    if (!locationData) {
        console.error("Local não encontrado:", locationKey);
        storyText.innerText = "Erro: O fim do mundo foi encontrado prematuramente.";
        return;
    }

    gameState.currentLocation = locationKey;

    // 1. Atualiza a Imagem com um efeito de fade
    sceneImage.style.opacity = 0;
    setTimeout(() => {
        sceneImage.src = locationData.image;
        sceneImage.style.opacity = 1;
    }, 300);
    

    // 2. Atualiza o Texto
    storyText.innerText = locationData.text;

    // 3. Gera os Botões de Escolha
    choicesContainer.innerHTML = ""; // Limpa botões antigos

    locationData.choices.forEach(choice => {
        // Verifica se o jogador tem os requisitos para ver essa opção
        let canShow = true;
        if (choice.req && !gameState.inventory.includes(choice.req)) {
            canShow = false;
        }
        if (choice.hideIfHas && gameState.inventory.includes(choice.hideIfHas)) {
            canShow = false;
        }

        if (canShow) {
            const button = document.createElement('button');
            button.innerText = choice.text;
            button.classList.add('choice-btn');
            
            button.onclick = () => {
                // Executa efeito se houver (ex: pegar item)
                if (choice.effect && gameEffects[choice.effect]) {
                    gameEffects[choice.effect]();
                }
                // Move para o próximo local
                loadLocation(choice.next);
            };
            choicesContainer.appendChild(button);
        }
    });
}

// Função para atualizar a barra de inventário visualmente
function updateInventoryDisplay() {
    inventoryItemsContainer.innerHTML = "";
    if (gameState.inventory.length === 0) {
        inventoryItemsContainer.innerText = "Vazio";
        return;
    }
    gameState.inventory.forEach(item => {
        const itemSpan = document.createElement('span');
        itemSpan.classList.add('inv-item');
        // Formata o nome do item (troca underline por espaço)
        itemSpan.innerText = item.replace(/_/g, ' ').toUpperCase();
        inventoryItemsContainer.appendChild(itemSpan);
    });
}

// Inicializa o jogo
updateInventoryDisplay();
loadLocation("start");
