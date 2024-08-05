const { LanguageCode } = require("speakmaster-module-builder");
const { DefaultCommandsBuilder, Command, CommandParameter } = require("speakmaster-module-builder/default-commands-builder");

new DefaultCommandsBuilder()
	// PLAY NOW
	.addCommand(
		[LanguageCode.EN_US, LanguageCode.EN_GB],
		new Command(
			"play [[the] song] {SONG NAME}",
			"play",
			new CommandParameter("song").useVariable("SONG NAME")
		)
	).addCommand(
		[LanguageCode.PT_BR, LanguageCode.PT_PT],
		new Command(
			"(tocar, toca, toque) [[a] música] {NOME DA MÚSICA}",
			"play",
			new CommandParameter("song").useVariable("NOME DA MÚSICA")
		)
	)

	.addCommand(
		[LanguageCode.EN_US, LanguageCode.EN_GB],
		new Command(
			"play [[the] song] {SONG NAME} by [[the] artist] {ARTIST NAME}",
			"play",
			[
				new CommandParameter("song").useVariable("SONG NAME"),
				new CommandParameter("searchBy").useConstant("ARTIST"),
				new CommandParameter("target").useVariable("ARTIST NAME")
			]
		)
	).addCommand(
		[LanguageCode.PT_BR, LanguageCode.PT_PT],
		new Command(
			"(tocar, toca, toque) [[a] música] {NOME DA MÚSICA} (do, da, de) [artista] {NOME DO ARTISTA}",
			"play",
			[
				new CommandParameter("song").useVariable("NOME DA MÚSICA"),
				new CommandParameter("searchBy").useConstant("ARTIST"),
				new CommandParameter("target").useVariable("NOME DO ARTISTA")
			]
		)
	)

	.addCommand(
		[LanguageCode.EN_US, LanguageCode.EN_GB],
		new Command(
			"play [[the] song] {SONG NAME} from [[the] album] {ALBUM NAME}",
			"play",
			[
				new CommandParameter("song").useVariable("SONG NAME"),
				new CommandParameter("searchBy").useConstant("ALBUM"),
				new CommandParameter("target").useVariable("ALBUM NAME")
			]
		)
	).addCommand(
		[LanguageCode.PT_BR, LanguageCode.PT_PT],
		new Command(
			"(tocar, toca, toque) [[a] música] {NOME DA MÚSICA} do álbum {NOME DO ÁLBUM}",
			"play",
			[
				new CommandParameter("song").useVariable("NOME DA MÚSICA"),
				new CommandParameter("searchBy").useConstant("ALBUM"),
				new CommandParameter("target").useVariable("NOME DO ÁLBUM")
			]
		)
	)

	// ADD TO QUEUE
	.addCommand(
		[LanguageCode.EN_US, LanguageCode.EN_GB],
		new Command(
			`(add, at, adding) (
	to [the] queue [[the] song] {SONG NAME},
	[[the] song] {SONG NAME} [to [the] queue]
)`,
			"play",
			[
				new CommandParameter("song").useVariable("SONG NAME"),
				new CommandParameter("onlyAddToQueue").useConstant("TRUE")
			]
		)
	).addCommand(
		[LanguageCode.PT_BR, LanguageCode.PT_PT],
		new Command(
			`(adicionar, adiciona, adicione) (
	(a, à, na, para [a], pra) fila [de reprodução] [[a] música] {NOME DA MÚSICA},
	[[a] música] {NOME DA MÚSICA} [(a, à, na, para [a], pra) fila [de reprodução]]
)`,
			"play",
			[
				new CommandParameter("song").useVariable("NOME DA MÚSICA"),
				new CommandParameter("onlyAddToQueue").useConstant("TRUE")
			]
		)
	)

	.addCommand(
		[LanguageCode.EN_US, LanguageCode.EN_GB],
		new Command(
			`(add, at, adding) (
	to [the] queue [[the] song] {SONG NAME} by [[the] artist] {ARTIST NAME},
	[[the] song] {SONG NAME} by [[the] artist] {ARTIST NAME} [to [the] queue]
)`,
			"play",
			[
				new CommandParameter("song").useVariable("SONG NAME"),
				new CommandParameter("searchBy").useConstant("ARTIST"),
				new CommandParameter("target").useVariable("ARTIST NAME"),
				new CommandParameter("onlyAddToQueue").useConstant("TRUE")
			]
		)
	).addCommand(
		[LanguageCode.PT_BR, LanguageCode.PT_PT],
		new Command(
			`(adicionar, adiciona, adicione) (
	(a, à, na, para [a], pra) fila [de reprodução] [[a] música] {NOME DA MÚSICA} (do, da, de) [artista] {NOME DO ARTISTA},
	[[a] música] {NOME DA MÚSICA} (do, da, de) [artista] {NOME DO ARTISTA} [(a, à, na, para [a], pra) fila [de reprodução]]
)`,
			"play",
			[
				new CommandParameter("song").useVariable("NOME DA MÚSICA"),
				new CommandParameter("searchBy").useConstant("ARTIST"),
				new CommandParameter("target").useVariable("NOME DO ARTISTA"),
				new CommandParameter("onlyAddToQueue").useConstant("TRUE")
			]
		)
	)

	.addCommand(
		[LanguageCode.EN_US, LanguageCode.EN_GB],
		new Command(
			`(add, at, adding) (
	to [the] queue [[the] song] {SONG NAME} from [[the] album] {ALBUM NAME},
	[[the] song] {SONG NAME} from [[the] album] {ALBUM NAME} [to [the] queue]
)`,
			"play",
			[
				new CommandParameter("song").useVariable("SONG NAME"),
				new CommandParameter("searchBy").useConstant("ALBUM"),
				new CommandParameter("target").useVariable("ALBUM NAME"),
				new CommandParameter("onlyAddToQueue").useConstant("TRUE")
			]
		)
	).addCommand(
		[LanguageCode.PT_BR, LanguageCode.PT_PT],
		new Command(
			`(adicionar, adiciona, adicione) (
	(a, à, na, para [a], pra) fila [de reprodução] [[a] música] {NOME DA MÚSICA} do álbum {NOME DO ÁLBUM},
	[[a] música] {NOME DA MÚSICA} do álbum {NOME DO ÁLBUM} [(a, à, na, para [a], pra) fila [de reprodução]]
)`,
			"play",
			[
				new CommandParameter("song").useVariable("NOME DA MÚSICA"),
				new CommandParameter("searchBy").useConstant("ALBUM"),
				new CommandParameter("target").useVariable("NOME DO ÁLBUM"),
				new CommandParameter("onlyAddToQueue").useConstant("TRUE")
			]
		)
	)

	.generateJSON();
