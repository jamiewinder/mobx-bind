import { autorun } from 'mobx';

import { EntityLifecycle } from './entitylifecycle';

export interface BindModelResult<TEntity> {
    getEntity(): TEntity;
    dispose(): void;
}

export function bindModel<TModel, TEntity, TContext>(
    model: TModel,
    lifecycle: EntityLifecycle<TModel, TEntity, TContext>,
    context?: TContext
): BindModelResult<TEntity> {
    const entity = lifecycle.create(model, context);
    const autorunDisposer = autorun(() => {
        lifecycle.update(model, entity, context);
    });
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
                lifecycle.destroy(model, entity, context);
                autorunDisposer();
                disposed = true;
            }
        }
    }
}
