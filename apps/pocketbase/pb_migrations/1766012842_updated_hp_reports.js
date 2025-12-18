/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_3114863239');

    // add field
    collection.fields.addAt(
      4,
      new Field({
        autogeneratePattern: '',
        hidden: false,
        id: 'text258142582',
        max: 5,
        min: 1,
        name: 'region',
        pattern: '',
        presentable: false,
        primaryKey: false,
        required: true,
        system: false,
        type: 'text'
      })
    );

    return app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_3114863239');

    // remove field
    collection.fields.removeById('text258142582');

    return app.save(collection);
  }
);
