
var map;
function type(value) {
    return Object.prototype.toString.call(value).replace(/\[object (.+)\]/, '$1');
}

function _assign(obj, k) {
    
    // primitive value
    if (!map.has(obj) || type(obj) !== 'Array' && type(obj) !== 'Object') {
        return obj;
    }

    // need a new object or array because it can not be shared;
    let ret = type(obj) === 'Array' ? [] : {};
    // clone
    for(var [k,v] of Object.entries(obj)) {
        ret[k] = _assign(v, k);
        const queue = map.get(obj).queue;
        while(queue.length) {
            const node = queue.shift();
            if (node.action == 'replace') {
                ret = node.data;
            } else if (node.action == 'merge') {
                if (type(obj) === 'Object' && type(node.data) === 'Object') {
                    Object.assign(ret, node.data);
                }
                if (type(obj) === 'Array' && type(node.data) === 'Array') {
                    for(var [k,v] of Object.entries(node.data)) {
                        ret[k] = v;
                    }
                }
            }
        }
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
                
                if (path[i] != '[' || !/^\[\d+\]/.test(path.slice(i))) {
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
function findNodes(obj, configs) {

    for (let i = 0; i < configs.length; i++) {
        const config = configs[i];
        let { path, action, data } = config;

        let current = obj;
        // split the string path to array
        const paths = path.split(/\s*\.\s*/).filter((path) => {
            return !/^\s*$/.test(path);
        });
        if (!map.has(current)) {
            map.set(current, {queue: []});
        }
        if (!paths.length) {
            map.get(current).queue.push(config);
            break;
        }
        do {
            try {
                // parse one path
                path = parsePath(paths.shift());
                if (path.type === 'arrayIndex') {
                    do {
                        const index = path.indexs.shift();
                        const prev = current;
                        current = current[index];
                        if (type(current) !== 'Object' && type(current) !== 'Array') {
                            current = prev;
                        }
                        if (!map.has(current)) {
                            map.set(current, {queue: []});
                        }
                        if (!paths.length) {
                            if (current === prev) {
                                map.get(current).queue.push({...config, data: {[index]: config.data}});
                            } else {
                                map.get(current).queue.push(config);
                            }
                            
                        }
                    } while(path.indexs.length);
                } else {
                    const key = path.value;
                    const prev = current;
                    current = current[key];
                    if (type(current) !== 'Object' && type(current) !== 'Array') {
                        current = prev;
                    }
                    if (!map.has(current)) {
                        map.set(current, {queue: []});
                    }
                    if (!paths.length) {
                        if (current === prev) {
                            map.get(current).queue.push({...config, data: {[key]: config.data}});
                        } else {
                            map.get(current).queue.push(config);
                        }
                        
                    }
                }
                
            } catch(e) {
                throw new Error(e);
            }
        } while(paths.length);
    }


}

/*
     obj => source object
     path => the char follow with "." mean object key,the number in "[]" mean array index.(a.x | a[1])
     value => when find the node by path,value will be merged into the node
 */
function assign(obj, configs) {

    if ((type(obj) !== 'Object' && type(obj) !== 'Array')) {
        return value;
    }
    map = new Map();
    // have no path return a new object or value;
    if (!configs.length) {
        return type(obj) === 'Object' ? {...obj} : [...obj];
    }
    findNodes(obj, configs);
    // build new obj
    return _assign(obj);

}
