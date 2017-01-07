(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('mobx')) :
    typeof define === 'function' && define.amd ? define(['exports', 'mobx'], factory) :
    (factory((global.mobxBind = global.mobxBind || {}),global.mobx));
}(this, (function (exports,mobx) { 'use strict';

function bindModel(model, lifecycle, context) {
    const entity = lifecycle.create(model, context);
    const autorunDisposer = mobx.autorun(() => {
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
    };
}

function bindArray(array, lifecycle, getKey, context) {
    const entityMap = Object.create(null);
    const createEntry = (model) => {
        const key = getKey(model);
        if (key in entityMap) {
            console.warn('[mobx-bind] ignoring duplicate key: ', key);
        }
        else {
            const boundEntity = bindModel(model, lifecycle, context);
            entityMap[key] = boundEntity;
        }
    };
    const destroyEntry = (model) => {
        const key = getKey(model);
        const boundEntity = entityMap[key];
        if (boundEntity) {
            delete entityMap[key];
            boundEntity.dispose();
        }
        else {
            console.warn('[mobx-bind] missing entry!');
        }
    };
    const observeDisposer = mobx.observe(array, (change) => {
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
        getEntityByKey(key) {
            if (disposed) {
                throw new Error('[mobx-bind] bound collection disposed');
            }
            const boundEntity = entityMap[key];
            if (boundEntity) {
                return boundEntity.getEntity();
            }
            else {
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

function bindMap(map, lifecycle, context) {
    const entityMap = Object.create(null);
    const createEntry = (key, model) => {
        if (key in entityMap) {
            console.warn('[mobx-bind] ignoring duplicate key: ', key);
        }
        else {
            const boundEntity = bindModel(model, lifecycle, context);
            entityMap[key] = boundEntity;
        }
    };
    const destroyEntry = (key) => {
        const boundEntity = entityMap[key];
        if (boundEntity) {
            delete entityMap[key];
            boundEntity.dispose();
        }
        else {
            console.warn('[mobx-bind] missing entry!');
        }
    };
    const observeDisposer = mobx.observe(map, (change) => {
        switch (change.type) {
            case 'add':
                createEntry(change.name, change.newValue);
                break;
            case 'update':
                destroyEntry(change.name);
                createEntry(change.name, change.newValue);
            case 'delete':
                destroyEntry(change.name);
        }
    });
    map.entries().forEach(([key, model]) => createEntry(key, model));
    let disposed = false;
    return {
        getEntityByKey(key) {
            if (disposed) {
                throw new Error('[mobx-bind] bound collection was disposed');
            }
            const boundEntity = entityMap[key];
            if (boundEntity) {
                return boundEntity.getEntity();
            }
            else {
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

exports.bindArray = bindArray;
exports.bindMap = bindMap;
exports.bindModel = bindModel;

Object.defineProperty(exports, '__esModule', { value: true });

})));
