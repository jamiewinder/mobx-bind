**NOT YET PUBLISHED**

# mobx-bind

A small set of utilties for binding MobX observables and observable collections to generic entities

## Principles:

A 'model' is your data representation of a object, which typically contains MobX-observable properties. An 'entity' is something that is derived from your models, or more typically collections of your models.

## Use Case: Google Maps

You may have `PointOfInterest` models which you want to map to `Marker` object. The binding between the two is managed through a EntityLifecycle object:

```typescript
export interface EntityLifecycle<TModel, TEntity, TContext> {
    /**
     * Creates an entity to represent the model
     */
    create(model: TModel, context?: TContext): TEntity;

    /**
     * Updates the entity based on the observable model data. This function will be wrapped in
     * `autorun` which means changes to your model are mapped to your entity automatically
     */
    update(model: TModel, entity: TEntity, context?: TContext): void;

    /**
     * Destroys the entity
     */
    destroy(model: TModel, entity: TEntity, context?: TContext): void;
}

```

For example:

```typescript
import { observable } from 'mobx';
import { bindModel, EntityLifecycle } from 'mobx-bind';

class PointOfInterest {
    constructor(id: string, name: string, position: [number, number]) {
        this.id = id;
        this.name = name;
        this.position = position;
    }
    public readonly id: string;
    @observable public name: string;
    @observable public position: [number, number];
}

const myMap = new google.maps.Map(...);

const pointOfInterestEntityLifecycle: EntityLifecycle<PointOfInterest, google.maps.Marker, void> = {
    create(model) {
        // `create` is called in order to create a Marker for your model. Note that `update` is always called immediately
        // following `create` so the only code needed here is that specific to the creation of the entity, not necessarily
        // the whole initialization
        return new google.maps.Marker({ map: myMap });
    },
    update(model, entity) {
        // The library will wrap `update` in an `autorun`, causing it to rerun every time the applicable parts of
        // your model changes. Google Maps' Marker has a `setOptions` method which allows us to do this conveniently
        entity.setOptions({
            title: model.name,
            position: new google.maps.LatLng(model.position[0], model.position[1])
        });
    },
    destroy(model, entity) {
        // `destroy` is called when you `dispose` your bound model, or it is removed from a bound collection.
        // This lets you clean up your entity.
        entity.setMap(null);
    }
};

const myPoi = new PointOfInterest('Buckingham Palace', [51.501476, -0.140634]);
bindModel(myPoi, pointOfInterestEntityLifecycle);

// Changing your model will automatically update your entity
setTimeout(() => myPoi.name = "The Queen's House", 1000);
```

Perhaps more useful is the ability to bind to a collection of models, which will automatically manage the creation and destruction of entities for those models. This can be done with either `IObservableArray`s or `ObservableMap`s using `bindArray` and `bindMap`.

```typescript
import { observable } from 'mobx';
import { bindMap } from 'mobx-bind';

const myPois = observable.shallowMap([
    new PointOfInterest('1', 'Buckingham Palace', [51.501476, -0.140634]),
    new PointOfInterest('2', 'Big Ben', [51.510357, -0.116773]),
    new PointOfInterest('3', 'Natural History Museum', [51.495915, -0.176366])
].map((model) => [model.id, model]));
bindMap(myPois, pointOfInterestEntityLifecycle);

// Changing your model will automatically update your entity
setTimeout(() => myPois[1].name = 'Westminster', 1000);

// Changing your collection will also automatically update your derived entities
setTimeout(() => myPois.delete(1), 2000);
setTimeout(() => myPois.set('4', new PointOfInterest('10 Downing Street', [51.503186, -0.126416])), 3000);
```

`bindArray` has almost the same signature, but requires a key function in order to derive a key from your model.

```typescript
import { observable } from 'mobx';
import { bindArray } from 'mobx-bind';

const myPois = observable.shallowArray([
    new PointOfInterest('1', 'Buckingham Palace', [51.501476, -0.140634]),
    new PointOfInterest('2', 'Big Ben', [51.510357, -0.116773]),
    new PointOfInterest('3', 'Natural History Museum', [51.495915, -0.176366])
]);
bindArray(myPois, pointOfInterestEntityLifecycle, (model) => model.id);

// Changing your model will automatically update your entity
setTimeout(() => myPois[1].name = 'Westminster', 1000);

// Changing your collection will also automatically update your derived entities
setTimeout(() => myPois.splice(1, 1), 2000);
setTimeout(() => myPois.push(new PointOfInterest('10 Downing Street', [51.503186, -0.126416])), 3000);
```