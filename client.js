import Nullstack from 'nullstack';
import Application from './src/Application';
import { client } from './src/Database/client';
import FazendaModel from './src/Models/FazendaModel';
import IATFModel from './src/Models/IATFModel';

let context = Nullstack.start(Application);

context.start = async function start() {
  context = client(context, {
    dbname: 'dbCapacitor', 
    models: [
      FazendaModel,
      IATFModel
    ],
    force: true,
  })
}

export default context;