// Configura variáveis de ambiente o mais cedo possível
require("dotenv").config();

// Configura estampa de tempo dos logs
require("console-stamp")(console, { format: ":date(yyyy-mm-dd HH:MM:ss.l).yellow :label" });

const chalk = require("chalk");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dayjs = require("dayjs");
const express = require("express");
const morgan = require("morgan");

const routes = require("./routes");

const app = express();
app.set("port", process.env.PORT || 4400);

morgan.token("my-date", () => chalk.yellow(`[${dayjs().format("YYYY-MM-DD HH:mm:ss.SSS")}]`));
morgan.token("content-length", (_, res) => res.getHeader("content-length") || "0");
app.use(morgan(":my-date [WEB] :method :url :status :response-time ms :content-length bytes"));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({
	origin: "*",
	methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
	preflightContinue: true,
	optionsSuccessStatus: 200
}));

app.use("/api", routes);

app.listen(app.get("port"), () => {
	console.log("Node app is running on port", app.get("port"));

	const { ModuleConnection } = require("speakmaster-module-connection");
	const { registerSpotifyControl } = require("./spotify/spotify-control");

	const connection = new ModuleConnection(process.env.API_KEY, process.env.API_SECRET, process.env.DEBUGGING === "true");

	registerSpotifyControl(connection);
});
