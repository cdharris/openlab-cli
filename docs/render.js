const helpdata = require('./helpdata.json')
const { exec } = require("child_process")
const fs = require('fs')

const transformCommand = c => {
  c.globalFlags = c._globalFlags
  delete c._globalFlags
  return c
}

const recordExample = async (e, c) => {
  console.log('RECORDING EXAMPLE')
  const cmd = e
    .replace(/<%= config.bin %>/, './bin/dev')
    .replace(/<%= command.id %>/, c.id.split(':').join(' '))
  console.log('EXECUTING: ' + cmd)
  process.chdir(__dirname + '/..')
  return new Promise((resolve, _reject) => {
    exec(cmd, (error, stdout, stderr) => {
      console.log('OUTPUT:' +  stdout + stderr)
      resolve({ input: e, output: stdout })
    })
  })
}

const recordExamples = async c => {
  c.examples = c.examples || []
  const examples = await Promise.all(c.examples.map(e => recordExample(e, c)))
  return Object.assign({}, c, { examples })
}

const renderCommand = c => {
  const md = `
## \`openlab ${c.id.split(':').join(' ')}\`

${c.description}

### args

${c.args.map(a => `- \`${a.name}\`: ${a.description}`)}

### flags

${Object.values(c.flags).map(f => `- \`--${f.name}\`${f.char ? ' / \`-' + f.char + '\`' : ''}:  ${f.description}`).join('\n')}
  `
  return md
}

const renderApp = a => a.commands
  .map(renderCommand)
  .map(c => c.replace(/<%= config.bin %>/, 'openlab'))
  .join('\n')

async function run() {
  const output = Object.assign({}, helpdata)
  output.commands = await Promise.all(
    helpdata.commands
      .map(transformCommand)
      .map(recordExamples)
  )

  // console.log(renderApp(output))

  fs.writeFileSync(__dirname + '/cli.api.json', JSON.stringify(helpdata))
}

run()