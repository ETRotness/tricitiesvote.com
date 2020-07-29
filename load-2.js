const fs = require('fs');
const fermata = require('fermata');
const Turndown = require('turndown');
const _ = require('lodash');
const asciify = require('fold-to-ascii');

const markdownify = new Turndown();

// https://voter.votewa.gov/elections/candidate.ashx?e=865&r=57373&la=&c=
// https://voter.votewa.gov/elections/candidate.ashx?e={{election_id}}&r={{race_id}}&la=&c=

const electionId = '865';

const apiUrl = `https://voter.votewa.gov/elections/candidate.ashx?e=`;
const webUrl = `https://voter.votewa.gov/genericvoterguide.aspx?e=`;

const raceIds = [
  57346, // Dist 16 senator
  57252, // Dist 16 rep 1
  57300, // Dist 16 rep 2
  57291, // Dist 8 rep 1
  57339, // Dist 8 rep 2
  57365, // Dist 9 senator
  57292, // Dist 9 rep 1
  57340, // Dist 9 rep 2
  27186, // Benton Comm 1
  27187, // Benton Comm 3
  29027, // Franklin Comm 1
  29028, // Franklin Comm 2
  57064, // Ben-Frnk Judge 1
];

const candidates = [];

// check that urls are properly formatted
const fixurl = url => {
  if (url && !/^(?:f|ht)tps?:\/\//.test(url)) {
    const newUrl = `http://${url}`;
    return newUrl;
  }
  return url;
};

raceIds.forEach((raceId, index) => {
  const raceUrl = `${apiUrl + electionId}&r=${raceId}&la=&c=`;
  const site = fermata.json(raceUrl);
  site.get(function(err, data) {
    // console.log(data)

    data.forEach((item, index) => {
      const statement_md = markdownify.turndown(item.statement.Statement);
      const pamphletUrl = `${webUrl + electionId}#\/candidates\/${raceId}\/${
        item.statement.BallotID
      }`;
      // let photo = `data:image/png;base64,${item.statement.Photo}`

      // Get images base64, convert to file, save it
      const filename = _.kebabCase(item.statement.BallotName);
      const imagePath = `/images/candidates/${filename}-original.png`;
      const buf = new Buffer.from(item.statement.Photo, 'base64');
      fs.writeFileSync(
        `./static/images/candidates/${filename}-original.png`,
        buf
      );
      console.log(`🌠 ${imagePath}`);

      const candidate = {
        candidate_ballot_id: item.statement.BallotID,
        candidate_ballot_name: asciify.foldReplacing(item.statement.BallotName),
        email: item.statement.OrgEmail,
        website: fixurl(item.statement.OrgWebsite),
        statement: statement_md,
        pamphlet_url: pamphletUrl,
        image: imagePath,
      };
      candidates.push(candidate);
      // console.log(candidate.candidate_ballot_name)
    });

    // write candidate data
    const candidateData = JSON.stringify(candidates, null, 2);
    fs.writeFileSync('./data/pamphletCandidates.json', candidateData);
    console.log(
      candidates.length,
      'items written to data/pamphletCandidates.json'
    );
  });
});
