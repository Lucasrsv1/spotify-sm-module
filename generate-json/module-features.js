const { LanguageCode } = require("speakmaster-module-builder");
const { Feature, ModuleFeaturesBuilder, Parameter, ParameterValue } = require("speakmaster-module-builder/features-builder");

const play = new Feature("play", LanguageCode.EN_US)
	.addTranslation("Play a Song", "Play a song now or add it to the queue", [LanguageCode.EN_US, LanguageCode.EN_GB])
	.addTranslation("Tocar uma Música", "Toca uma música agora ou a adiciona à fila de reprodução", [LanguageCode.PT_BR, LanguageCode.PT_PT])
	.addParameter(
		new Parameter("song")
			.addTranslation("Song Name", "Name of the song to be played", [LanguageCode.EN_US, LanguageCode.EN_GB])
			.addTranslation("Nome da Música", "Nome da música a ser tocada", [LanguageCode.PT_BR, LanguageCode.PT_PT]),

		new Parameter("searchBy", true)
			.addTranslation("Filter Search by Album or Artist?", "Filter the song search by the name of the album or artist", [LanguageCode.EN_US, LanguageCode.EN_GB])
			.addTranslation("Filtrar Busca por Álbum ou Artista?", "Filtra a busca da música pelo nome do álbum ou do artista", [LanguageCode.PT_BR, LanguageCode.PT_PT])
			.addAllowedValue(
				new ParameterValue("ALBUM")
					.addTranslation("Album", "Filter the song search by the name of the album", [LanguageCode.EN_US, LanguageCode.EN_GB])
					.addTranslation("Álbum", "Filtra a busca da música pelo nome do álbum", [LanguageCode.PT_BR, LanguageCode.PT_PT]),
				new ParameterValue("ARTIST")
					.addTranslation("Artist", "Filter the song search by the name of the artist", [LanguageCode.EN_US, LanguageCode.EN_GB])
					.addTranslation("Artista", "Filtra a busca da música pelo nome do artista", [LanguageCode.PT_BR, LanguageCode.PT_PT])
			),

		new Parameter("target", true)
			.addTranslation("Album or Artist Name", "Name of the album or artist to use in the search", [LanguageCode.EN_US, LanguageCode.EN_GB])
			.addTranslation("Nome do Álbum ou Artista", "Nome do álbum ou do artista a ser usado na busca", [LanguageCode.PT_BR, LanguageCode.PT_PT]),

		new Parameter("onlyAddToQueue", true)
			.addTranslation("Add to Queue?", "Determine if the song must be added to the queue or played now", [LanguageCode.EN_US, LanguageCode.EN_GB])
			.addTranslation("Adicionar à Fila?", "Define se a música deve ser adicionada à fila ou tocada agora", [LanguageCode.PT_BR, LanguageCode.PT_PT])
			.addAllowedValue(
				new ParameterValue("TRUE")
					.addTranslation("Yes", "Add the song to the queue", [LanguageCode.EN_US, LanguageCode.EN_GB])
					.addTranslation("Sim", "Adiciona a música à fila de reprodução", [LanguageCode.PT_BR, LanguageCode.PT_PT]),
				new ParameterValue("FALSE")
					.addTranslation("No", "Play the song right now", [LanguageCode.EN_US, LanguageCode.EN_GB])
					.addTranslation("Não", "Toca a música agora", [LanguageCode.PT_BR, LanguageCode.PT_PT])
			)
	);

new ModuleFeaturesBuilder()
	.addFeature(play)
	.generateJSON();
