const { assign } = require('./');

{
	const source = {a:{d:1, b:{c:[1,2,3]}}};
	const result = assign(source, 'a.b', {c: []});
	console.log(result);

}
{
	const source = {a:{d:1, b:{c:[1,2,3]}}};
	const result = assign(source, 'a.b', {d: []});
	console.log(result);
}

{
	const source = [{a:1},{a:2}];
	const result = assign(source, '[1]', {a:3});
	console.log(result);
}