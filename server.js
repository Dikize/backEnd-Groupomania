// Création du serveur
const http = require('http');
const app = require('./app');

// Renvoie d'un port valide
const normalizePort = val => {
    const port = parseInt(val, 10);

    if (isNaN(port)) {
        return val;
    }
    // si la valeur de la constante "port" est supérieur ou égale à zéro donc valide: la fonction renvoie la consante port
    if (port >= 0) {
        return port;
    }
    // sinon (port<0) la fonction renvoie alors false
    return false;
};
const port = normalizePort(process.env.PORT || '4000');
app.set('port', port);

// Recherche et gestion des différentes erreurs
const errorHandler = error => {
    if (error.syscall !== 'listen') {
        throw error;
    }
    const address = server.address();
    const bind = typeof address === 'string' ? 'pipe ' + address : 'port: ' + port;
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges.');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use.');
            process.exit(1);
            break;
        default:
            throw error;
    }
};

const server = http.createServer(app);

server.on('error', errorHandler);
server.on('listening', () => {
    const address = server.address();
    const bind = typeof address === 'string' ? 'pipe ' + address : 'port ' + port;
    console.log('Listening on ' + bind);
});

server.listen(port);