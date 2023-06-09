const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db;

(async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server started at port : 3000");
    });
  } catch (err) {
    console.log(err.message);
  }
})();

const conPlayerPromiseToRespObj = (obj) => {
  return {
    playerId: obj.player_id,
    playerName: obj.player_name,
  };
};

const conMatchPromToRespObj = (obj) => {
  return {
    matchId: obj.match_id,
    match: obj.match,
    year: obj.year,
  };
};

// Returns a list of all the players in the player table - /players/
app.get("/players/", async (req, res) => {
  try {
    const getPlayersQuery = `SELECT * FROM player_details ORDER BY player_id;`;
    const playersArr = await db.all(getPlayersQuery);
    res.send(playersArr.map((obj) => conPlayerPromiseToRespObj(obj)));
  } catch (err) {
    console.log(err.message);
  }
});

// Returns a specific player based on the player ID - /players/:playerId/ - GET
app.get("/players/:playerId", async (req, res) => {
  try {
    const { playerId } = req.params;
    const getPlayerQuery = `SELECT * FROM player_details WHERE player_id = ${playerId};`;
    const playerPromise = await db.get(getPlayerQuery);
    const player = [playerPromise].map((obj) => conPlayerPromiseToRespObj(obj));
    res.send(player[0]);
  } catch (error) {
    console.log(error.message);
  }
});

// Updates the details of a specific player based on the player ID - /players/:playerId/ - PUT
app.put("/players/:Id/", async (req, res) => {
  try {
    const playerId = req.params.Id;
    const { playerName } = req.body;
    const updatePlayerQuery = `UPDATE player_details SET player_name = '${playerName}' WHERE player_id = ${playerId};`;
    await db.run(updatePlayerQuery);
    res.send("Player Details Updated");
  } catch (error) {
    console.log(error.message);
  }
});

// /matches/:matchId/ - GET -  match details of a specific match
app.get("/matches/:matchId/", async (req, res) => {
  try {
    const { matchId } = req.params;
    const getMatchQuery = `SELECT * FROM match_details WHERE match_id = ${matchId};`;
    const matchPromise = await db.get(getMatchQuery);
    const match = [matchPromise].map((obj) => conMatchPromToRespObj(obj));
    res.send(match[0]);
  } catch (error) {
    console.log(error.message);
  }
});

// /players/:playerId/matches - GET - list of all the matches of a player
app.get("/players/:plrId/matches/", async (req, res) => {
  try {
    const playerId = req.params.plrId;
    const query = `
      SELECT match_details.match_id As matchId,
      match_details.match,
      match_details.year FROM
      match_details JOIN player_match_score ON  match_details.match_id = player_match_score.match_id
      WHERE player_match_score.player_id =${playerId};`;
    const playerPromise = await db.all(query);
    const player = playerPromise;
    res.send(player);
  } catch (error) {
    console.log(error.message);
  }
});

// GET - list of players of a specific match - /matches/:matchId/players
app.get("/matches/:matchId/players", async (req, res) => {
  try {
    const { matchId } = req.params;
    const query = `SELECT player_details.player_id AS playerId,
                        player_details.player_name AS playerName
                        FROM player_details JOIN player_match_score ON 
                        player_details.player_id = player_match_score.player_id
                        WHERE player_match_score.match_id = ${matchId};`;
    const playerPromise = await db.all(query);
    res.send(playerPromise);
  } catch (error) {
    console.log(error.message);
  }
});

// GET - the statistics of the total score, fours, sixes of a specific player based on the player ID - /players/:playerId/playerScores
app.get("/players/:Id/playerScores", async (req, res) => {
  try {
    const playerId = req.params.Id;
    const query = `SELECT ${playerId} AS playerId,
        player_details.player_name AS playerName,
        SUM(score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes
        FROM player_details JOIN player_match_score ON 
        player_details.player_id = player_match_score.player_id
        WHERE player_details.player_id = ${playerId};`;
    const player = await db.get(query);
    res.send(player);
  } catch (error) {
    console.log(error.message);
  }
});

// player_match_score##   match_details##     player_details##
// player_match_id        match_id            player_id
// player_id (FK)         mach                player_name
// match_id               year
// score
// fours
// sixes
module.exports = app;
