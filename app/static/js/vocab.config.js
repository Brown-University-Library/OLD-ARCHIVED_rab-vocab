vocab.config = (function () {
	var
		local, dev;

	dev = (function () {
		var
			search_base = 'https://dvivocit1.services.brown.edu/rabvocab/search/',
			rest_base = 'https://dvivocit1.services.brown.edu/rabvocab/'

		return {
			search_base : search_base,
			rest_base : rest_base
		};
	})();

	local = (function () {
		var
			search_base = 'http://localhost:8000/search/',
			rest_base = 'http://localhost:8000/vocab/'

		return {
			search_base : search_base,
			rest_base : rest_base
		};
	})();

	return {
		local : local,
		dev : dev
	};
})();
