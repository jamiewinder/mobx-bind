import { autorun } from 'mobx';

import { EntityLifecycle } from './entitylifecycle';

export interface BindModelResult<TEntity> {
    getEntity(): TEntity;
    dispose(): void;
}

export function bindModel<TModel, TEntity, TContext>(
    model: TModel,
    lifecycle: EntityLifecycle<TModel, TEntity, TContext>,
    context: TContext
): BindModelResult<TEntity> {
    const { create, update, destroy } = lifecycle;
    const updates = Array.isArray(update) ? update : [update];

    const entity = create(model, context);
    const autorunDisposers = updates.map((update) =>
        autorun(() => update(model, entity, context)
    ));

    let disposed = false;
    return {
        getEntity() {
            if (disposed) {
                throw new Error('[mobx-bind] bound entity was disposed');
            }
            return entity;
        },
        dispose() {
            if (!disposed) {
                destroy(model, entity, context);
                autorunDisposers.forEach((disposer) => disposer());
                disposed = true;
            }
        }
    }
}
