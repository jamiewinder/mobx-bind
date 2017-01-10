import { observe, ObservableMap } from 'mobx';

import { bindModel, BindModelResult } from './bindmodel';
import { EntityLifecycle } from './entitylifecycle';

export interface BindMapResult<TModel, TEntity> {
    getEntityByKey(key: string): TEntity | undefined;
    dispose(): void;
}

export function bindMap<TModel, TEntity, TContext>(
    map: ObservableMap<TModel>,
    lifecycle: EntityLifecycle<TModel, TEntity, TContext>,
    context: TContext
): BindMapResult<TModel, TEntity> {
    const entityMap = Object.create(null) as { [key: string]: BindModelResult<TEntity> | undefined }
    const createEntity = (key: string, model: TModel) => {
        if (key in entityMap) {
            console.warn('[mobx-bind] ignoring duplicate key: ', key);
        } else {
            const boundEntity = bindModel(model, lifecycle, context);
            entityMap[key] = boundEntity;
        }
    };
    const destroyEntity = (key: string) => {
        const boundEntity = entityMap[key];
        if (boundEntity) {
            delete entityMap[key];
            boundEntity.dispose();
        } else {
            console.warn('[mobx-bind] missing entry!');
        }
    };
    const observeDisposer = observe(map, (change) => {
        switch (change.type) {
            case 'add':
                createEntity(change.name, change.newValue);
                break;
            case 'update':
                destroyEntity(change.name);
                createEntity(change.name, change.newValue);
            case 'delete':
                destroyEntity(change.name);
        }
    });
    map.entries().forEach(([key, model]) => createEntity(key, model));

    let disposed = false;
    return {
        getEntityByKey(key: string) {
            if (disposed) {
                throw new Error('[mobx-bind] bound collection was disposed');
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
