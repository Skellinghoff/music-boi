// require('dotenv').config();

module.exports = {
	name: 'error',
	async execute(error) {
		console.groupCollapsed('ERROR');
		console.error(`Ready! Logged in as ${error}`);
		console.groupEnd();
	},
};