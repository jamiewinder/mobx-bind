export type EntityCreate<TModel, TEntity, TContext> = (model: TModel, context: TContext) => TEntity;
export type EntityUpdate<TModel, TEntity, TContext> = (model: TModel, entity: TEntity, context: TContext) => void;
export type EntityDestroy<TModel, TEntity, TContext> = (model: TModel, entity: TEntity, context: TContext) => void;

export interface EntityLifecycle<TModel, TEntity, TContext> {
    /**
     * Creates an entity to represent the model
     */
    create: EntityCreate<TModel, TEntity, TContext>;

    /**
     * Updates the entity based on the observable model data. This function will be wrapped in
     * `autorun` which means changes to your model are mapped to your entity automatically. For advanced usages,
     * an array of update functions can be specified which will be run in separate `autorun`s which can be useful
     * if you have a complex subsets of logic which you don't want to always run every time.
     */
    update?: EntityUpdate<TModel, TEntity, TContext> | Array<EntityUpdate<TModel, TEntity, TContext>>;

    /**
     * Destroys the entity
     */
    destroy: EntityDestroy<TModel, TEntity, TContext>;
}
