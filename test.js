const { assign } = require('./');

{
	const source = {a:{d:1, b:{c:[1,2,3]}}};
	const result = assign(source, [
	{
		path: 'a.b.c',
		action: 'merge',
		data: {1: 6}
	},
	{
		path: 'a',
		action: 'merge',
		data: {dd: 1}
	},
	]);
	console.log(JSON.stringify(result));
}
{
	const source = [{a:1}, {a:2}];
	const result = assign(source, [
	{
		path: '',
		action: 'merge',
		data: {1: 6}
	},
	]);
	console.log(result);
}

{
	const source = {a: 1};
	const result = assign(source, [
	{
		path: '',
		action: 'merge',
		data: {a: 8}
	},
	]);
	console.log(result);
}
{
	const source = {a: 1};
	const result = assign(source, [
	{
		path: 'a.b.c.d.e',
		action: 'append',
		data: {a: 8}
	},
	{
		path: 'a.b.c.d.f',
		action: 'append',
		data: {a: 1}
	},
	]);
	console.log(JSON.stringify(result));
}
