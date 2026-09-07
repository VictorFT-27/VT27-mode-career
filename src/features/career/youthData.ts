import type { Player } from './realData'

const firstNames = ['Caio', 'Davi', 'Enzo', 'Gabriel', 'João', 'Kauã', 'Lucas', 'Matheus', 'Miguel', 'Pedro', 'Rafael', 'Vinícius']
const lastNames = ['Almeida', 'Barbosa', 'Cardoso', 'Dias', 'Freitas', 'Gomes', 'Lima', 'Mendes', 'Nascimento', 'Oliveira', 'Pereira', 'Santos']
const positions = ['GOL', 'LD', 'ZAG', 'ZAG', 'LE', 'VOL', 'MC', 'MC', 'PD', 'ATA', 'PE', 'ATA']

export const youthPlayers: Player[] = Array.from({ length: 60 }, (_, index) => {
  const position = positions[index % positions.length]
  const rating = 58 + index % 10
  return { id: `base${index + 1}`, name: `${firstNames[index % firstNames.length]} ${lastNames[(index * 5 + Math.floor(index / firstNames.length)) % lastNames.length]}`, position, age: 16 + index % 3, rating, value: 900 + (rating - 58) * 250, wage: 18 + (rating - 58) * 3 }
})
