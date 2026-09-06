export type CareerMode = 'coach' | 'player' | 'director'
export type Club = { id: string; name: string; initials: string; city: string; color: string; reputation: string; objective: string; description: string }
export type Career = { mode: 'coach'; name: string; clubId: string; formation: string }
export const modes: { id: CareerMode; title: string; subtitle: string; number: string; description: string; available: boolean }[] = [
  { id: 'coach', title: 'Treinador', subtitle: 'À beira do campo', number: '01', description: 'Dê identidade ao time. Escolha seu clube, organize o elenco e prepare sua estratégia.', available: true },
  { id: 'player', title: 'Jogador', subtitle: 'Dentro das quatro linhas', number: '02', description: 'Construa sua trajetória em campo. Treinos, evolução e escolhas que definem uma carreira.', available: false },
  { id: 'director', title: 'Dirigente', subtitle: 'Nos bastidores do clube', number: '03', description: 'Pense além da próxima partida. Mercado, estrutura e planejamento para o futuro do clube.', available: false },
]
export const clubs: Club[] = [
  { id: 'aurora', name: 'Aurora FC', initials: 'AFC', city: 'Belo Horizonte · MG', color: '#b7ec57', reputation: 'Projeto em ascensão', objective: 'Construir uma equipe competitiva', description: 'Um elenco jovem e espaço para colocar suas ideias em prática.' },
  { id: 'porto', name: 'Porto Azul', initials: 'PA', city: 'Santos · SP', color: '#68c3ff', reputation: 'Tradição e cobrança', objective: 'Brigar pelas primeiras posições', description: 'Um clube ambicioso que espera um treinador à altura da sua história.' },
  { id: 'serra', name: 'União da Serra', initials: 'US', city: 'Caxias do Sul · RS', color: '#f4af77', reputation: 'Desafio de reconstrução', objective: 'Desenvolver o elenco', description: 'Uma torcida próxima e a oportunidade de iniciar um novo ciclo.' },
]
export const squad = [
  { name: 'Rafael Costa', position: 'GOL', age: 28, rating: 72 },
  { name: 'Caio Mendes', position: 'LD', age: 23, rating: 68 },
  { name: 'Lucas Rocha', position: 'ZAG', age: 29, rating: 73 },
  { name: 'Bruno Alves', position: 'ZAG', age: 25, rating: 70 },
  { name: 'Pedro Lima', position: 'LE', age: 21, rating: 69 },
  { name: 'André Santos', position: 'VOL', age: 27, rating: 72 },
  { name: 'Diego Martins', position: 'MC', age: 24, rating: 71 },
  { name: 'Gabriel Reis', position: 'MC', age: 22, rating: 74 },
  { name: 'João Vitor', position: 'PD', age: 20, rating: 70 },
  { name: 'Matheus Silva', position: 'ATA', age: 26, rating: 75 },
  { name: 'Felipe Nunes', position: 'PE', age: 23, rating: 71 },
]
const key = 'vt27.career.v1'
export function loadCareer(): Career | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? 'null')
    if (!value || typeof value !== 'object') return null
    const c = value as Partial<Career>
    return c.mode === 'coach' && typeof c.name === 'string' && c.name.trim().length > 0 && c.name.length <= 40 && clubs.some(club => club.id === c.clubId) && ['4-3-3', '4-4-2', '3-5-2'].includes(c.formation ?? '') ? c as Career : null
  } catch { return null }
}
export function saveCareer(career: Career): boolean {
  try { localStorage.setItem(key, JSON.stringify(career)); return true } catch { return false }
}
