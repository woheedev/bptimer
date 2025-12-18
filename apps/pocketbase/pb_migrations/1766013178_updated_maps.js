/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_1612934933');

    // add field
    collection.fields.addAt(
      4,
      new Field({
        hidden: false,
        id: 'json1951786068',
        maxSize: 0,
        name: 'region_data',
        presentable: false,
        required: true,
        system: false,
        type: 'json'
      })
    );

    return app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_1612934933');

    // remove field
    collection.fields.removeById('json1951786068');

    return app.save(collection);
  }
);
