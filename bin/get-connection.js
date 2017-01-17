"use strict";

const pg = require("pg");
const url = require("url");

// TODO: we need to be able to communicate between all processes in order to adjust these connection parameters.
// The auth servers will have different needs and demands than the game state servers.
function pgConfig( databaseUrl ) {
	const PG_MAX_CONNECTIONS = (process.env.PG_MAX_CONNECTIONS || 1) - 1;
	const WORKERS = process.env.WEB_CONCURRENCY || 1;
	const SERVERS = process.env.SERVERS || 1;

	const params = url.parse( databaseUrl );
	const auth = params.auth ? params.auth.split(":") : [null, null];
    const [user, password] = auth;

	// PG allows a certian number of simultaneous connections.
	// We need to share the connections across servers and workers, while leaving some open for us to manually log in.
	const maxConnections = Math.max(Math.round(PG_MAX_CONNECTIONS / SERVERS / WORKERS), 1);
	return {
		"user": user,
		"password": password,
		"host": params.hostname,
		"port": params.port,
		"database": params.pathname.split("/")[1],
		"ssl": process.env.LOCAL !== "TRUE",
		"max": maxConnections,
		"min": 1,
		"idleTimeoutMillis": 1000
	};
}

const pool = new pg.Pool(pgConfig(process.env.DATABASE_URL));

pool.on("error", (err, client) => {
	console.error("idle client error", err.message, err.stack);
});

module.exports = getClient;

function getClient(callback){
	pool.connect((err, client, done) => callback(err, {client, done}));
}