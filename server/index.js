const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

const gamesPath = path.join(__dirname, '../public/games');

function getAvailableGames() {
    try {
        const dirs = fs.readdirSync(gamesPath);
        return dirs.filter(dir => {
            const stat = fs.statSync(path.join(gamesPath, dir));
            return stat.isDirectory();
        });
    } catch (e) {
        return [];
    }
}

app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/games/:gameName', (req, res) => {
    const gameName = req.params.gameName;
    const gamePath = path.join(gamesPath, gameName);
    
    if (fs.existsSync(gamePath)) {
        const indexPath = path.join(gamePath, 'index.html');
        if (fs.existsSync(indexPath)) {
            return res.sendFile(indexPath);
        }
    }
    
    res.redirect('/');
});

app.use((req, res) => {
    res.redirect('/');
});

app.listen(PORT, () => {
    console.log(`Game Center running on http://localhost:${PORT}`);
});
