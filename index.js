import express from "express";
import dotenv from "dotenv";
dotenv.config();
const app = express();

const github = {
    "login": "drazerrr",
    "id": 110305033,
    "node_id": "U_kgDOBpMfCQ",
    "avatar_url": "https://avatars.githubusercontent.com/u/110305033?v=4",
    "gravatar_id": "",
    "url": "https://api.github.com/users/drazerrr",
    "html_url": "https://github.com/drazerrr",
    "followers_url": "https://api.github.com/users/drazerrr/followers",
    "following_url": "https://api.github.com/users/drazerrr/following{/other_user}",
    "gists_url": "https://api.github.com/users/drazerrr/gists{/gist_id}",
    "starred_url": "https://api.github.com/users/drazerrr/starred{/owner}{/repo}",
    "subscriptions_url": "https://api.github.com/users/drazerrr/subscriptions",
    "organizations_url": "https://api.github.com/users/drazerrr/orgs",
    "repos_url": "https://api.github.com/users/drazerrr/repos",
    "events_url": "https://api.github.com/users/drazerrr/events{/privacy}",
    "received_events_url": "https://api.github.com/users/drazerrr/received_events",
    "type": "User",
    "site_admin": false,
    "name": "Anurag Dwivedi",
    "company": null,
    "blog": "",
    "location": "India",
    "email": null,
    "hireable": null,
    "bio": "Aspiring MERN Stack Dev 🚀 | Fresh talent in web development 💻 | Passion for coding 🔥",
    "twitter_username": "anuragdwivedi97",
    "public_repos": 39,
    "public_gists": 0,
    "followers": 0,
    "following": 0,
    "created_at": "2022-07-30T18:22:57Z",
    "updated_at": "2024-01-23T03:05:51Z"
  }

app.get('/', (req, res) => {
  res.send('Hello World!')
})
app.get('/login', (req, res) => {
  res.send('<h1>Hello Anurag Dwivedi!</h1>')
})
app.get('/github', (req, res) => {
  res.json(github)
})

app.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${process.env.PORT}`)
})