import { CliUx, Command } from '@oclif/core'
import Web3 from 'web3'
import userConfig from '../../config'
import fs from 'fs'
import os from 'os'
import exchangeJson from '../../abis/exchange.json'
import { AbiItem } from 'web3-utils'

export default class ExchangeReturnFunds extends Command {
  static description = 'Cancel a job and return funds'

  static flags = {}

  static args = [
    { name: 'jobId', description: 'id of the job to cancel', required: true },
  ]

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]
  public async run(): Promise<void> {
    const {
      args
    } = await this.parse(ExchangeReturnFunds)
    const web3 = new Web3(userConfig.get('provider').maticMumbai)
    const baseDir = os.homedir() + '/.openlab'
    if (!fs.existsSync(baseDir + '/wallet.json')) {
      this.log("Wallet doesn't exist")
    }
    else {
      const exchangeAddress = userConfig.get('contracts').maticMumbai.exchange
      const password = await CliUx.ux.prompt('Enter a password to decrypt your wallet', { type: 'hide' })
      const keystoreJsonV3 = JSON.parse(fs.readFileSync(baseDir + '/wallet.json', 'utf-8'))
      const account = web3.eth.accounts.decrypt(keystoreJsonV3, password)
      web3.eth.accounts.wallet.add(account)

      //call returnFunds
      this.log(`Cancelling Job...`)
      const exchangeContract = new web3.eth.Contract(exchangeJson as AbiItem[], exchangeAddress)
      const tx = await exchangeContract.methods.returnFunds(args.jobId).send({ 'from': account.address, 'gasLimit': 500000, 'gasPrice': web3.utils.toWei('30', 'gwei') })
      this.log(`Job Cancelled Successfully`)
      this.log(`https://mumbai.polygonscan.com/tx/${tx.transactionHash}`)
    }
  }
}
