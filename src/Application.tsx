import Nullstack, { NullstackClientContext, NullstackEnvironment, NullstackNode, NullstackPage, NullstackParams, NullstackProject, NullstackRouter, NullstackSettings, NullstackWorker } from 'nullstack';
import Model from './Database/Model'
import './Application.css';

function syntaxHighlight(json) {
  if (typeof json != 'string') {
       json = JSON.stringify(json, undefined, 2);
  }
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
      var cls = 'number';
      if (/^"/.test(match)) {
          if (/:$/.test(match)) {
              cls = 'key';
          } else {
              cls = 'string';
          }
      } else if (/true|false/.test(match)) {
          cls = 'boolean';
      } else if (/null/.test(match)) {
          cls = 'null';
      }
      return '<span class="' + cls + '">' + match + '</span>';
  });
}

declare function Head(): typeof Application.prototype.renderHead

class Application extends Nullstack {

  prepare({ page }: NullstackClientContext) {
    page.locale = 'pt-BR';
  }

  id = ''
  nome= ''
  produtor =''
  local =''

  list = null

  async handleResetDb({_models}) {
    _models.fazenda.initDatabase({force:true});
    console.log(await _models.fazenda.getById({id: 'a329833a-0a5f-4b9c-b8f8-67e70a07ea6b'}));
  }

  async listAll({_models}) {
    this.list = await _models.fazenda.list()
  }
  async updateItem({_models}){
    await _models.fazenda.upsert({
      id: this.id,
      data: {
        nome: this.nome, 
        produtor: this.produtor, 
        local: this.local, 
      }
    })
  }
  async delete({_models}){
    await _models.fazenda.delete({
      id: this.id,
    })
  }
  async add({_models}){
    await _models.fazenda.create({
      data: {
        nome: this.nome, 
        produtor: this.produtor, 
        local: this.local, 
      }
    })
  }
  async getItem({_models}){
    const me = await _models.fazenda.getById({
      id: this.id,
    })
    this.nome = me.nome
    this.produtor = me.produtor
    this.local = me.local
  }

  async hydrate({worker}) {
    console.log(worker);
    
    window.addEventListener("activate", () => {console.log('Hellor')})
    window.addEventListener("install", () => {console.log('Hellor')})
  }
  async sync({_models}){
    await _models.fazenda.sync();
  }
  clean(){
    this.id =''
    this.nome =''
    this.produtor = ''
    this.local = ''
  }
  renderHead() {
    return (
      <head>
        <link
          href="https://fonts.gstatic.com" rel="preconnect" />
        <link
          href="https://fonts.googleapis.com/css2?family=Crete+Round&family=Roboto&display=swap"
          rel="stylesheet" />
      </head>
    )
  }

  render() {
    return (
      <main>
        <Head />
        <button onclick={this.handleResetDb}> Reset DB</button>
        <button onclick={this.add}> Add Item</button>
        <button onclick={this.updateItem}> Update Item</button>
        <button onclick={this.getItem}> Get Item</button>
        <button onclick={this.clean}>Clean</button>
        <button onclick={this.sync}>SYNC</button>
        <button onclick={this.delete}>Delete</button>
        <input type="text" bind={this.id} placeholder="ID" /><br/>
        <input type="text" bind={this.nome} placeholder="NOME" /><br/>
        <input type="text" bind={this.produtor} placeholder="PRODUTOR" /><br/>
        <input type="text" bind={this.local} placeholder="LOCAL"/>
        <button onclick={this.listAll}>List All</button>
        <pre html={syntaxHighlight(this.list)}></pre>
      </main>
    )
  }

}

export default Application;