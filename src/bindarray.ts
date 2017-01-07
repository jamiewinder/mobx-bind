import { observe, IObservableArray } from 'mobx';

import { bindModel, BindModelResult } from './bindmodel';
import { EntityLifecycle } from './entitylifecycle';

export interface BindArrayResult<TModel, TEntity> {
    getEntityByKey(key: string): TEntity | undefined;
    dispose(): void;
}

export function bindArray<TModel, TEntity, TContext>(
    array: IObservableArray<TModel>,
    lifecycle: EntityLifecycle<TModel, TEntity, TContext>,
    getKey: (model: TModel) => string,
    context?: TContext
): BindArrayResult<TModel, TEntity> {
    const entityMap = Object.create(null) as { [key: string]: BindModelResult<TEntity> | undefined }
    const createEntry = (model: TModel) => {
        const key = getKey(model);
        if (key in entityMap) {
            console.warn('[mobx-bind] ignoring duplicate key: ', key);
        } else {
            const boundEntity = bindModel(model, lifecycle, context);
            entityMap[key] = boundEntity;
        }
    };
    const destroyEntry = (model: TModel) => {
        const key = getKey(model);
        const boundEntity = entityMap[key];
        if (boundEntity) {
            delete entityMap[key];
            boundEntity.dispose();
        } else {
            console.warn('[mobx-bind] missing entry!');
        }
    };
    const observeDisposer = observe(array, (change) => {
        switch (change.type) {
            case 'splice':
                change.removed.forEach(destroyEntry);
                change.added.forEach(createEntry);
                break;
            case 'update':
                destroyEntry(change.oldValue);
                createEntry(change.newValue);
        }
    });
    array.forEach(createEntry);

    let disposed = false;
    return {
        getEntityByKey(key: string) {
            if (disposed) {
                throw new Error('[mobx-bind] bound collection disposed');
            }
            const boundEntity = entityMap[key];
            if (boundEntity) {
                return boundEntity.getEntity();
            } else {
                return undefined;
            }
        },
        dispose: () => {
            if (!disposed) {
                for (let key in entityMap) {
                    const boundEntity = entityMap[key];
                    if (boundEntity) {
                        boundEntity.dispose();
                    }
                }
                observeDisposer();
                disposed = true;
            }
        }
    };
}
