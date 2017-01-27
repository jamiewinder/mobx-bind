import { observe, reaction, isObservableArray, IObservableArray, Lambda } from 'mobx';

import { bindModel, BindModelResult } from './bindmodel';
import { EntityLifecycle } from './entitylifecycle';

export interface BindArrayResult<TModel, TEntity> {
    getEntityByIndex(index: number): TEntity | undefined;
    dispose(): void;
}

export function bindArray<TModel, TEntity, TContext>(
    array: IObservableArray<TModel> | Array<TModel>,
    lifecycle: EntityLifecycle<TModel, TEntity, TContext>,
    context: TContext
): BindArrayResult<TModel, TEntity> {
    const entityArray = [] as Array<BindModelResult<TEntity>>;
    const spliceEntities = (start: number, deleteCount: number, insert: Array<TModel>) => {
        const removing = entityArray.slice(start, start + deleteCount);
        removing.forEach((entity) => entity.dispose());

        const adding = insert.map((model) => bindModel(model, lifecycle, context));
        entityArray.splice(start, deleteCount, ...adding);
    };
    const updateEntity = (index: number, newModel: TModel) => {
        entityArray[index].dispose();
        entityArray[index] = bindModel(newModel, lifecycle, context);
    };
    let observeDisposer: Lambda;
    if (isObservableArray(array)) {
        observeDisposer = observe(array, (change) => {
            switch (change.type) {
                case 'splice':
                    spliceEntities(change.index, change.removedCount, change.added);
                    break;
                case 'update':
                    updateEntity(change.index, change.newValue);
                    break;
            }
        });
    } else {
        observeDisposer = () => null;
    }
    spliceEntities(0, 0, array);

    let disposed = false;
    return {
        getEntityByIndex(index: number) {
            if (disposed) {
                throw new Error('[mobx-bind] bound collection disposed');
            }
            const boundEntity = entityArray[index];
            if (boundEntity) {
                return boundEntity.getEntity();
            } else {
                return undefined;
            }
        },
        dispose: () => {
            if (!disposed) {
                entityArray.forEach((boundEntity) => boundEntity.dispose());
                observeDisposer();
                disposed = true;
            }
        }
    };
}

export function bindArrayFn<TModel, TEntity, TContext>(
    arrayFn: () => IObservableArray<TModel> | Array<TModel>,
    lifecycle: EntityLifecycle<TModel, TEntity, TContext>,
    context: TContext
): Lambda {
    let disposeBoundArray: Lambda = () => null;
    let disposeReaction = reaction(
        () => arrayFn(),
        (array) => {
            disposeBoundArray();
            const boundArray = bindArray(array, lifecycle, context);
            disposeBoundArray = () => boundArray.dispose();
        },
        { fireImmediately: true }
    );
    return () => {
        disposeBoundArray();
        disposeReaction();
    }
}
