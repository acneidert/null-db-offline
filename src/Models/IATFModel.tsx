import Model from '../Database/Model';
import { ModelTypes, schemaType } from '../Database/Model/types';

type Props = ModelTypes & {
    /** FazendaModel needs this */
  }

class IATFModel extends Model<Props> {
    table: string = 'iatf';
    schema: schemaType = {
        columns: [
            {name: 'data', type: 'DATE'},
            {name: 'id_fazenda', type: 'STRING'},
        ]
    }
}

export default IATFModel;