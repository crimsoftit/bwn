
import { context, Context,ContractPromiseBatch, logging, PersistentMap, RNG, storage, u128 } from 'near-sdk-as'

enum GameState {
	Created,
	Joined,
	Ended
}

@nearBindgen
export class Roulette {
	gameId: u32;
	player: string;
	guess: boolean;
	initialAmount: u128;
	betAmount: u128;
	winner: string;
	gameState: GameState;

	constructor () {
		const rng = new RNG<u32>(1, u32.MAX_VALUE);
		const roll = rng.next();
		this.gameId = roll;
		this.player = "None";
		this.betAmount = u128.Zero;
		this.guess = false;
		this.initialAmount = context.attachedDeposit;
		this.gameState = GameState.Created;
		this.winner = context.sender;
	}
}

const gameMap = new PersistentMap<u32, Roulette>('r');

export function createGame (): u32 {
	const roulette = new Roulette();
	gameMap.set(roulette.gameId, roulette);
	return roulette.gameId;
}

export function joinGame (_gameId: u32, _guess: boolean): void {
	const game = gameMap.getSome(_gameId);
	game.player = context.sender;
	game.guess = _guess;
	game.betAmount = context.attachedDeposit;
	gameMap.set(_gameId, game);
}

export function endGame (_gameId: u32): string {
	const game = gameMap.getSome(_gameId);
	const rng = new RNG<u32>(1, u32.MAX_VALUE);
	const winning_num = rng.next();

	if (winning_num % 2 == 1) {
		if (game.guess == false) {
			game.winner = game.player;
		}
	} else {
		if (game.guess == true) {
			game.winner = game.player;
		}
	}

	gameMap.set(_gameId, game);

	const to_beneficiary = ContractPromiseBatch.create(game.winner);
	to_beneficiary.transfer(u128.add(game.betAmount, game.initialAmount));
	return game.winner;
}
