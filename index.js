
function type(value) {
    return Object.prototype.toString.call(value).replace(/\[object (.+)\]/, '$1');
}

function _assign(obj, queue, value) {

    // primitive value
    if (type(obj) !== 'Array' && type(obj) !== 'Object') {
        return obj;
    }
    // can be shared, return directly
    if (!queue || !queue.includes(obj)) {
        return obj;
    }
    // shift a path
    queue && queue.length && queue.shift();
    // need a new object or array because it can not be shared;
    const ret = type(obj) === 'Array' ? [] : {};
    // empty mean we get the end of path
    let empty = queue && !queue.length;
    // clone
    for(var [k,v] of Object.entries(obj)) {
        ret[k] = _assign(v, queue && queue.length ? queue : null, value);
    }
    if (empty) {
        Object.assign(ret, value);
    }
    return ret;
}

//parsePath('a[1][2][3]') | parsePath('[1][2][3]') 
// parse object or array path
function parsePath(path) {

    path = path.replace(' ', '');
    // have no string like [number]
    if (!/\[\d+\]/.test(path)) {
        return {
            type: 'objectIndex',
            value: path
        };
    }
    let i = 0;
    const state = {
        parsingArrayName: 1,
        parsingArrayIndex: 2,
        endParsingArrayIndex: 3,
    };
    let status = state.parsingArrayName;
    const indexs = [];
    let index = '';
    let arrayName = '';
    while(i < path.length) {
        switch(status) {
            case state.parsingArrayName: 
                
                if (path[i] != '[' || !/\[\d+\]/.test(path.slice(i))) {
                    arrayName += path[i];
                } else {
                   arrayName && indexs.push(arrayName)
                   status =  state.parsingArrayIndex;
                }
                break;
            case state.parsingArrayIndex:
                
                if (path[i] === ']') {
                    indexs.push(index);
                    index = '';
                    status = state.endParsingArrayIndex;
                } else if (/[0-9]/.test(path[i])){
                    index += path[i];
                } else {
                    throw new Error('need number or ]');
                }
                break;
            case state.endParsingArrayIndex: 
                if (path[i] === '[') {
                    status =  state.parsingArrayIndex;
                } else {
                    throw new Error('need [');
                }
                break;
        }
        i++;
    }
    if (status !== state.endParsingArrayIndex) {
        throw new Error('bad end');
    }
    return {
        indexs,
        type: 'arrayIndex'
    };
}

// find the node then can not be shared;store in queue;
function findNodes(obj, paths) {
    let current = obj;
    let queue = [obj];
    let path;
    do {
        try {
            path = parsePath(paths.shift());
            if (path.type === 'arrayIndex') {
                do {
                    current = current[path.indexs.shift()];
                    queue.push(current);
                } while(path.indexs.length);
            } else {
                current = current[path.value];
                queue.push(current);
            }
            
        } catch(e) {
            throw new Error(e);
        }
    } while(paths.length);
    return queue;
}

exports.assign = function assign(obj, path, value = {}) {

    if (type(value) !== 'Object' || (type(obj) !== 'Object' && type(obj) !== 'Array')) {
        return obj;
    }
    // split the string path to array
    const paths = path.split(/\s*\.\s*/).filter((path) => {
        return !/^\s*$/.test(path);
    });

    // have no path return new object;
    if (!paths.length) {
        return {...obj, ...value};
    }

    const queue = findNodes(obj, paths);

    return _assign(obj, queue, value);

}
