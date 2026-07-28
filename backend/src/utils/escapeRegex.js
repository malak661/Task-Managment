// Search text goes into a mongo $regex, so anything the user types has to be
// treated as literal characters. Without this, a search for "c++" is a syntax
// error and a search for ".*" quietly matches everything.
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = escapeRegex;
