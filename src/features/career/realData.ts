export type Player = { id: string; clubId?: string; name: string; position: string; age: number; rating: number; value: number; wage: number }

const player = (id: string, clubId: string | undefined, name: string, position: string, age: number, rating: number, value: number, wage: number): Player => ({ id, ...(clubId ? { clubId } : {}), name, position, age, rating, value, wage })
type PlayerInput = [name: string, position: string, age: number, rating: number, value: number, wage: number]
const roster = (prefix: string, clubId: string, entries: PlayerInput[]) => entries.map((entry, index) => player(`${prefix}${index + 1}`, clubId, ...entry))

export const clubs = [
  { id: 'flamengo', name: 'Flamengo', initials: 'FLA', city: 'Rio de Janeiro · RJ', color: '#ef3340', reputation: 'Potência nacional', objective: 'Ser campeão', description: 'Elenco de alto nível, grande torcida e cobrança por títulos em todas as competições.' },
  { id: 'palmeiras', name: 'Palmeiras', initials: 'PAL', city: 'São Paulo · SP', color: '#35a853', reputation: 'Protagonismo constante', objective: 'Terminar entre os dois primeiros', description: 'Estrutura forte e um grupo acostumado a disputar as principais conquistas.' },
  { id: 'corinthians', name: 'Corinthians', initials: 'COR', city: 'São Paulo · SP', color: '#f2f2f2', reputation: 'Tradição e pressão', objective: 'Terminar entre os dois primeiros', description: 'Uma camisa de peso, torcida exigente e a missão de construir uma campanha competitiva.' },
  { id: 'sao-paulo', name: 'São Paulo', initials: 'SPF', city: 'São Paulo · SP', color: '#e32636', reputation: 'História vencedora', objective: 'Terminar entre os três primeiros', description: 'Um clube tradicional em busca de regularidade e de uma nova sequência de grandes resultados.' },
  { id: 'santos', name: 'Santos', initials: 'SAN', city: 'Santos · SP', color: '#f4f4f4', reputation: 'Berço de craques', objective: 'Terminar entre os oito primeiros', description: 'Tradição ofensiva, talentos da base e o desafio de recolocar o clube entre os protagonistas.' },
  { id: 'vasco', name: 'Vasco da Gama', initials: 'VAS', city: 'Rio de Janeiro · RJ', color: '#f4f4f4', reputation: 'Gigante popular', objective: 'Terminar entre os doze primeiros', description: 'Torcida apaixonada e um projeto em busca de estabilidade e crescimento nacional.' },
  { id: 'botafogo', name: 'Botafogo', initials: 'BOT', city: 'Rio de Janeiro · RJ', color: '#d9d9d9', reputation: 'Estrela solitária', objective: 'Terminar entre os oito primeiros', description: 'Elenco competitivo e ambição para permanecer na parte alta da tabela.' },
  { id: 'fluminense', name: 'Fluminense', initials: 'FLU', city: 'Rio de Janeiro · RJ', color: '#8b2332', reputation: 'Tradição tricolor', objective: 'Terminar entre os seis primeiros', description: 'Experiência, técnica e uma identidade de jogo apoiada na qualidade com a bola.' },
  { id: 'cruzeiro', name: 'Cruzeiro', initials: 'CRU', city: 'Belo Horizonte · MG', color: '#2d5db3', reputation: 'Camisa copeira', objective: 'Terminar entre os seis primeiros', description: 'Um elenco forte para devolver o clube às principais disputas nacionais.' },
  { id: 'atletico-mg', name: 'Atlético Mineiro', initials: 'CAM', city: 'Belo Horizonte · MG', color: '#d7d7d7', reputation: 'Força mineira', objective: 'Terminar entre os seis primeiros', description: 'Ambição, qualidade individual e pressão constante por grandes campanhas.' },
  { id: 'gremio', name: 'Grêmio', initials: 'GRE', city: 'Porto Alegre · RS', color: '#49a7d8', reputation: 'Imortal tricolor', objective: 'Terminar entre os oito primeiros', description: 'Competitividade, tradição e uma torcida que exige presença nas decisões.' },
  { id: 'internacional', name: 'Internacional', initials: 'INT', city: 'Porto Alegre · RS', color: '#d93636', reputation: 'Celeiro de ases', objective: 'Terminar entre os oito primeiros', description: 'Um projeto que combina experiência, intensidade e busca por títulos.' },
  { id: 'bahia', name: 'Bahia', initials: 'BAH', city: 'Salvador · BA', color: '#297cc1', reputation: 'Esquadrão de aço', objective: 'Terminar entre os seis primeiros', description: 'Estrutura em crescimento e um elenco preparado para competir na parte alta.' },
  { id: 'vitoria', name: 'Vitória', initials: 'VIT', city: 'Salvador · BA', color: '#df3434', reputation: 'Leão da Barra', objective: 'Terminar entre os catorze primeiros', description: 'Intensidade, força em casa e a missão de construir uma campanha segura.' },
  { id: 'athletico-pr', name: 'Athletico Paranaense', initials: 'CAP', city: 'Curitiba · PR', color: '#d83232', reputation: 'Furacão', objective: 'Terminar entre os oito primeiros', description: 'Organização, juventude e velocidade para desafiar os principais clubes.' },
  { id: 'coritiba', name: 'Coritiba', initials: 'CFC', city: 'Curitiba · PR', color: '#2f9c55', reputation: 'Coxa-branca', objective: 'Terminar entre os catorze primeiros', description: 'Tradição paranaense e uma temporada voltada à consolidação na elite.' },
  { id: 'red-bull-bragantino', name: 'Red Bull Bragantino', initials: 'RBB', city: 'Bragança Paulista · SP', color: '#ec3f45', reputation: 'Projeto ascendente', objective: 'Terminar entre os doze primeiros', description: 'Atletas jovens, ritmo intenso e um modelo de jogo voltado à evolução.' },
  { id: 'mirassol', name: 'Mirassol', initials: 'MIR', city: 'Mirassol · SP', color: '#e5cf30', reputation: 'Força do interior', objective: 'Terminar entre os catorze primeiros', description: 'Organização e regularidade para competir com equilíbrio durante toda a liga.' },
  { id: 'remo', name: 'Remo', initials: 'REM', city: 'Belém · PA', color: '#274aa1', reputation: 'Leão Azul', objective: 'Permanecer na Série A', description: 'A força do Norte em uma campanha movida por torcida, entrega e superação.' },
  { id: 'chapecoense', name: 'Chapecoense', initials: 'CHA', city: 'Chapecó · SC', color: '#2f9f58', reputation: 'Chape', objective: 'Permanecer na Série A', description: 'Um grupo batalhador em busca de permanência e de uma campanha consistente.' },
] as const

export const playersByClub: Record<string, Player[]> = {
  flamengo: [
    player('fla1', 'flamengo', 'Agustín Rossi', 'GOL', 31, 79, 9000, 180),
    player('fla2', 'flamengo', 'Guillermo Varela', 'LD', 33, 75, 3500, 150),
    player('fla3', 'flamengo', 'Léo Ortiz', 'ZAG', 30, 80, 13000, 190),
    player('fla4', 'flamengo', 'Léo Pereira', 'ZAG', 30, 79, 11000, 180),
    player('fla5', 'flamengo', 'Alex Sandro', 'LE', 35, 77, 4500, 190),
    player('fla6', 'flamengo', 'Erick Pulgar', 'VOL', 32, 78, 9000, 180),
    player('fla7', 'flamengo', 'Jorginho', 'MC', 34, 80, 8000, 220),
    player('fla8', 'flamengo', 'Giorgian de Arrascaeta', 'MC', 32, 82, 16000, 260),
    player('fla9', 'flamengo', 'Gonzalo Plata', 'PD', 25, 78, 14000, 180),
    player('fla10', 'flamengo', 'Pedro', 'ATA', 29, 81, 18000, 240),
    player('fla11', 'flamengo', 'Samuel Lino', 'PE', 26, 79, 17000, 210),
    player('fla12', 'flamengo', 'Andrew', 'GOL', 25, 73, 4500, 85),
    player('fla13', 'flamengo', 'Emerson Royal', 'LD', 27, 76, 9000, 170),
    player('fla14', 'flamengo', 'Danilo', 'ZAG', 35, 76, 3000, 180),
    player('fla15', 'flamengo', 'Ayrton Lucas', 'LE', 29, 77, 9000, 160),
    player('fla16', 'flamengo', 'Nicolás de la Cruz', 'MC', 29, 80, 15000, 220),
    player('fla17', 'flamengo', 'Lucas Paquetá', 'MC', 29, 82, 22000, 280),
    player('fla18', 'flamengo', 'Bruno Henrique', 'ATA', 35, 76, 3500, 190),
  ],
  palmeiras: [
    player('pal1', 'palmeiras', 'Carlos Miguel', 'GOL', 27, 78, 8500, 150),
    player('pal2', 'palmeiras', 'Khellven', 'LD', 25, 76, 9000, 140),
    player('pal3', 'palmeiras', 'Gustavo Gómez', 'ZAG', 33, 81, 9000, 210),
    player('pal4', 'palmeiras', 'Murilo', 'ZAG', 29, 79, 12000, 180),
    player('pal5', 'palmeiras', 'Joaquín Piquerez', 'LE', 28, 78, 11000, 170),
    player('pal6', 'palmeiras', 'Marlon Freitas', 'VOL', 31, 77, 6500, 150),
    player('pal7', 'palmeiras', 'Andreas Pereira', 'MC', 30, 80, 15000, 220),
    player('pal8', 'palmeiras', 'Mauricio', 'MC', 25, 77, 11000, 150),
    player('pal9', 'palmeiras', 'Felipe Anderson', 'PD', 33, 78, 7000, 200),
    player('pal10', 'palmeiras', 'Vitor Roque', 'ATA', 21, 80, 25000, 210),
    player('pal11', 'palmeiras', 'Ramón Sosa', 'PE', 27, 77, 10500, 160),
    player('pal12', 'palmeiras', 'Marcelo Lomba', 'GOL', 39, 72, 700, 75),
    player('pal13', 'palmeiras', 'Agustín Giay', 'LD', 22, 74, 7500, 95),
    player('pal14', 'palmeiras', 'Bruno Fuchs', 'ZAG', 27, 76, 7500, 130),
    player('pal15', 'palmeiras', 'Jefté', 'LE', 22, 74, 6500, 100),
    player('pal16', 'palmeiras', 'Emiliano Martínez', 'VOL', 27, 76, 8000, 130),
    player('pal17', 'palmeiras', 'Jhon Arias', 'PD', 29, 81, 18000, 230),
    player('pal18', 'palmeiras', 'Flaco López', 'ATA', 25, 78, 14000, 170),
  ],
  corinthians: [
    player('cor1', 'corinthians', 'Hugo Souza', 'GOL', 27, 78, 8500, 145),
    player('cor2', 'corinthians', 'Matheuzinho', 'LD', 26, 75, 6500, 120),
    player('cor3', 'corinthians', 'André Ramalho', 'ZAG', 34, 76, 3200, 145),
    player('cor4', 'corinthians', 'Gabriel Paulista', 'ZAG', 35, 76, 2500, 155),
    player('cor5', 'corinthians', 'Matheus Bidu', 'LE', 27, 74, 4500, 95),
    player('cor6', 'corinthians', 'Raniele', 'VOL', 29, 75, 6000, 115),
    player('cor7', 'corinthians', 'André Carrillo', 'MC', 35, 77, 3500, 165),
    player('cor8', 'corinthians', 'Rodrigo Garro', 'MC', 28, 79, 14000, 175),
    player('cor9', 'corinthians', 'Jesse Lingard', 'PD', 33, 77, 5500, 180),
    player('cor10', 'corinthians', 'Yuri Alberto', 'ATA', 25, 78, 16000, 180),
    player('cor11', 'corinthians', 'Memphis Depay', 'PE', 32, 80, 9000, 260),
    player('cor12', 'corinthians', 'Felipe Longo', 'GOL', 21, 69, 1800, 35),
    player('cor13', 'corinthians', 'Pedro Milans', 'LD', 24, 71, 3000, 60),
    player('cor14', 'corinthians', 'Gustavo Henrique', 'ZAG', 33, 74, 2500, 105),
    player('cor15', 'corinthians', 'Fabrizio Angileri', 'LE', 32, 73, 2500, 95),
    player('cor16', 'corinthians', 'Breno Bidon', 'MC', 21, 75, 9000, 80),
    player('cor17', 'corinthians', 'Charles', 'MC', 30, 73, 3500, 85),
    player('cor18', 'corinthians', 'Vitinho', 'PE', 32, 74, 3200, 110),
  ],
  'sao-paulo': [
    player('sao1', 'sao-paulo', 'Rafael', 'GOL', 37, 76, 2500, 120),
    player('sao2', 'sao-paulo', 'Cédric Soares', 'LD', 35, 75, 2200, 125),
    player('sao3', 'sao-paulo', 'Arboleda', 'ZAG', 34, 78, 4500, 150),
    player('sao4', 'sao-paulo', 'Rafael Tolói', 'ZAG', 35, 76, 2500, 140),
    player('sao5', 'sao-paulo', 'Wendell', 'LE', 33, 76, 3500, 135),
    player('sao6', 'sao-paulo', 'Pablo Maia', 'VOL', 24, 77, 12000, 125),
    player('sao7', 'sao-paulo', 'Damián Bobadilla', 'MC', 25, 75, 7000, 105),
    player('sao8', 'sao-paulo', 'Cauly', 'MC', 31, 76, 6500, 135),
    player('sao9', 'sao-paulo', 'Lucas Moura', 'PD', 34, 79, 6000, 200),
    player('sao10', 'sao-paulo', 'Jonathan Calleri', 'ATA', 33, 78, 6500, 180),
    player('sao11', 'sao-paulo', 'Ferreira', 'PE', 28, 76, 7500, 130),
    player('sao12', 'sao-paulo', 'Carlos Coronel', 'GOL', 29, 73, 4000, 80),
    player('sao13', 'sao-paulo', 'Buta', 'LD', 29, 74, 5000, 105),
    player('sao14', 'sao-paulo', 'Sabino', 'ZAG', 30, 74, 3800, 95),
    player('sao15', 'sao-paulo', 'Enzo Díaz', 'LE', 30, 74, 4500, 100),
    player('sao16', 'sao-paulo', 'Marcos Antônio', 'MC', 26, 75, 6500, 110),
    player('sao17', 'sao-paulo', 'Luciano', 'ATA', 33, 77, 5000, 160),
    player('sao18', 'sao-paulo', 'André Silva', 'ATA', 29, 75, 5500, 115),
  ],
  santos: roster('san', 'santos', [
    ['Gabriel Brazão', 'GOL', 25, 76, 7000, 105], ['Igor Vinícius', 'LD', 29, 74, 4500, 100], ['Adonis Frías', 'ZAG', 28, 75, 6000, 110], ['Lucas Veríssimo', 'ZAG', 31, 77, 6500, 145], ['Gonzalo Escobar', 'LE', 29, 73, 3500, 85], ['Willian Arão', 'VOL', 34, 75, 3000, 125], ['João Schmidt', 'MC', 33, 74, 3000, 105], ['Gabriel Menino', 'MC', 25, 75, 7000, 120], ['Benjamín Rollheiser', 'PD', 26, 77, 10000, 145], ['Gabriel Barbosa', 'ATA', 30, 78, 9000, 210], ['Neymar Jr.', 'PE', 34, 82, 16000, 280], ['Diógenes', 'GOL', 25, 69, 1200, 30], ['Álvaro Barreal', 'PE', 26, 75, 7000, 120], ['Thaciano', 'MC', 31, 75, 5000, 115], ['Rony', 'ATA', 31, 76, 6500, 155], ['Robinho Jr.', 'PD', 18, 71, 5000, 35], ['Miguelito', 'MC', 22, 72, 4500, 55], ['Caballero', 'ATA', 24, 73, 5000, 75],
  ]),
  vasco: roster('vas', 'vasco', [
    ['Léo Jardim', 'GOL', 31, 77, 6000, 120], ['Puma Rodríguez', 'LD', 29, 74, 4500, 90], ['Robert Renan', 'ZAG', 23, 76, 9000, 110], ['Carlos Cuesta', 'ZAG', 27, 77, 9000, 135], ['Lucas Piton', 'LE', 25, 76, 9000, 120], ['Hugo Moura', 'VOL', 28, 74, 5000, 95], ['Tchê Tchê', 'MC', 34, 75, 3000, 120], ['Thiago Mendes', 'MC', 34, 76, 3500, 145], ['Adson', 'PD', 26, 74, 5500, 100], ['Brenner', 'ATA', 26, 76, 8500, 130], ['Hinestroza', 'PE', 24, 75, 7500, 105], ['Daniel Fuzato', 'GOL', 29, 72, 2500, 60], ['Rojas', 'MC', 30, 75, 5000, 115], ['Barros', 'VOL', 22, 71, 3000, 45], ['David', 'PE', 30, 74, 4000, 95], ['Nuno Moreira', 'PD', 27, 74, 5000, 90], ['Spinelli', 'ATA', 29, 73, 3500, 80], ['Matheus França', 'MC', 22, 75, 8000, 85],
  ]),
  botafogo: roster('bot', 'botafogo', [
    ['Kauan', 'GOL', 23, 73, 4000, 65], ['Mateo Ponte', 'LD', 23, 74, 5500, 85], ['Nahuel Ferraresi', 'ZAG', 28, 76, 6500, 120], ['Lucas M. Villalba', 'ZAG', 32, 76, 4500, 120], ['Alex Telles', 'LE', 33, 78, 5000, 170], ['Allan', 'VOL', 35, 76, 2500, 150], ['Danilo', 'MC', 25, 79, 15000, 190], ['Cristian Medina', 'MC', 24, 78, 13000, 155], ['Matheus Martins', 'PD', 23, 76, 9000, 110], ['Arthur Cabral', 'ATA', 28, 78, 11000, 170], ['Álvaro Montoro', 'PE', 19, 75, 10000, 70], ['Warleson', 'GOL', 30, 71, 1800, 45], ['Cristhian Loor', 'GOL', 20, 69, 1800, 30], ['Vitinho', 'LD', 27, 75, 6500, 115], ['Jordan Barrera', 'MC', 20, 73, 7000, 55], ['Santiago Rodríguez', 'ME', 26, 76, 8000, 125], ['José Kadir', 'ATA', 20, 72, 5000, 45], ['Marçal', 'LE', 37, 73, 900, 90],
  ]),
  fluminense: roster('flu', 'fluminense', [
    ['Fábio', 'GOL', 45, 76, 500, 100], ['Samuel Xavier', 'LD', 36, 74, 1000, 95], ['Thiago Silva', 'ZAG', 41, 79, 1500, 180], ['Igor Rabello', 'ZAG', 31, 75, 4000, 110], ['Guilherme Arana', 'LE', 29, 79, 12000, 180], ['Hércules', 'VOL', 25, 76, 8000, 115], ['Martinelli', 'MC', 24, 77, 10000, 120], ['Lucho Acosta', 'MC', 32, 78, 6500, 155], ['Jefferson Savarino', 'PD', 29, 77, 8500, 145], ['Germán Cano', 'ATA', 38, 77, 2200, 155], ['Kevin Serna', 'PE', 28, 76, 6500, 110], ['Vitor Eudes', 'GOL', 28, 71, 1800, 45], ['Nonato', 'MC', 28, 74, 4500, 90], ['Ganso', 'MC', 36, 76, 2200, 145], ['Agustín Canobbio', 'PD', 27, 77, 9000, 135], ['Hulk', 'ATA', 40, 78, 2500, 190], ['John Kennedy', 'ATA', 24, 75, 7000, 100], ['Soteldo', 'PE', 29, 76, 6000, 135],
  ]),
  cruzeiro: roster('cru', 'cruzeiro', [
    ['Cássio', 'GOL', 39, 78, 1800, 160], ['William', 'LD', 31, 77, 5500, 125], ['Fabrício Bruno', 'ZAG', 30, 80, 13000, 185], ['Lucas H. Villalba', 'ZAG', 31, 76, 5000, 115], ['Kaiki Bruno', 'LE', 23, 76, 8500, 100], ['Lucas Romero', 'VOL', 32, 77, 5000, 130], ['Lucas Silva', 'MC', 33, 76, 3500, 120], ['Matheus Pereira', 'MC', 30, 81, 15000, 210], ['Gabriel Pec', 'PD', 25, 78, 13000, 155], ['Kaio Jorge', 'ATA', 24, 79, 17000, 180], ['Luis Sinisterra', 'PE', 27, 78, 12000, 170], ['Matheus Cunha', 'GOL', 25, 74, 5000, 80], ['Matheus Henrique', 'MC', 28, 77, 9000, 135], ['Gerson', 'MC', 29, 81, 18000, 230], ['Wanderson', 'PE', 31, 75, 5000, 120], ['Luciano Rodríguez', 'ATA', 23, 77, 12000, 125], ['Neiser Villarreal', 'ATA', 21, 73, 7000, 60], ['Wesley', 'PD', 27, 75, 6500, 115],
  ]),
  'atletico-mg': roster('cam', 'atletico-mg', [
    ['Everson', 'GOL', 36, 78, 3000, 145], ['Natanael', 'LD', 24, 75, 6500, 100], ['Lyanco', 'ZAG', 29, 77, 7000, 140], ['Ruan Tressoldi', 'ZAG', 27, 76, 6500, 125], ['Renan Lodi', 'LE', 28, 79, 13000, 190], ['Alan Franco', 'VOL', 28, 76, 6000, 120], ['Alexsander', 'MC', 22, 76, 9500, 95], ['Gustavo Scarpa', 'MC', 32, 79, 7500, 185], ['Tomás Cuello', 'PD', 26, 76, 7500, 120], ['Cédric Bakambu', 'ATA', 35, 76, 3000, 150], ['Alan Minda', 'PE', 23, 75, 7000, 100], ['Gabriel Delfim', 'GOL', 24, 71, 2500, 45], ['Igor Gomes', 'MC', 27, 75, 5500, 105], ['Bernard', 'ME', 33, 76, 4000, 145], ['Reinier', 'MC', 24, 75, 6500, 105], ['Mateo Cassierra', 'ATA', 29, 77, 7000, 145], ['Dudu', 'PE', 34, 76, 3000, 160], ['Ibrahima Cissé', 'VOL', 25, 74, 5500, 90],
  ]),
  gremio: roster('gre', 'gremio', [
    ['Weverton', 'GOL', 38, 78, 2500, 155], ['João Pedro', 'LD', 29, 74, 4500, 95], ['Wagner Leonardo', 'ZAG', 27, 76, 6500, 115], ['Fabián Balbuena', 'ZAG', 35, 76, 2500, 135], ['Marlon', 'LE', 29, 76, 6500, 120], ['Villasanti', 'VOL', 29, 78, 9000, 145], ['Danilo', 'MC', 30, 77, 7000, 135], ['Arthur Melo', 'MC', 29, 79, 8000, 180], ['Tetê', 'PD', 26, 78, 11000, 155], ['Carlos Vinícius', 'ATA', 31, 77, 5500, 145], ['José Enamorado', 'PE', 27, 75, 6500, 105], ['Gabriel Grando', 'GOL', 26, 73, 4000, 70], ['Nardoni', 'VOL', 24, 75, 7500, 95], ['Krovinović', 'MC', 31, 76, 5500, 125], ['Francis Amuzu', 'PE', 27, 75, 6000, 110], ['Pavón', 'PD', 30, 76, 5500, 130], ['Martin Braithwaite', 'ATA', 35, 76, 2500, 155], ['Matheus Nascimento', 'ATA', 22, 74, 6500, 75],
  ]),
  internacional: roster('int', 'internacional', [
    ['Sergio Rochet', 'GOL', 33, 78, 5000, 145], ['Braian Aguirre', 'LD', 26, 74, 5000, 95], ['Félix Torres', 'ZAG', 29, 76, 6000, 125], ['Guillermo Maripán', 'ZAG', 32, 77, 4500, 145], ['Alexandro Bernabei', 'LE', 26, 77, 8000, 125], ['Thiago Maia', 'VOL', 29, 77, 7500, 140], ['Bruno Henrique', 'MC', 36, 74, 1800, 115], ['Alan Patrick', 'MC', 35, 78, 4000, 165], ['Kayky', 'PD', 23, 75, 7000, 95], ['Antonio Sanabria', 'ATA', 30, 77, 7500, 150], ['Johan Carbonero', 'PE', 27, 76, 7000, 120], ['Anthoni', 'GOL', 24, 71, 2500, 45], ['Rodrigo Villagra', 'VOL', 25, 76, 8000, 110], ['Calebe', 'MC', 26, 74, 5000, 90], ['Niclas Eliasson', 'PE', 30, 76, 6000, 130], ['Vitinho', 'PD', 27, 75, 6000, 110], ['Alerrandro', 'ATA', 26, 75, 6500, 105], ['Ronaldo', 'VOL', 29, 73, 3500, 80],
  ]),
  bahia: roster('bah', 'bahia', [
    ['Ronaldo', 'GOL', 29, 74, 4500, 85], ['Román Gómez', 'LD', 22, 74, 6000, 75], ['Kanu', 'ZAG', 29, 76, 6000, 115], ['Santiago Mingo', 'ZAG', 25, 77, 8500, 125], ['Luciano Juba', 'LE', 27, 76, 8000, 125], ['Nicolás Acevedo', 'VOL', 27, 76, 6500, 115], ['Caio Alexandre', 'MC', 27, 77, 8500, 130], ['Everton Ribeiro', 'MC', 37, 77, 1800, 165], ['Ademir', 'PD', 31, 75, 4500, 110], ['Willian José', 'ATA', 34, 77, 3500, 150], ['Erick Pulga', 'PE', 25, 76, 7500, 110], ['Guido Herrera', 'GOL', 34, 74, 2500, 80], ['David Duarte', 'ZAG', 31, 75, 4000, 100], ['Jean Lucas', 'MC', 28, 77, 7500, 135], ['Rodrigo Nestor', 'MC', 26, 76, 7500, 115], ['Kike Olivera', 'PD', 24, 75, 7000, 100], ['Sanabria', 'PE', 26, 74, 5500, 90], ['Ruan Pablo', 'ATA', 18, 72, 6000, 40],
  ]),
  vitoria: roster('vit', 'vitoria', [
    ['Lucas Arcanjo', 'GOL', 28, 73, 3500, 65], ['Nathan Mendes', 'LD', 23, 73, 5000, 70], ['Cacá', 'ZAG', 27, 74, 4500, 90], ['Federico Britez', 'ZAG', 34, 74, 2500, 100], ['Luan Cândido', 'LE', 25, 74, 5500, 85], ['Gabriel Baralhas', 'VOL', 27, 74, 4500, 90], ['Edenílson', 'MC', 36, 74, 1800, 105], ['Emmanuel Martínez', 'MC', 32, 75, 3500, 105], ['Marinho', 'PD', 36, 75, 1800, 125], ['Renato Kayzer', 'ATA', 30, 74, 4000, 95], ['Diego Tarzia', 'PE', 23, 73, 5000, 70], ['Fintelman', 'GOL', 28, 69, 1200, 30], ['Ramon', 'LE', 25, 72, 3500, 65], ['Pochettino', 'MC', 30, 75, 4500, 110], ['Matheuzinho', 'MC', 28, 75, 5000, 105], ['Osvaldo', 'PE', 39, 71, 500, 70], ['Erick', 'PD', 28, 73, 3500, 80], ['Renê', 'ATA', 22, 71, 3000, 45],
  ]),
  'athletico-pr': roster('cap', 'athletico-pr', [
    ['Mycael', 'GOL', 22, 74, 6000, 70], ['Gastón Benavídez', 'LD', 30, 75, 4500, 100], ['Agustín Terán', 'ZAG', 22, 74, 6000, 75], ['Kevin Aguirre', 'ZAG', 27, 75, 5500, 100], ['Lucas Esquivel', 'LE', 24, 76, 7500, 105], ['Juan Portilla', 'VOL', 27, 76, 6500, 115], ['Luiz Gustavo', 'MC', 26, 74, 5000, 90], ['Bruno Zapelli', 'MC', 24, 77, 10000, 120], ['Vitinho', 'PD', 27, 76, 7500, 120], ['Kevin Viveros', 'ATA', 26, 77, 8500, 130], ['Kerwin Vargas', 'PE', 24, 75, 7000, 100], ['Santos', 'GOL', 36, 75, 2000, 110], ['Gilberto', 'LD', 33, 73, 2500, 85], ['João Cruz', 'MC', 20, 72, 5500, 55], ['Dudu', 'ME', 20, 72, 5000, 50], ['Mendoza', 'PE', 34, 74, 2500, 105], ['Renan Peixoto', 'ATA', 20, 71, 4500, 45], ['Felipinho', 'VOL', 24, 73, 4500, 75],
  ]),
  coritiba: roster('cfc', 'coritiba', [
    ['Pedro Morisco', 'GOL', 22, 73, 5000, 60], ['JP Chermont', 'LD', 20, 72, 5000, 55], ['Tiago Coser', 'ZAG', 22, 72, 4500, 55], ['Maicon', 'ZAG', 37, 73, 1000, 95], ['Bruno Melo', 'LE', 33, 73, 2500, 85], ['Sebastián Gómez', 'VOL', 30, 74, 4000, 95], ['Thiago Santos', 'MC', 36, 73, 1300, 90], ['Josué', 'MC', 35, 75, 2500, 110], ['Lucas Ronier', 'PD', 21, 73, 5500, 60], ['Pedro Rocha', 'ATA', 31, 74, 3500, 100], ['Lavega', 'PE', 21, 73, 5500, 60], ['Keiller', 'GOL', 29, 72, 2500, 55], ['Willian Oliveira', 'MC', 33, 73, 2500, 75], ['Fabinho', 'MC', 24, 72, 4000, 65], ['Breno Lopes', 'PE', 30, 74, 4000, 100], ['Fernando', 'ATA', 27, 73, 4000, 80], ['Rodrigo Rodrigues', 'ATA', 30, 72, 3000, 75], ['Renato', 'LD', 35, 71, 1200, 60],
  ]),
  'red-bull-bragantino': roster('rbb', 'red-bull-bragantino', [
    ['Cleiton', 'GOL', 29, 76, 6500, 110], ['Andrés Hurtado', 'LD', 27, 74, 5000, 90], ['Gustavo Marques', 'ZAG', 24, 74, 5500, 85], ['Alix Vinícius', 'ZAG', 26, 75, 6000, 95], ['Vanderlan', 'LE', 24, 75, 7000, 100], ['Gabriel Girotto', 'VOL', 34, 75, 2500, 115], ['Eric Ramires', 'MC', 26, 75, 6500, 100], ['Matheus Fernandes', 'MC', 28, 76, 6500, 115], ['Lucas Barbosa', 'PD', 25, 76, 7500, 110], ['Isidro Pitta', 'ATA', 27, 76, 7000, 120], ['Henry Mosquera', 'PE', 24, 75, 7000, 100], ['Tiago Volpi', 'GOL', 35, 74, 2000, 105], ['Nacho Sosa', 'MC', 22, 73, 5500, 70], ['Fabinho', 'VOL', 24, 74, 5500, 80], ['Marcelinho', 'PD', 23, 73, 5000, 70], ['Vinicinho', 'PE', 22, 72, 4500, 60], ['Eduardo Sasha', 'ATA', 34, 74, 2500, 105], ['Fernando', 'ATA', 20, 72, 5000, 55],
  ]),
  mirassol: roster('mir', 'mirassol', [
    ['Walter', 'GOL', 38, 74, 1200, 85], ['Daniel Borges', 'LD', 33, 73, 2200, 75], ['Lucas Oliveira', 'ZAG', 30, 74, 3500, 85], ['Willian Machado', 'ZAG', 29, 73, 3500, 80], ['Reinaldo', 'LE', 36, 74, 1500, 100], ['Cazonatti', 'VOL', 30, 73, 3000, 75], ['Wallisson', 'MC', 28, 74, 4000, 80], ['Shaylon', 'MC', 29, 75, 4500, 95], ['Gustavo Mosquito', 'PD', 28, 74, 4000, 90], ['André Luís', 'ATA', 32, 74, 3000, 90], ['Negueba', 'PE', 26, 73, 3500, 75], ['Alex Muralha', 'GOL', 36, 72, 1000, 70], ['Chico', 'MC', 31, 73, 3000, 75], ['José Aldo', 'MC', 28, 73, 3500, 75], ['Fernandinho', 'PE', 29, 74, 4000, 85], ['Alesson', 'PD', 27, 73, 3500, 75], ['Edson Carioca', 'ATA', 27, 72, 3000, 65], ['Carlos Eduardo', 'ATA', 29, 73, 3500, 75],
  ]),
  remo: roster('rem', 'remo', [
    ['Marcelo Rangel', 'GOL', 38, 72, 800, 65], ['Matheus Alexandre', 'LD', 27, 72, 3000, 65], ['Marllon', 'ZAG', 34, 73, 1800, 80], ['Zé Ivaldo', 'ZAG', 29, 74, 3500, 90], ['Léo Andrade', 'LE', 28, 72, 2800, 65], ['José Welison', 'VOL', 31, 74, 3000, 90], ['Edson Fernando', 'MC', 27, 72, 3000, 65], ['Vitor Bueno', 'MC', 32, 75, 3500, 105], ['Galeano', 'PD', 26, 73, 3500, 75], ['Alessandro Poveda', 'ATA', 29, 73, 3000, 80], ['Jajá', 'PE', 25, 73, 3500, 75], ['Ygor Vinhas', 'GOL', 32, 70, 1200, 45], ['Leonel Picco', 'VOL', 27, 73, 3500, 75], ['Jaderson', 'MC', 25, 72, 3000, 65], ['Alef Manga', 'PE', 31, 74, 2800, 90], ['Taliari', 'ATA', 29, 72, 2500, 65], ['Eduardo', 'PD', 35, 72, 1200, 70], ['Patrick', 'MC', 34, 73, 1800, 80],
  ]),
  chapecoense: roster('cha', 'chapecoense', [
    ['Rafael Santos', 'GOL', 37, 72, 900, 65], ['Heitor', 'LD', 25, 72, 3000, 65], ['Rafael Thyere', 'ZAG', 33, 74, 2200, 85], ['Edu Doma', 'ZAG', 27, 73, 3500, 75], ['Bruno Pacheco', 'LE', 34, 73, 1800, 80], ['Vinícius Balieiro', 'VOL', 27, 73, 3200, 70], ['Higor Meritão', 'MC', 32, 73, 2500, 80], ['Camilo', 'MC', 40, 73, 500, 80], ['Bruno Tubarão', 'PD', 31, 73, 2500, 80], ['Yannick Bolasie', 'ATA', 37, 74, 1200, 100], ['Ênio', 'PE', 25, 73, 3500, 70], ['Neto', 'GOL', 35, 70, 800, 50], ['Everton', 'ZAG', 27, 71, 2500, 60], ['Yago Felipe', 'MC', 31, 73, 2500, 80], ['Giovanni Augusto', 'MC', 36, 73, 1200, 85], ['Marcinho', 'PD', 31, 72, 2200, 70], ['Perotti', 'ATA', 28, 73, 3000, 75], ['Garcez', 'PE', 29, 72, 2500, 65],
  ]),
}

export const marketPlayers: Player[] = [playersByClub.santos[10], playersByClub.santos[9], playersByClub.fluminense[15], playersByClub.cruzeiro[9], playersByClub.fluminense[8], playersByClub.internacional[7], playersByClub.bahia[4], playersByClub.gremio[8]]

export const financesByClub = {
  flamengo: { budget: 85000, wageLimit: 4200 },
  palmeiras: { budget: 75000, wageLimit: 3600 },
  corinthians: { budget: 48000, wageLimit: 3200 },
  'sao-paulo': { budget: 45000, wageLimit: 3000 },
  santos: { budget: 42000, wageLimit: 3000 }, vasco: { budget: 38000, wageLimit: 2800 }, botafogo: { budget: 60000, wageLimit: 3400 }, fluminense: { budget: 45000, wageLimit: 3100 },
  cruzeiro: { budget: 62000, wageLimit: 3500 }, 'atletico-mg': { budget: 58000, wageLimit: 3500 }, gremio: { budget: 47000, wageLimit: 3100 }, internacional: { budget: 48000, wageLimit: 3100 },
  bahia: { budget: 60000, wageLimit: 3300 }, vitoria: { budget: 22000, wageLimit: 2100 }, 'athletico-pr': { budget: 40000, wageLimit: 2700 }, coritiba: { budget: 24000, wageLimit: 2200 },
  'red-bull-bragantino': { budget: 42000, wageLimit: 2800 }, mirassol: { budget: 22000, wageLimit: 2000 }, remo: { budget: 17000, wageLimit: 1800 }, chapecoense: { budget: 16000, wageLimit: 1750 },
}
