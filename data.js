// data.js
const gameData = {
    // Cena Inicial: Inspirada em 't' (o nascimento da mandrágora)
    "start": {
        title: "O Solo",
        // Substitua pelo caminho da sua imagem processada do clipe 't'
        image: "assets/images/placeholder_forest.jpg", 
        text: "Você acorda. Você é raiz, terra e consciência. O solo úmido te envolve. Acima, uma luz pálida e fria penetra a copa densa das árvores. Você sente uma necessidade urgente de 'crescer'.",
        choices: [
            { text: "Empurrar para cima, em direção à luz.", next: "forest_floor" },
            { text: "Sentir as vibrações da terra.", next: "earth_sense" }
        ]
    },

    "earth_sense": {
        title: "Vibrações",
        image: "assets/images/placeholder_roots.jpg", // Imagem abstrata de raízes
        text: "Você fecha os olhos que não sabia que tinha. Há um ritmo grave, um sintetizador pulsando nas profundezas da terra. Algo metálico ressoa longe.",
        choices: [
            { text: "Voltar a focar na superfície.", next: "start" }
        ]
    },

    // A Floresta: Inspirada na estética geral
    "forest_floor": {
        title: "O Chão da Floresta",
        image: "assets/images/placeholder_clearing.jpg",
        text: "Você emerge. O ar é frio e cheira a pinho. Você vê seu corpo: um emaranhado de raízes escuras e musgo, vagamente humanoide. Há um caminho à frente e algo brilhando perto de uma bétula.",
        choices: [
            { text: "Investigar o brilho na bétula.", next: "silver_spot" },
            { text: "Seguir o caminho nebuloso.", next: "path_fog" }
        ]
    },

    // O Papel Alumínio: Inspirado em 'y'
    "silver_spot": {
        title: "Reflexo Metálico",
        image: "assets/images/placeholder_foil.jpg", // Imagem do papel alumínio no mato
        text: "Perto da árvore, há restos rasgados de um material prateado e reflexivo. Parece alienígena nesta floresta orgânica. Vibra ligeiramente.",
        choices: [
            // Esta escolha só aparece se NÃO tiver o item, e dá o item.
            { text: "Pegar o fragmento de prata.", effect: "get_foil", next: "silver_spot_taken", hideIfHas: "fragmento_prata" },
            { text: "Voltar para a clareira.", next: "forest_floor" }
        ]
    },

    "silver_spot_taken": {
        title: "Reflexo Metálico",
        image: "assets/images/placeholder_foil.jpg",
        text: "Apenas terra remexida onde o metal estava. Você sente o fragmento frio pulsando em sua 'mão' de raiz.",
        choices: [
            { text: "Voltar para a clareira.", next: "forest_floor" }
        ]
    },

    // Exemplo de uso de item: O Caminho
    "path_fog": {
        title: "O Caminho Nebuloso",
        image: "assets/images/placeholder_path.jpg",
        text: "O caminho é bloqueado por uma névoa densa e antinatural. Você sente que não pode passar apenas sendo 'orgânico'.",
        choices: [
            { text: "Tentar atravessar a névoa.", next: "fog_fail" },
            // Esta opção só aparece SE o jogador tiver o item
            { text: "Usar o fragmento de prata para refletir a luz na névoa.", next: "fog_pass", req: "fragmento_prata" },
            { text: "Voltar.", next: "forest_floor" }
        ]
    },
    
    "fog_fail": {
        title: "Névoa",
         image: "assets/images/placeholder_path.jpg",
        text: "A névoa te sufoca. Você se sente secando. Você recua rapidamente.",
        choices: [{text: "Voltar", next: "forest_floor"}]
    },
    
    "fog_pass": {
         title: "A Passagem",
         image: "assets/images/placeholder_lake.jpg", // Imagem do lago de 'play' ou 'y'
         text: "O reflexo do metal corta a névoa. O caminho se abre para um grande lago gelado. Há uma figura parada sobre a água.",
         choices: [{text: "Continuar...", next: "lake_encounter"}]
    }
    // ... Adicione mais cenas aqui
};

// Efeitos especiais (ex: pegar itens)
const gameEffects = {
    "get_foil": function() {
        gameState.inventory.push("fragmento_prata");
        updateInventoryDisplay();
    }
};
