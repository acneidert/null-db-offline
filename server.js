import Nullstack from 'nullstack';
import Application from './src/Application';
import { server } from './src/Database/server';
import FazendaModel from './src/Models/FazendaModel';
import IATFModel from './src/Models/IATFModel';

let context = Nullstack.start(Application);

context.start = async function start() {
  context = await server(context, {
    dbname: 'dbCapacitor', 
    host: 'localhost',
    user: 'root',
    pass: '',
    models: [
      FazendaModel,
      IATFModel
    ],
    force: true,
  })
}

export default context;