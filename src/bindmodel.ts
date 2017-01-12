import { autorun } from 'mobx';

import { EntityLifecycle, EntityUpdate } from './entitylifecycle';

export interface BindModelResult<TEntity> {
    getEntity(): TEntity;
    dispose(): void;
}

function normalizeUpdate<T>(update: T | Array<T> | undefined) {
    if (Array.isArray(update)) {
        return update;
    } else if (update) {
        return [update];
    } else {
        return [];
    }
}

export function bindModel<TModel, TEntity, TContext>(
    model: TModel,
    lifecycle: EntityLifecycle<TModel, TEntity, TContext>,
    context: TContext
): BindModelResult<TEntity> {
    const { create, update, destroy } = lifecycle;
    const updates = normalizeUpdate(update);

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
