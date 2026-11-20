(() => {
  const players = Array.from(document.querySelectorAll('#clipes-crm video'));
  players.forEach((player) => {
    player.addEventListener('play', () => {
      players.forEach((other) => {
        if (other !== player) other.pause();
      });
    });
  });
})();
