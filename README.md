#ABOUT

MovieExplorer is a dynamic web-based movie recommendation and search system that allows users to search for trending and popular movies, explore their details, and get suggestions based on their queries. The app uses a Trie data structure to efficiently search through a list of movies and provides an interactive experience with detailed information, including release dates, genres, ratings, and more.

#TECH STACK

Frontend: HTML, CSS, JavaScript
Backend: Fetch API for movie data
Data Structure: Trie (for fast search and autocomplete)
API: The Movie Database API (TMDb)

#FEATURES

Search Bar: Allows users to search for movies by title.
Autocomplete Suggestions: Displays movie suggestions as the user types, fetched from the API.
Movie Details: Displays detailed information about a selected movie, including release date, genres, overview, and ratings.
Trending Movies: Automatically fetches and stores trending movies in a Trie for faster future searches.
Efficient Search: Combines Trie-based search and API-based suggestions for quick and relevant results.

#API

Trending Movies: /3/trending/movie/day?api_key={API_KEY}
Movie Search: /3/search/movie?api_key={API_KEY}&query={QUERY}
Movie Details: /3/movie/{MOVIE_ID}?api_key={API_KEY}
You can replace {API_KEY} with your own TMDb API key to access the endpoints.
