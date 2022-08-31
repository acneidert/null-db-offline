
async function migrate(context) {
    await context.start();
    const { _database, _models } = context;
    for (model in _models){
      await _models[model]._initDbServer({
        _database, 
        force:FORCE, 
        schema: _models[model]._getSchema(), 
        table: _models[model]._getTable()
      })
    }
    process.exit(0);
  }