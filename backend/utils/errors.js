function handleServerError(err, res) {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
}

module.exports = { handleServerError };