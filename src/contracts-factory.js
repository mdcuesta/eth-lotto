import LotteryMeta from '../build/contracts/Lottery.json';

export class ContractsFactory {
  constructor(web3) {
    this.web3 = web3;
  }

  createLotteryContract() {
    const Lottery = this.web3.eth.contract(LotteryMeta.abi);
    const lotteryContract = Lottery.at(LotteryMeta.networks["5777"].address);
    return lotteryContract;
  }
}

export const createContractsFactory = (web3) => {
  return new ContractsFactory(web3);
}
