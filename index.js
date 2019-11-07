
    var map;
    function type(value) {
        return Object.prototype.toString.call(value).replace(/\[object (.+)\]/, '$1');
    }

    function traversal(obj, k) {
        
        // primitive value or can be shared
        if (!map.has(obj) || (type(obj) !== 'Array' && type(obj) !== 'Object')) {
            return obj;
        }

        // need a new object or array because it can not be shared;
        let ret = type(obj) === 'Array' ? [] : {};

        // clone
        for(var [k,v] of Object.entries(obj)) {

            ret[k] = traversal(v, k);
            
        }
        
        // modify data of current node
        const queue = map.get(obj).queue;
        while(queue.length) {
            const node = queue.shift();
            if (node.action == 'append') {
                const paths = node.paths;
                let path;
                let key;
                let current = ret;
                do {
                    path = parsePath(paths.shift());
                    
                    if (path.type === 'arrayIndex') {
                        do {
                            key = path.indexs.shift();
                            if (!current[key]) {
                                current[key] = [];
                            }
                            current = current[key];
                        } while(path.indexs.length);
                    } else {
                        key = path.value;
                        if (!current[key]) {
                            current[key] = {};
                        }
                        current = current[key];
                    }
                    if (!paths.length && node.data) {

                        if (type(current) === 'Object' && type(node.data) === 'Object') {
                            Object.assign(current, node.data);
                        } else if (type(obj) === 'Array' && type(node.data) === 'Object') {
                            for(const [k,v] of Object.entries(node.data)) {
                                if (+k >= 0) {
                                    ret[k] = v;
                                } else {
                                    throw new Error('array index is not number');
                                }
                            }
                        } else {
                            throw new Error('modify error');
                        }
                    }
                } while(paths.length);

            } else if (node.action == 'replace') {
                ret = node.data;
            } else if (node.action == 'merge') {
                if (type(obj) === 'Object' && type(node.data) === 'Object') {
                    Object.assign(ret, node.data);
                } else if (type(obj) === 'Array' && type(node.data) === 'Object') {
                    for(const [k,v] of Object.entries(node.data)) {
                        if (+k >= 0) {
                            ret[k] = v;
                        } else {
                            throw new Error('array index is not number');
                        }
                    }
                } else {
                    throw new Error('modify error');
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

    // find the node then can not be shared; store in map;
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
            let next = false;
            do {
                if (next) {
                    break;
                }
                // parse one path
                path = parsePath(paths.shift());
                let key;
                do {
                    if (path.type === 'arrayIndex') {
                        key = path.indexs.shift();
                    } else {
                        key = path.value;
                    }
                    const prev = current;
                    current = current[key];
                    if (type(current) !== 'Object' && type(current) !== 'Array') {
                        current = prev;  
                    }
                    if (!map.has(current)) {
                        map.set(current, {queue: []});
                    }
                    if ((current[key] === null || current[key] === void 0) && action === 'append') {
                        map.get(current).queue.push({...config, paths: [key, ...paths], data});
                        next  = true;
                        break;
                    }
                    const end = path.type === 'arrayIndex' ? (!paths.length && !path.indexs.length) : !paths.length;
                    if (end) {
                        if (current === prev) {
                            if (action === 'merge') {
                                throw new Error('primitive value can not be merged');
                            }
                            map.get(current).queue.push({...config, action: 'merge', data: {[key]: data}});
                        } else {
                            map.get(current).queue.push(config);
                        }
                        
                    }
                    if (path.type === 'objectIndex') {
                        break;
                    }
                } while(path.indexs.length);
            } while(paths.length);
        }
    }

    /*
         obj => source object
         config => [{
            path: the char follow with "." mean object key,the number in "[]" mean array index.(a.x | a[1]),
            action: "merge" | 'replace',
            data: js value
         }]
     */
    exports.assign = function assign(obj, configs) {

        if ((type(obj) !== 'Object' && type(obj) !== 'Array')) {
            return obj;
        }

        map = new Map();
        // have no configs return a new object or value;
        if (!configs.length) {
            return type(obj) === 'Object' ? {...obj} : [...obj];
        }

        findNodes(obj, configs);
        // build new obj
        return traversal(obj);

    }
