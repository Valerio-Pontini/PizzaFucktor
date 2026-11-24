import test from 'node:test';
import assert from 'node:assert/strict';
import { editionIsFinal, rankCompetition } from '../app/competition.ts';

test('the edition only closes after all teams, places, members and ballots are complete', () => {
  const complete = { teams: 5, pizzerias: 5, participants: 10, completeTeams: 5, submittedVotes: 40 };
  assert.equal(editionIsFinal(complete), true);
  assert.equal(editionIsFinal({ ...complete, submittedVotes: 39 }), false);
  assert.equal(editionIsFinal({ ...complete, completeTeams: 4 }), false);
  assert.equal(editionIsFinal({ ...complete, pizzerias: 4 }), false);
});

test('competition ranking uses summed scores and leaves unvoted places unranked', () => {
  const places = [
    { teamId: 'a', teamName: 'A', slot: 1, voteCount: 2, totalScore: 35, pizzeria: {}, myVote: null },
    { teamId: 'b', teamName: 'B', slot: 2, voteCount: 4, totalScore: 70, pizzeria: {}, myVote: null },
    { teamId: 'c', teamName: 'C', slot: 3, voteCount: 0, totalScore: 0, pizzeria: {}, myVote: null },
  ];
  const ranked = rankCompetition(places);
  assert.deepEqual(ranked.map((place) => place.teamId), ['b', 'a', 'c']);
  assert.deepEqual(ranked.map((place) => place.rank), [1, 2, null]);
  assert.equal(ranked[0].totalScore, 70);
  assert.equal(ranked[2].totalScore, 0);
});
