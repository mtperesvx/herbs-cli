const { objToString } = require('../../utils')
const startCase = require('lodash.startcase');
const { filesystem } = require('gluegun')
const path = require('path')
const fs = require('fs')


function generateEntities(from, to, level = './') {
  let requires = {}
  fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach(element => {
    if (fs.lstatSync(path.join(from, element)).isFile()) {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
      const splittedElement = element.split('.')
      const ext = splittedElement.pop()
      if (ext === 'js') {
        const entity = require(`${to}/${element}`)
        requires[entity.name] = `require('${level}${element}')`
      }
    }
    else{
      const result = generateEntities(path.join(from, element), path.join(to, element), `${level}${element}/`);
      requires = Object.assign(requires, result)
    }
  })
  return requires
}

module.exports = async ({ generate, options: { entities = ''} }) => async () => {
  let requires = {}
  if (entities && entities !== true) {
    requires = await generateEntities(entities, `${filesystem.cwd()}/src/domain/entities`)
  } else {
    await generate({
      template: 'domain/entities/user.ejs',
      target: 'src/domain/entities/user.js',
    })
    requires['user'] = `require('./user.js')`
  }

  await generate({
    template: 'domain/entities/index.ejs',
    target: 'src/domain/entities/index.js',
    props: { requires: objToString(requires) }
  })
}
