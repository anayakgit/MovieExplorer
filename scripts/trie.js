// trie.js

// TrieNode class represents a single node in the Trie.
class TrieNode {
    constructor() {
      this.children = {}; // An object that will store child nodes for each character.
      this.isEnd = false; // Boolean flag that marks the end of a word.
      this.movieData = null; // This will store the movie data (title, release date, movie ID) when we reach the end of a movie title.
    }
  }
  
  // Trie class provides methods to insert movies and search by prefix in the Trie.
  class Trie {
    constructor() {
      this.root = new TrieNode(); // Root node of the Trie, where all movie data will be stored.
    }
  
    /**
     * Inserts a movie's title, release date, and ID into the Trie.
     * @param {string} title - The title of the movie to insert.
     * @param {string} releaseDate - The release date of the movie.
     * @param {number} movieId - The unique ID of the movie.
     */
    insert(title, releaseDate, movieId) {
      let node = this.root; // Start at the root node.
      title = title.toLowerCase(); // Convert the movie title to lowercase for case-insensitive matching.
  
      // Traverse through each character in the movie title and insert them into the Trie.
      for (let char of title) {
        if (!node.children[char]) {
          // If the character is not already a child node, create a new TrieNode.
          node.children[char] = new TrieNode();
        }
        // Move to the next node in the Trie (which corresponds to the next character in the title).
        node = node.children[char];
      }
  
      // Once we reach the end of the word, mark the node as the end of the movie title.
      node.isEnd = true;
      // Store the movie data at the end of the movie title.
      node.movieData = { title, releaseDate, movieId };
    }
  
    /**
     * Searches for all movie titles that start with the given prefix.
     * @param {string} prefix - The prefix to search for.
     * @returns {Array} - A list of movie data objects that match the prefix.
     */
    search(prefix) {
      let node = this.root; // Start at the root node.
      prefix = prefix.toLowerCase(); // Convert the prefix to lowercase for case-insensitive matching.
  
      // Traverse the Trie along the path defined by the prefix.
      for (let char of prefix) {
        if (!node.children[char]) {
          // If the prefix doesn't exist in the Trie, return an empty array.
          return [];
        }
        // Move to the next node in the Trie corresponding to the character.
        node = node.children[char];
      }
  
      // Once we have traversed the prefix, we find all the movie data associated with the given prefix.
      return this.getWords(node, prefix);
    }
  
    /**
     * Recursively collects all movie data starting from the given node.
     * @param {TrieNode} node - The current TrieNode to begin the search.
     * @param {string} prefix - The current prefix for which we are finding movies.
     * @returns {Array} - A list of movie data objects.
     */
    getWords(node, prefix) {
      let results = []; // Initialize an array to store the results.
  
      // If the current node represents the end of a movie title, add the movie data to the results.
      if (node.isEnd && node.movieData) {
        results.push(node.movieData);
      }
  
      // Recursively traverse through all the children of the current node.
      for (let char in node.children) {
        // Concatenate the character to the current prefix and continue the search.
        results = results.concat(this.getWords(node.children[char], prefix + char));
      }
  
      return results; // Return all the results found.
    }
  }
  
  // Export the Trie class so that it can be imported in other JavaScript files.
  export default Trie;
  