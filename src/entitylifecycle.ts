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
