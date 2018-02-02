pragma solidity ^0.4.19;

contract Lottery {
	
	struct Ticket {
		address owner;
		uint[] numbers;
		uint blockNumber;
		uint timeStamp;
	}

	struct Draw {
		Ticket[] tickets;
		bool isDrawn;
		bool isOpen;
		uint ticketPrice;
		Ticket[] winners;
		uint[] result;
	}

	uint constant MIN_NUMBER = 1;
	uint constant MAX_NUMBER = 42;
	uint constant NUMBER_COUNT = 6;
	uint ticketPrice = 1000000000000000000; // in Wei
	address public organizer;
	uint public pot; // in Wei
	Draw[] public draws;
	Draw public currentDraw;

	modifier restricted() {
   	if (msg.sender == organizer) _;
  }

	event BuyTicket(address from, uint amount); 
	event NewDraw(uint pot);
	event NewDrawFailed();

	function Lottery() public {
		organizer = msg.sender;
	}

	function buyTicket(uint[] numbers) public payable {
		// organizer is not allowed to buy ticket for fairness
		if (msg.sender == organizer) {
			revert();
		}
		// check if a draw exist
		if (draws.length < 1) {
			revert();
		}

		// check if current draw is still open
		if (!currentDraw.isOpen) {
			revert();
		}

		// check draw ticket price
		if (msg.value != currentDraw.ticketPrice) {
			revert();
		}
		
		if (!validNumbers(numbers)) {
			revert();
		}

		Ticket memory ticket = Ticket({
			owner: msg.sender,
			numbers: numbers,
			blockNumber: block.number,
			timeStamp: now
		});

		pot+= msg.value;

		currentDraw.tickets.push(ticket);

		BuyTicket(msg.sender, msg.value);
	}

	function setDrawResult(uint[] result) public restricted returns (bool success) {
		if (draws.length < 1) {
			revert();
		}

		if (currentDraw.isOpen) {
			revert();
		}

		if (!validNumbers(result)) {
			revert();
		}

		currentDraw.result = result;

		for (uint ticketIndex = 0; ticketIndex < currentDraw.tickets.length; ticketIndex++) {
			if (isWinner(result, currentDraw.tickets[ticketIndex].numbers)) {
				currentDraw.winners.push(currentDraw.tickets[ticketIndex]);
			}
		}

		uint wonAmount = pot / currentDraw.winners.length;

		for (uint winnerIndex = 0; winnerIndex < currentDraw.winners.length; winnerIndex++) {
			if (!currentDraw.winners[winnerIndex].owner.send(wonAmount)) {
				revert();
			}
		}

		currentDraw.isDrawn = true;

		return currentDraw.isDrawn;
	}

	function newDraw() public payable restricted {
		
		if (draws.length > 0) {

			if (!currentDraw.isDrawn) {
				NewDrawFailed();
				revert();
			}
		}

		uint drawIndex = draws.length++;

		Draw storage draw = draws[drawIndex];
		draw.isOpen = true;
		draw.isDrawn = false;
		draw.ticketPrice = ticketPrice;
		pot+= msg.value;
		currentDraw = draw;

		NewDraw(pot);
	}

	function closeDraw() public restricted {
		if (draws.length < 1) {
			revert();
		}

		currentDraw.isOpen = false;
	}

	function setTicketPrice(uint newPrice) public restricted returns (bool success) {
		ticketPrice = newPrice;
		return true;
	}

	function isDrawOpen() public view returns (bool isOpen) {
		if (draws.length < 1) {
			return false;
		}

		return currentDraw.isOpen;
	}

	function isOwner() public view returns (bool owner) {
		return msg.sender == organizer;
	}

	function isWinner(uint[] result, uint[] numbers) internal pure returns (bool winner) {
		for (uint i = 0; i < result.length; i++) {
			if (result[i] != numbers[i]) {
				return false;
			}
		}

		return true;
	}

	function validNumbers(uint[] numbers) internal pure returns (bool valid) {
		if (numbers.length != NUMBER_COUNT) {
			return false;
		}

		for(uint i = 0; i < NUMBER_COUNT; i++) {
			if (!validNumber(numbers[i])) {
				return false;
			}

			if (!uniqueNumber(numbers[i], i, numbers)) {
				return false;
			}
		}

		return true;
	}

	function validNumber(uint number) internal pure returns (bool valid) {
		return number >= MIN_NUMBER && number <= MAX_NUMBER;
	}

	function uniqueNumber(uint number, uint index, uint[] numbers) internal pure returns (bool unique){
		for(uint i = 0; i < NUMBER_COUNT; i++) {
			if (i != index) {
				if (number == numbers[i]) {
					return false;
				}
			}
		}
		return true;
	}
}