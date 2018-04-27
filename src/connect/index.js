/*
 * moleculer-cli
 * Copyright (c) 2018 MoleculerJS (https://github.com/moleculerjs/moleculer-cli)
 * MIT Licensed
 */

const { ServiceBroker } = require("moleculer");
const os = require("os");
const fs = require("fs");
const path = require("path");
const glob = require("glob");

/**
 * Yargs command
 */
module.exports = {
	command: "connect [connectionString]",
	describe: "Connect to a remote Moleculer broker",
	builder(yargs) {
		yargs.options({
			"ns": {
				default: "",
				describe: "Namespace",
				type: "string"
			},
			"id": {
				default: null,
				describe: "NodeID",
				type: "string"
			},
			"metrics": {
				alias: "m",
				default: false,
				describe: "Enable metrics",
				type: "boolean"
			},
			"hot": {
				alias: "h",
				default: false,
				describe: "Enable hot-reload",
				type: "boolean"
			},
			"cb": {
				default: false,
				describe: "Enable circuit breaker",
				type: "boolean"
			},
			"serializer": {
				default: null,
				describe: "Serializer",
				type: "string"
			},
			"commands": {
				default: null,
				describe: "Custom REPL command file mask (e.g.: ./commands/*.js)",
				type: "string"
			}
		});
	},
	handler(opts) {
		let replCommands;
		if (opts.commands) {
			replCommands = [];

			if (opts.commands.endsWith("/")) {
				opts.commands += "**/*.js"
			}

			const files = glob.sync(opts.commands);
			files.forEach(file => {
				console.log(`Load custom REPL commands from '${file}'...`);
				try {
					let cmd = require(path.resolve(file));
					if (!Array.isArray(cmd))
						cmd = [cmd];

					replCommands.push(...cmd);
				} catch(err) {
					console.error(err);
				}
			})
		}

		const broker = new ServiceBroker({
			namespace: opts.ns,
			transporter: opts.connectionString ? opts.connectionString : "TCP",
			nodeID: opts.id || `cli-${os.hostname().toLowerCase()}-${process.pid}`,
			serializer: opts.serializer,
			logger: console,
			logLevel: "info",
			validation: true,
			statistics: true,
			metrics: opts.metrics,
			hotReload: opts.hot,
			circuitBreaker: {
				enabled: opts.cb
			},
			replCommands
		});

		broker.start().then(() => broker.repl());
	}
};
