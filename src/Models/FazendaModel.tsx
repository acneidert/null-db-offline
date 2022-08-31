import Model from '../Database/Model';
import { ModelTypes, schemaType } from '../Database/Model/types';

type Props = ModelTypes & {
  /** FazendaModel needs this */
}

class FazendaModel extends Model<Props> {
  table: string = 'fazenda';
  schema: schemaType = {
    columns: [
        {name: 'nome', type: 'STRING'},
        {name: 'produtor', type: 'STRING'},
        {name: 'local', type: 'STRING'},
        {name: 'obs', type: 'STRING'}
    ]
  }
}

export default FazendaModel;