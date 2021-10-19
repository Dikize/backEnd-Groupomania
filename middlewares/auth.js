const jwt = require('jsonwebtoken');

// Validation userId en comparaison avec le token
module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        // token décodé
        const decodedToken = jwt.verify(token, process.env.SECRET_TOKEN);
        const userId = decodedToken.userId;
        // Comparaisont l'ID utilisateur saisie avec l'identifiant du token décodé
        if (req.body.userId && req.body.userId !== userId){
            throw 'User ID non valable';
        } else {
            next()
        }
    } 
    catch {
        res.status(401).json({
            error: new Error('Requête non authentifiée!')
        });
    }
}
