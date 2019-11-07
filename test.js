const { assign } = require('./');

{
	assign({a: {b:{c: [1,2,3]}}}, [
	    {path: 'a', action: 'merge', data: {test: 1}}, 
	    {path: 'a', action: 'merge', data: {test1: 2}}, 
	    {path: 'a.b', action: 'merge', data: {test: 1}}
	])
	console.log(JSON.stringify(result))
}

{
	assign([{a:1}, {a: 2}], [
    	{path: '[1]', action: 'merge', data: {a: 3}}, 
	])
}

assign([{a:1}, {a: 2}], [
    {path: '[1].a', action: 'merge', data: 3}, 
])
